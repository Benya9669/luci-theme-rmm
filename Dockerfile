# syntax=docker/dockerfile:1
# SPDX-License-Identifier: MIT
FROM debian:bookworm-slim AS builder

ARG OPENWRT_SDK_URL
ARG OPENWRT_SDK_SHA256

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    build-essential ca-certificates curl file gawk gettext git libncurses-dev \
    libssl-dev perl python3 python3-setuptools rsync unzip zstd \
    && rm -rf /var/lib/apt/lists/* && useradd --create-home --uid 1000 builder

USER builder
WORKDIR /home/builder
RUN test -n "$OPENWRT_SDK_URL" && test -n "$OPENWRT_SDK_SHA256" \
    && curl --fail --location --show-error --silent --retry 5 --retry-all-errors \
        --output sdk.tar.zst "$OPENWRT_SDK_URL" \
    && echo "$OPENWRT_SDK_SHA256  sdk.tar.zst" | sha256sum --check --strict \
    && mkdir sdk && tar --extract --zstd --file sdk.tar.zst --strip-components=1 --directory sdk \
    && rm sdk.tar.zst

WORKDIR /home/builder/sdk
RUN ./scripts/feeds update -a \
    && for package in luci-base luci-mod-status luci-theme-bootstrap; do \
        ./scripts/feeds install "$package"; \
       done

COPY --chown=builder:builder packages/luci-theme-rmm package/luci-theme-rmm
COPY --chown=builder:builder packages/luci-app-rmm-dashboard package/luci-app-rmm-dashboard

USER root
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*
USER builder

RUN printf '%s\n' \
      '# CONFIG_ALL is not set' \
      '# CONFIG_ALL_KMODS is not set' \
      '# CONFIG_ALL_NONSHARED is not set' \
      'CONFIG_PACKAGE_luci-theme-rmm=m' \
      'CONFIG_PACKAGE_luci-app-rmm-dashboard=m' > .config \
    && make defconfig \
    && grep -q '^CONFIG_PACKAGE_luci-theme-rmm=m$' .config \
    && grep -q '^CONFIG_PACKAGE_luci-app-rmm-dashboard=m$' .config

RUN make -j1 package/luci-theme-rmm/compile package/luci-app-rmm-dashboard/compile V=s

RUN mkdir -p /home/builder/artifacts \
    && find bin -type f \( -name 'luci-theme-rmm*.ipk' -o -name 'luci-theme-rmm*.apk' \
        -o -name 'luci-app-rmm-dashboard*.ipk' -o -name 'luci-app-rmm-dashboard*.apk' \) \
        -exec cp '{}' /home/builder/artifacts/ \; \
    && test "$(find /home/builder/artifacts -maxdepth 1 -type f \( -name '*.ipk' -o -name '*.apk' \) | wc -l)" -eq 2 \
    && cd /home/builder/artifacts \
    && find . -maxdepth 1 -type f \( -name '*.ipk' -o -name '*.apk' \) -print | sort | xargs sha256sum > SHA256SUMS

FROM scratch AS artifacts
COPY --from=builder /home/builder/artifacts/ /