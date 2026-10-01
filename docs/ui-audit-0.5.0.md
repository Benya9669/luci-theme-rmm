# Visual audit: LuCI 0.5.0 — 2026-10-01

Read-only browser audit on OpenWrt 25.12.5. Dashboard checked at 320, 390,
768 and 1440 px; System form inspected at 320/390/1440 px. No fields changed,
no Save/Apply actions, no diagnostics or scans. Temporary viewport overrides
were reset and the browser returned to the dashboard.

## Verified

- Versioned theme, dashboard and search assets report 0.5.0.
- Real radio/SSID/station/DHCP values render; no initial source errors observed.
- Menu search returns matching routes, focuses the query and closes with Escape.
- A relationship station action opens its native disclosure and focuses summary.
- Dashboard/System page width remains inside viewport at measured sizes. System
  tabs scroll locally on mobile rather than widening the page.

## Findings

| Priority | Finding | Change required |
| --- | --- | --- |
| P1 | System Save button: computed text rgb(9,11,13), transparent background; label nearly invisible. | Restore readable button text/background for its actual LuCI classes, verify installed CSS. |
| P1 | At 320 px client filters resolve to two columns. Installed CSS merges the 480 px media block before the later 767 px block, overriding its one-column rule. | Make responsive ranges non-overlapping and test SDK-minified CSS, not only source. |
| P1 | Mobile System field labels align right above left-aligned controls. | Align stacked labels and fields on the same left edge. |
| P2 | Dashboard is about 6731 px tall at 1440 and 8538 px at 390. The relationship tree occupies 1028 px on desktop; System starts around y=1214. At 320, System begins around y=1787. | Put summary first; compact desktop sections; move relationship details below the main metrics. |
| P2 | Long repeated RPC names, timestamps and caveats dominate normal operation. | Keep a concise update/error state visible; preserve full source metadata in disclosure. |
| P2 | Wide label/value lists leave large horizontal gaps; graphs and lists consume full-width vertical regions. | Use aligned dense summary regions, bounded chart dimensions and a desktop grid within the shared surface. |
| P2 | Radios/SSID/stations repeated in topology and wireless section; each client requires a tall full record. | Compact radio overview and comparable station list on desktop, labelled compact records on mobile; keep details secondary. |
| P2 | Loopback has the same prominence and graph space as WAN/LAN. | Prioritize uplinks/LAN; retain loopback/other interfaces in an expandable technical region. |
| P2 | Search renders 30 results and fills almost all of a 1024 px tall viewport. | Bound the results scroll region; keep heading/query/close control reachable. |

## Next visual pass

1. Fix Save contrast, mobile label alignment and filter breakpoint collision.
2. First screen: router identity and uptime, WAN state/rates, memory/load,
   Wi-Fi station count and RMM state. Load is not CPU percentage.
3. Place compact memory/WAN histories below this overview.
4. Present radios and clients as comparable records, with native details.
5. Move topology, optional interfaces and full source metadata into secondary
   disclosures; preserve all current failure/stale semantics and telemetry.
6. Recheck compiled package CSS at 320/390/768/1440 px and real touch/keyboard.

No overall Internet health, physical topology, NAT role or absent counters
should be invented during the visual changes. Polling/ACL contracts stay intact.
