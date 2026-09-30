# LuCI RMM 0.4.0 — P2 corrections and P3 dashboard

## Changes

- Headerless native interface/Wi-Fi summary tables stack below 600 px; actions wrap.
- Theme CSS/JS and dashboard CSS carry package-version URLs to avoid mixed cached assets after upgrade.
- Dashboard uses one continuous work surface with System, Network and RMM agent sections.
- Each source displays its state and last successful response time. Failed requests retain the last data with a stale label; first failures and permission denial are explicit.
- Retry and scheduled polling share in-flight requests. Polling remains 30 seconds and live announcements occur on state transitions only.
- Memory used is total minus available, with a percentage; missing or inconsistent memory is unavailable.
- Logical interfaces show device, link state, address, received/sent totals and RX/TX MiB/KiB/B per second over the actual sample interval. Counter reset and reboot suppress invalid rates.
- Missing, stopped and disabled RMM service states are distinct. Agent configuration is read afresh without using or invalidating the LuCI configuration cache.

## Data sources and permissions

Existing read sources: system.board, system.info, network.interface.dump, service.list scoped to rmm-agent, and uci.get scoped to rmm-agent/main.
The only added ACL method is read-only network.device.status. No configuration writes, Internet probes or heartbeat changes are introduced.

Device totals belong to kernel devices, not an Internet billing period. Multiple logical interfaces may share one device; the dashboard does not sum them. First successful sample displays Collecting; missing counters display Unavailable. Temperature is deferred until a supported read source is confirmed.

References: [netifd device status](https://github.com/openwrt/netifd/blob/master/ubus.c), [OpenWrt ubus/UCI](https://openwrt.org/docs/techref/ubus).

## Upgrade and checks

Both packages are prepared as 0.4.0-r1. Build through GitHub Actions with the existing two-SDK release workflow. After installing from the signed feed, reopen Status → RMM. A full reload can still be needed for LuCI's view-module cache. Package update/ACL activation follows the normal OpenWrt package procedure; this change does not reboot the router.

Run npm test and node --check on the modified JavaScript. Tests cover cached/partial failures, missing service, traffic reset and recovery. They use a DOM fixture, not browser layout rendering.

Visual validation of the new P3 and headerless-table correction is pending package installation, including Bootstrap, physical touch, 200% browser zoom and OpenWrt 24.10. Live read-only P2 checks on installed 0.3.0 are in p2-router-verification.md.
