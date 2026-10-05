# Client insights

## Manufacturer lookup

The dashboard ships an offline IEEE MA-L table (40,285 unambiguous assignments).
No MAC is sent to an Internet service. The assignment identifies an organisation,
not a precise device model. Unknown prefixes remain unknown; locally administered
MACs are explicitly labelled and never matched to a manufacturer.

Source: https://standards-oui.ieee.org/oui/oui.csv
The packaged vendors.json records the source CSV SHA-256 and entry count.
The CSV registry data comes from IEEE; the generator and application use the
repository software licence. Conflicting assignments are omitted.

To update during development, download the CSV yourself, then run from this repo:

```sh
python scripts/update-vendors.py /path/to/oui.csv packages/luci-app-rmm-dashboard/root/usr/share/rmm-dashboard/vendors.tsv
```

Review the generated table and metadata before publishing. Verify a known global
MAC, an unknown prefix and a locally administered MAC. The narrow read-only ubus
method can be checked with synthetic data:

```sh
ubus call rmm.dashboard vendors '{"macs":["00:1B:21:00:00:09","02:1B:21:00:00:09"]}'
```

## Observation history

History exists only while this dashboard page is open, in browser memory. Reloading
clears it. It is not a persistent router activity log. It records first/last fresh
observations, IP changes, connection-path changes and absence/reappearance in
complete reports. Missing, stale or truncated sources never prove disappearance
or offline status. One MAC has one journal, with at most 512 clients and 32 events
per client; the overview shows the latest 30 events.

## Per-client traffic

The optional source is an already installed and running nlbwmon daemon.
The dashboard does not install, start or configure it. No UCI, firewall, LAN or
DHCP changes are made. Without this source, traffic is explicitly unavailable.

The backend reads a fixed command, bounded to two seconds and 256 KiB:

```sh
nlbw -c json -g mac -o mac
```

This reads the daemon accounting database grouped by MAC. Totals cover its current
accounting period; rates are averages between valid samples, not Wi-Fi link speeds.
The source is refreshed at most once per 30 seconds. Counter resets, reboots,
missing samples and long gaps discard the rate baseline. Unknown usage is never
reported as zero. Hardware offload and bridged traffic may not be accounted for;
coverage depends on the existing nlbwmon setup and platform.

Check the optional source without modifying configuration:

```sh
command -v nlbw
nlbw -c json -g mac -o mac
ubus call rmm.dashboard clients
```

Confirm traffic.status, traffic.at and counters for the same MAC shown in client
details. See https://github.com/jow-/nlbwmon for accounting behaviour and setup.
If commands are unavailable, install/configure nlbwmon separately only after
reviewing the router's supported packages and desired accounting scope.

## Network previews

Ports and SSIDs show up to three client names beneath the connection card.
The card opens its full details; individual client buttons open client details.
A MAC observed on two SSIDs retains the corresponding interface in each preview.
FDB only locates the learned port: downstream switches can share a router port.
Preview names and counters do not establish a direct cable or device identity.

## Verification

Run the JavaScript tests, native ucode tests and Actions browser checks. Test
320/390/768/1440 px, client details, manufacturer search, history, missing accounting,
rate resets and one MAC on two SSIDs. Browser fixtures contain synthetic data.