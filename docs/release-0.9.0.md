# LuCI 0.9.0

## Dashboard

- Compact network relationships: reported WAN gateways, router, one Ethernet
  summary and a card per Wi-Fi interface. Radio and local-interface details remain
  available without taking space in the main diagram.
- Precise 2 px SVG connectors follow measured card edges. Positions update after
  telemetry, disclosure and container-size changes. Wide layouts share a bus below
  the cards; narrow layouts use a vertical tree, including 320 px screens.
- Ethernet counts deduplicate validated local FDB MAC observations per port.
  They do not prove a direct cable connection, online state or Internet access.
- Fixed `rmm.dashboard.clients` returning `Invalid input data or parameter`:
  RTNL commands, flags and address families now use native `rtnl.const` exports.
  The RPC mock matches that namespace and rejects invalid numeric parameters.
- Updated Russian and Simplified Chinese labels and versioned asset URLs.

## Verification

78 JavaScript tests pass, including local FDB filtering and connector geometry.
Synthetic browser checks cover 320/390/768/1440 px without page overflow.
Native ucode inventory, plugin success/error and compilation checks pass.
GitHub Actions gates IPK/APK builds on unit, native and responsive browser checks.

## Upgrade and limitations

Upgrade theme, dashboard and translations together from the signed RMM feed or
matching release assets. Packages target OpenWrt 24.10.7 (IPK) and 25.12.4 (APK).
No database migration or UCI/network configuration change is required.

Reload LuCI and check `/admin/dashboard`, Ethernet and Wi-Fi details and the next
30-second refresh. Read-only RPC verification:

```sh
ubus call rmm.dashboard clients
```

Expect `fdb`, `neighbors` and `truncated`, possibly with empty observations.
Exact port discovery depends on hardware and driver evidence. Validation used
synthetic telemetry and a mocked kernel transport; verify the installed packages
on the router. No new pings, scans or RPC write permissions are introduced.