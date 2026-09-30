# OpenWrt RMM LuCI

This repository holds two independent LuCI packages:

- `luci-theme-rmm`: a dark, compact theme matching the RMM design system.
- `luci-app-rmm-dashboard`: a read-only local router and RMM agent overview.

The theme uses the official LuCI Bootstrap menu and login modules. It does not
activate itself or change network settings. The dashboard works with any LuCI
theme and refreshes every 30 seconds. It shows WAN interface state, not an
Internet connectivity test.

## Build

Copy `packages/luci-theme-rmm` and `packages/luci-app-rmm-dashboard` into the
`package/` directory of an OpenWrt buildroot or matching SDK. Install the
`luci-base`, `luci-mod-status`, and `luci-theme-bootstrap` feeds first. Then:

```sh
make defconfig
make package/luci-theme-rmm/compile package/luci-app-rmm-dashboard/compile V=s
```

Both packages use `PKGARCH:=all`; build with the SDK matching the router's
OpenWrt release and package format. Install packages from a signed feed or
local files with the usual `opkg`/`apk` workflow. The dashboard has no hard
dependency on the RMM agent package; agent values show Unavailable when absent.

After installation, open **Status → RMM**. Select **RMM** under
**System → Language and Style** to activate the theme. For SSH rollback:

```sh
uci set luci.main.mediaurlbase='/luci-static/bootstrap'
uci commit luci
```

The theme adapts Apache-2.0 licensed LuCI Bootstrap templates. The dashboard
is MIT licensed. Design rules are in `DESIGN.md`.

## Current release

Version **0.3.0** adds P2 components: labelled mobile records, local table scrolling, touch controls, bounded dropdowns/dialogs and entry-route highlighting.
See [release notes](docs/release-0.3.0.md) for changes, upgrade verification and
remaining device testing.

## GitHub Releases and shared feed

Push an annotated `luci-vMAJOR.MINOR.PATCH` tag after both package versions match
that tag. `.github/workflows/release.yml` builds IPK for OpenWrt 24.10.7 and
APK for OpenWrt 25.12.4, verifies both packages, and uploads them to a
GitHub Release in this repository. It also publishes a `SHA256SUMS` asset.

The separate `openwrt-rmm` repository owns the common signed package feed at
`packages.daemonlord.ru`. Configure the Actions secret `RMM_FEED_DISPATCH_TOKEN`
with permission to send `repository_dispatch` to `Benya9669/openwrt-rmm`.
After this repository publishes a LuCI Release, it dispatches the tag and
SHA256SUMS digest to RMM. RMM verifies the assets, updates and signs the stable
feed immediately, and publishes a signed active LuCI lock for future agent
releases. No second router feed or key is needed. If dispatch is unavailable,
run the RMM workflow **Sync LuCI release into signed package feed** manually.

This repository has a source remote at `git@github.com:Benya9669/luci-theme-rmm.git`.
No source or release is published merely by creating the local checkout.

## Component checks

Run `npm ci --ignore-scripts --no-audit --no-fund` and `npm test`.
The locked DOM test dependency is not shipped in either LuCI package.
Actions runs these checks before the two SDK builds.
