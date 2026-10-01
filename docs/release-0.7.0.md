# LuCI 0.7.0

## Dashboard

1. Compact network overview with local Tabler icons and reported gateway / router /
   LAN / radio / SSID branches. Multiple WANs, long names and full gateway lists
   are supported; no physical connectivity or Internet test is inferred.
2. One native details dialog for network nodes and clients, with live snapshot
   updates, working SSID client actions, Escape/Close, focus restoration and an
   explicit disappeared-object state. Inline details remain the fallback.
3. RX/TX chart legends, sample readout on pointer movement, keyboard inspection
   with Left/Right/Home/End, visible missing samples and existing gap handling.
4. Client sorting by name, signal or negotiated link rate, optional SSID grouping,
   compact rate columns, and retained filters/identities across polling.
5. A factual warning summary for WAN, memory >= 90%, unexpectedly stopped agent,
   and stale/failed sources. Unknown WAN state is not labelled disconnected.

## Theme

6. Common LuCI form spacing, control heights, disabled states, validation copy,
   selected tabs and aligned action rows. Mobile table values/actions align left.
   Bootstrap focus glow is removed; keyboard focus remains visible.

## Verification and publication

7. 65 Node tests cover existing behavior plus inspector lifecycle, disappeared
   objects, sample inspection, sorting/grouping, multiple WANs and warnings.
   Browser checks use actual production JS/CSS, installed Bootstrap CSS and
   demonstration data at 320/390/768/1100/1440/1920 px. They cover long SSIDs,
   IPv6, multiple uplinks, permission failures, modal scrolling, keyboard Escape,
   chart controls and Save contrast. No router settings are changed.
8. Both packages and RU/zh-cn translations are versioned 0.7.0. GitHub Actions
   builds the locked 24.10.7 IPK and 25.12.4 APK SDKs, publishes checksummed assets
   and triggers the shared signed feed. The RMM release lock pins this manifest.

## Upgrade

Install matching packages from this release or the signed shared feed and reload
LuCI. Open /admin/dashboard, check the overview, use node/client details, sort
and group clients, then confirm behavior after the next 30-second poll.
The authenticated legacy dashboard alias remains available. No data migration
is required. Polling, read-only ACLs and RPC methods are unchanged; no additional
probes or timers are introduced. History is local to the current browser view.
