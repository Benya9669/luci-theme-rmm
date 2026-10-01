# LuCI 0.5.0 (prepared, not published)

- Desktop sidebar with local Tabler icons, accessible names and tooltips.
  Click or keyboard focus opens a text submenu; Escape closes and restores
  focus. Tablet and mobile retain readable labels.
- Dashboard route: `/cgi-bin/luci/admin/dashboard`. The old Status route
  remains an authenticated alias; default landing page is preserved.
- PR #1 integrated with current P3 telemetry and standard luci.mk packaging.
- Russian and Simplified Chinese translations built as separate IPK/APK
  packages, included in Releases and the shared signed feed.
- Five-minute memory and RX/TX history from the existing 30-second poll;
  bounded browser memory, source failure gaps, counter resets and reboots
  handled, shared devices plotted once without summing interface counters.
- Active Wi-Fi radio/SSID/channel overview and associated stations with local
  DHCP names/addresses, signal and negotiated RX/TX rates. Read-only iwinfo
  and DHCP lease ACLs; no scans, reverse DNS or Wi-Fi credential reads.
  Independent failure caching; missing/disabled radios are not invented.
- Local client search, band/RSSI filters and native station disclosures,
  preserved across polling. Bounded five-minute signal history with failure
  and disconnect gaps, reconnect/reboot resets; no additional requests.
- Read-only network relationships: reported default-route gateways, router,
  radios, SSIDs and station detail actions. Custom uplink names are supported;
  source errors stay explicit. No physical topology or Internet inference.
- Theme menu search via Ctrl+K/Cmd+K and a touch button: authorized rendered
  links, categories, native dialog, keyboard navigation and focus restoration.
  No backend requests; RU/EN/zh labels bundled independently of dashboard.
- Theme install removes uci-defaults only after successful execution.

## Verification

Run `npm test`; build both locked SDKs through Actions. After installation,
check 320/390/768/900/1440 px, keyboard/touch menus, both routes, RU/zh-cn
locales and dashboard rendering in Bootstrap. No router settings are changed
by UI checks. Deploy RMM feed support before publishing this release.

## Following stages

[ROADMAP.md](../ROADMAP.md) describes the Vantage-inspired telemetry history,
wireless radios/SSID, clients, network relationships and search. Extending search to current telemetry is next; activity and client traffic require confirmed sources.
