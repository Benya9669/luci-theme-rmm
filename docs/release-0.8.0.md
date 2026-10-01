# LuCI 0.8.0

## Dashboard

- Fixed native LuCI DOM rendering: optional children no longer become literal
  `null`, and router/client telemetry always remains text.
- Local block visibility/order, compact mode and reset. Critical overview,
  agent and health remain visible. Preferences stay in browser localStorage.
- 1/5/15-minute chart periods, bounded in-page history and marked collection
  gaps/counter resets. Changing the period does not collect another sample.
- Compact secondary network branches and actionable health warnings with source
  freshness. Native details and focused controls survive polling.
- Unified Wi-Fi, DHCP, bridge FDB and ARP/NDP client records with local filters,
  sorting, port search and details. Wi-Fi associations take priority.
- Passive read-only `rmm.dashboard.clients` RPC uses `ucode-mod-rtnl` once per
  existing 30-second refresh. No pings, scans or router configuration writes.
- Ethernet ingress is labelled **Via lan…**, with bridge/VLAN and ambiguous-port
  details. Cached FDB is not proof of a direct cable or current activity.
  ARP/NDP adds static-IP clients and distinguishes reachable/cached/static/failed
  neighbors. WAN, router MACs, multicast and permanent/self FDB are excluded.
  Missing hardware/driver evidence remains unknown; collection failures remain
  explicit and cached observations are stale. Kernel outputs and visible rows
  are bounded, and truncation is reported.

## Theme

- LAN interface badges wrap without overlapping icons.
- One mobile menu row with icons/labels; keyboard navigation through primary
  links and submenus, plus Russian search aliases for authorized menu entries.
- Updated RU and zh-cn dashboard translations.

## Verification

- 76 JavaScript regression tests; native ucode inventory, plugin loading,
  collection-error and compiler checks against the OpenWrt 24.10 runtime pin.
- Local synthetic preview checked at 320/390/768/1440 px in RU/EN. No overflow.
- GitHub Actions gates package builds on unit/native RPC and Chromium UI checks,
  uploads responsive screenshots, then builds locked OpenWrt 24.10.7 IPK and
  25.12.4 APK packages and translations. The release publishes checksums and
  triggers the shared signed RMM feed.

## Upgrade and limitations

Upgrade both packages and translations to 0.8.0 using the signed feed or matching
release assets. Install dependencies through the package manager: dashboard now
requires `ucode-mod-rtnl`; `luci-base` supplies rpcd ucode/fs. No data migration or
UCI configuration is required. Reload LuCI and verify `/admin/dashboard`, client
type filters, details, charts and the next 30-second refresh. A read-only SSH
check is `ubus call rmm.dashboard clients`.

These changes have been tested with synthetic snapshots. Repeat the smoke check
on installed packages; exact Ethernet-port discovery depends on router hardware
and drivers. Downstream switches/APs can expose several clients on the same port.
History is collected only while the page is open, and clears on reload/reboot.
