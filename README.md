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
dependency on the RMM agent package; agent status explicitly distinguishes an absent service from stopped/disabled.

After installation, open **RMM** at `/cgi-bin/luci/admin/dashboard`.
The old `/admin/status/rmm-dashboard` route remains an authenticated alias. Select **RMM** under
**System → Language and Style** to activate the theme. For SSH rollback:

```sh
uci set luci.main.mediaurlbase='/luci-static/bootstrap'
uci commit luci
```

The theme adapts Apache-2.0 licensed LuCI Bootstrap templates. The dashboard
is MIT licensed. Design rules are in `DESIGN.md`.

## Navigation and translation integration

Desktop (900 px and wider) uses a 72 px icon sidebar with local Tabler icons,
accessible names and tooltips. Click a section icon to open its text submenu;
Escape closes it and restores focus. Tablet and mobile retain text labels.
This icon rail follows the explicitly requested navigation style.

Install `luci-i18n-rmm-dashboard-ru` for Russian or
`luci-i18n-rmm-dashboard-zh-cn` for Simplified Chinese. Both SDK
builds publish both translation packages alongside the theme and dashboard. Test builds
on `main` and PRs upload artifacts without publishing a release
or dispatching a feed update. See [the dashboard roadmap](ROADMAP.md).

## Dashboard history (prepared for 0.5.0)

Memory use and per-device RX/TX rates have five-minute SVG charts. History
exists only while this dashboard view is open, with at most 61 points per
series. It reuses the 30-second poll, keeps gaps after failed reads, resets
after reboot and never sums shared device counters. No background daemon,
router files, additional Internet probes or new ACL permissions are added.

## Current release

Version **0.4.0** adds P2 interface-table corrections and the P3 dashboard with source states, timestamps, memory and traffic.
See [release notes](docs/release-0.4.0.md) for changes, upgrade verification and
remaining device testing.

## GitHub Releases and shared feed

Push an annotated `luci-vMAJOR.MINOR.PATCH` tag after both package versions match
that tag. `.github/workflows/release.yml` builds IPK for OpenWrt 24.10.7 and
APK for OpenWrt 25.12.4, verifies the theme, dashboard and Russian/Simplified Chinese translations, and uploads them to a
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

## 0.4.0 verification

P2 headerless interface-table corrections and P3 dashboard are described in
[0.4.0 notes](docs/release-0.4.0.md). The local package versions are 0.4.0-r1;
router verification remains pending. Read permissions add only
network.device.status; the overview performs no Internet probes or writes.

## Wireless overview (prepared for 0.5.0)

The dashboard reads active Wi-Fi interfaces through iwinfo devices/info/assoclist.
It shows radio, SSID, band, channel, reported channel mode, TX power, noise,
associated stations, signal and negotiated RX/TX link rates. Missing values stay
unavailable; disabled radios are not inventoried by this endpoint. Link rates
are Mbit/s, not measured client traffic. Names and IPv4/IPv6 addresses come from
local DHCP leases; static clients without leases show their MAC. No reverse DNS
queries, scans or wireless credential reads are performed.

The package requires rpcd-mod-iwinfo and rpcd-mod-luci. Its read ACL adds only
iwinfo devices/info/assoclist and luci-rpc getDHCPLeases. Upgrade the package and
log in again so the session receives its new ACL. Verify with an associated
station: SSID/channel, DHCP identity and signal should match the router's native
Wireless page. Reads share the existing 30-second poll; each source retains its
last successful timestamp on failure and recovers independently. Test both
RMM and Bootstrap at 320–1440 px after installation.
