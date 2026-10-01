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
**System в†’ Language and Style** to activate the theme. For SSH rollback:

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

## Dashboard history (0.5.0)

Memory use and per-device RX/TX rates have SVG charts with selectable 1/5/15-minute windows. History
exists only while this dashboard view is open, with at most 61 points per
series. It reuses the 30-second poll, keeps gaps after failed reads, resets
after reboot and never sums shared device counters. No background daemon,
router files, additional Internet probes or new ACL permissions are added.

## Current release

Version **0.5.0** adds icon navigation, RU/zh-cn packages, bounded dashboard histories, Wi-Fi stations and filters, network relationships and menu search.
See [release notes](docs/release-0.5.0.md) for changes, upgrade verification and
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
[0.4.0 notes](docs/release-0.4.0.md). Those packages were 0.4.0-r1;
router verification remains pending. Read permissions add only
network.device.status; the overview performs no Internet probes or writes.

## Wireless overview (0.5.0)

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
RMM and Bootstrap at 320вЂ“1440 px after installation.

## Client filters and details (0.5.0)

Search station names, MAC/IP, interface or SSID and combine with band/RSSI
filters. These controls use the current snapshot and make no extra RPC calls.
Signal ranges are explicit filters, not a quality score. Unknown RSSI has its
own option. Clear filters restores the complete associated-station list.

Expand Station details with the keyboard or touch for source timestamps,
radio/SSID, station noise when reported and a signed RSSI chart with the selected time window.
Open details and filter values survive polling. Unsupported client traffic
is explicitly unavailable. History is scoped to interface+MAC, bounded to
61 points per identity and 256 histories; disconnected identities expire after
fifteen minutes. Errors and disconnects leave gaps; connection-time resets and
router reboots reset the history. No router writes or extra permissions.

After installation verify search, combined filters, empty results, clearing,
keyboard disclosure and preservation across polling at 320/390/768/1440 px
in both RMM and Bootstrap. Device and responsive verification remain pending.

## Network relationships (0.5.0)

The overview includes a responsive semantic list of the local router, reported
uplink interfaces, default-route IPv4/IPv6 gateways, radios, SSIDs and stations.
Gateways come from network.interface.dump route entries with a zero prefix;
point-to-point routes without a nexthop remain explicitly unreported. Custom
interface names with default routes are included. Radios are grouped only by
reported phy identities; unknown identities are kept separate. Wi-Fi operating
mode is reported per interface, not inferred as the router's global role.

Select a station to clear local filters, open its details and focus the disclosure.
The relationships use the same snapshot and source timestamps, including cached
values on failures. They do not discover physical cabling, all LAN devices, NAT
mode or Internet availability. No new calls, ACLs or router changes are needed.
After installation check station links by keyboard/touch, cached source errors
and long identifiers at 320/390/768/1440 px in RMM and Bootstrap.

## Menu search (0.5.0)

The RMM theme adds a Search button above the page and Ctrl+K / Cmd+K.
Search indexes only same-origin admin links already rendered in the current
LuCI menu, with parent section labels. Hidden/disabled links, logout, external
URLs and duplicate destinations are excluded. It does not enumerate backend
routes, send queries or read settings. The existing LuCI ACL enforcement
continues to control navigation; the DOM index is not an authorization boundary.

Type words, select with Up/Down, open with Enter, close with Escape or Close.
Tab stays in the native dialog; closing restores focus. Search does not open
over another dialog or intercept shortcuts while editing settings fields.
The button appears after available menu routes load; unsupported native-dialog
browsers keep the normal menu. Russian, English and Simplified Chinese labels
are bundled in the theme, independent of dashboard translations. Results are
limited to 50 visible links, with shown/total count and an explicit empty state.

After installation verify keyboard/focus, native unsaved-change handling on
navigation, permitted menu contents and touch at 320/390/768/1440 px. Search
is a theme feature; the dashboard remains compatible with Bootstrap.

## Dashboard layout (0.6.0)

The overview prioritizes WAN link, memory, load average, Wi-Fi client count and
agent service state. Compact WAN/memory histories precede radio and client lists.
On phones, memory history starts collapsed; opening and closing disclosures is
local UI state. Radio and station disclosures retain their state across polling.
Detailed router/interface metrics and timestamps remain in native
disclosures. Source errors and cached/stale values stay explicit. Polling and
read-only ACLs are unchanged. See [release notes](docs/release-0.6.0.md).

## Dashboard interactions (0.7.0)

The Vantage-inspired network overview is visible below the summary: reported
WAN gateways, router, local interfaces, radios and SSIDs. It uses RMM tokens and
local Tabler icons, with the MIT license shipped in the dashboard package.
Multiple uplinks are kept separate. Long gateway lists show the first address
and a count; the full reported list remains available in details. The diagram
stacks below 1100 px, and radio/SSID branches stack below 481 px.

Click a network node or client to open the shared native details dialog. It
uses the same snapshot, retains working client actions, and updates while open.
Escape/Close restores focus. If an object disappears, the dialog explicitly
replaces its values with an unavailable message. Browsers without native modal
dialog support retain the inline details fallback. Source timestamps remain
in a separate disclosure. No physical cables, wired clients or Internet health
are inferred.

Client filters combine search, band and signal. Sorting uses name, signal or
reported negotiated Wi-Fi link rate; missing values sort last. Optional SSID
grouping keeps different bands visible in each row. Sorting, grouping and
filters survive polling within the current page and are not stored on the
router. Negotiated link rate is not measured traffic.

WAN charts show RX/TX labels and distinct solid/dashed lines. Move the pointer
over a chart or focus it and use Left/Right/Home/End to inspect recorded
samples. Missing values are explicit; lines do not bridge unavailable data,
long polling gaps, counter resets or restarts. History remains bounded to fifteen
minutes in this browser view. Refresh preserves chart focus.

The status summary names disconnected/unknown WAN, memory usage at least 90%,
an unexpectedly stopped agent, and failed/stale sources. Disabled or absent
agent services stay visible in the existing agent summary. Load average remains
a load average; it is not converted into CPU utilization or a health score.

Common LuCI inputs, disabled states, validation messages, tabs, action rows and
mobile table labels share the theme styling. Save/Apply and existing LuCI event
handlers are retained. Changes introduce no new RPC methods, probes, writes,
timers or router configuration.

### Upgrade and verify

Install matching theme, dashboard and translation packages from the signed
shared feed or this [release](https://github.com/Benya9669/luci-theme-rmm/releases/tag/luci-v0.7.0),
then reload LuCI. No data migration is required. Run npm test for local checks;
package builds run in GitHub Actions using the locked 24.10.7 IPK and 25.12.4 APK
SDKs. See [release notes](docs/release-0.7.0.md).

Check /admin/dashboard at 320, 390, 768, 1100, 1440 and 1920 px. Open a node,
follow an SSID client action, close with Escape, sort/group clients, and inspect
a graph with the keyboard. Confirm controls and selection remain usable after
the next 30-second poll. View system/network pages to check labels, tabs and
Save visibility; changing router settings is not required for verification.


## Next dashboard and theme changes (unreleased)

The overview removes optional `null` children through a text-safe native LuCI
DOM boundary. Names, addresses and SSIDs are rendered as text, never HTML.
Network relationships have a compact layout and a persistent disclosure for
secondary local interfaces. The theme wraps LAN device badges without image
collisions and uses a single mobile navigation row with icons and labels.

Use **Customize dashboard / Настроить обзор** to hide and reorder optional
blocks, select compact density or reset the view. Summary, agent status and
health stay visible. Preferences use `rmm-dashboard-layout-v1` in localStorage;
if storage is blocked, a message explains that preferences last for this page.
No preferences are written to UCI or the router.

History periods are 1, 5 and 15 minutes. The view retains at most 181 samples
per series (one per five-second bucket) and at most 256 station histories.
History is collected only while this page is open, cleared on reload/reboot,
and never persisted to browser storage. Gaps and counter resets are marked;
changing the visible period does not modify observations or generate RPC calls.

**Clients** combines current/cached Wi-Fi associations and known DHCP leases,
deduplicated by MAC. DHCP-only rows are explicitly unconfirmed: neither a lease
nor an IP address proves a wired link or an active connection. Type, band,
signal, search, sort and SSID grouping compose locally. Device identity and
DHCP source time are available in details; stale sources remain labelled.
The passive `rmm.dashboard.clients` RPC reads kernel FDB and ARP/NDP via
`ucode-mod-rtnl`, once per existing 30-second refresh. It sends no probes and
changes no network settings. Local-interface observations enrich DHCP identity;
Wi-Fi associations take priority. The **Ethernet path** filter shows **Via lan…**
only when the FDB reports an Ethernet bridge member. Multiple ports remain
ambiguous, and bridge/VLAN tuples are retained in details. WAN/default-route
uplinks, router MACs, multicast, permanent/self FDB entries and virtual/wireless
ports do not establish Ethernet ingress.

FDB is cached forwarding evidence, not proof of direct cabling or current
activity. A downstream switch/AP can expose several MACs on one port. Neighbor
states distinguish recently reachable, cached, static and failed entries.
Static-IP clients can appear without a DHCP lease. Old switch hardware or
unsupported drivers may expose only the CPU-facing device or no port at all.
Tables are capped at 1024 FDB and 1024 neighbor records; visible known-client
rows remain capped at 512. Truncation and RPC permission/collection failures
are explicit; failures retain the last successful observation marked stale.

The package adds only the read ACL `rmm.dashboard: clients` and depends on
`ucode-mod-rtnl`; existing `luci-base` provides rpcd ucode/fs. Install dependencies
through the normal feed/package manager when upgrading. After installation,
verify `ubus call rmm.dashboard clients` over SSH (read-only), then open
`admin/dashboard`, choose **Ethernet path**, and inspect port, bridge/VLAN and
source time. Empty tables are valid and do not prove there are no wired devices.
No UCI configuration is needed. Native ucode tests run in Actions before builds;
with a host ucode runtime, run `ucode tests/clients.uc` locally.

Health warnings link to relevant details. Menu search accepts Russian aliases
such as `вайфай`, `дашборд`, `аренды` and `прошивка`, but only searches links
already present in the ACL-rendered menu. Arrow keys/Home/End navigate primary
menu links; ArrowDown enters a submenu; Escape restores its trigger.

### Validation

Run `npm ci --ignore-scripts --no-audit --no-fund` and `npm test`. Tests now use
the actual pinned official LuCI DOM class rather than a permissive E mock.
The isolated browser fixture also uses pinned native Bootstrap CSS.

In Actions, an obligatory `ui` job installs Chromium and runs
`npm run test:browser` at 320/390/768/1440 px in RU/EN before SDK package builds.
It checks overflow, client filtering, preferences across reload, charts, native
dialogs, focus restoration, keyboard menu/search, form labels, LAN badge
collisions and unavailable data. Screenshots are uploaded as
`luci-ui-screenshots`, including when a check fails. Unit checks cover text/focus
contrast, partial/stale states, invalid preferences and unsafe telemetry text.
All fixture snapshots are synthetic; CI never contacts a production router.

After release and installation, repeat these checks on the actual LuCI pages;
fixtures do not replace a package installation smoke test. Package building
remains in GitHub Actions. See [LuCI 0.8.0 release notes](docs/release-0.8.0.md) for upgrade steps and limits.

## LuCI 0.9.0

Compact network relationships with measured responsive connectors and a native RTNL
constant namespace fix for passive client discovery. See [release notes](docs/release-0.9.0.md).
