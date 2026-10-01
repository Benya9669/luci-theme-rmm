# LuCI 0.6.0

## RMM dashboard design
- Responsive RMM operations surface based on the approved SVG concept.
- Router identity and uptime, WAN link, memory, load average and Wi-Fi client
  count appear first. Agent service state and configured heartbeat stay visible.
- WAN history and memory share a compact desktop/tablet chart row; memory is
  initially collapsed when opening the page on a phone.
- Radio/SSID summaries and comparable client rows replace long repeated metric
  blocks. Clients stack into labelled records on narrow screens; filters use
  one column through 480 px and two columns on tablets.
- Native station and radio details retain open state across polling. MAC,
  negotiated rates, noise, connection time and signal history remain available.
- Router metrics, other interfaces, network relationships and source metadata
  move into disclosures. Source failures and stale data remain visible in the
  overview and affected radio/client summaries.
- Existing read-only RPC ACLs, 30-second polling, bounded history, local filters
  and authenticated dashboard aliases are preserved. No new probes or writes.
- RU and Simplified Chinese catalogs cover the new interface labels.

## Theme corrections
- Save remains legible after Apply/negative actions in current Bootstrap.
- Mobile setting labels align left above controls, including Bootstrap labels.
- Menu search dialog height is capped at 640 px on large screens.

## Verification and upgrade
Run npm test; Actions builds the locked 24.10.7 IPK and 25.12.4 APK SDKs.
Local browser checks use actual dashboard code, installed Bootstrap CSS and
demonstration telemetry at 320, 390, 768 and 1440 px. Settings are not modified.
Install matching theme/dashboard/translation packages from this release or the
signed shared feed; reload LuCI after updating. Check /admin/dashboard,
source failure states, native details and keyboard navigation on the router.
The default memory disclosure state is chosen when the view opens; resizing
preserves the user's disclosure choices. No data migration is needed.
