# Client identity matching

The dashboard combines DHCPv4, DHCPv6, local bridge FDB and ARP/NDP using a
validated unicast MAC address. DHCPv4 names take priority when both leases name
the same MAC. The client row shows a preferred IPv4 (otherwise non-link-local IPv6)
and the number of extra IPs. All addresses remain searchable and visible in details
and the address tooltip. Equivalent compressed/expanded IPv6 and lease prefix
suffixes are deduplicated. Invalid addresses are omitted.

A DHCPv6 lease without a valid MAC may provide a name for an existing local NDP
client only when its exact IPv6 has one unambiguous MAC owner with reachable or
permanent evidence, and DHCP, inventory and interface sources are all fresh.
An ambiguous address, cached-only neighbor or stale source cannot establish a
new identity match. Names and DUID/EUI-64 patterns alone never merge devices.
Details show the name source and matching evidence. Cached DHCP metadata is
identified by the existing source timestamp/state.

## Manual display names

Open client details → **Edit display name**, enter a name and explicitly save.
Names follow the validated MAC across IP changes and take priority over DHCP.
**Use automatic name** removes only that MAC's alias. This does not modify DHCP,
LAN, firewall, routes or the client itself. Different physical MACs remain separate.

The narrow `rmm.dashboard.set_name` RPC requires write permission; read-only users
can inspect names but cannot save. Input is limited to 256 UTF-8 bytes without
control characters, and storage to 512 entries / 128 KiB. Concurrent edits to the
same MAC are rejected; reopen the editor to read the current value before retrying.
An unsaved draft survives telemetry refreshes. Storage errors disable editing.

Names are stored atomically in `/etc/rmm-dashboard/client-names.json`, mode 0600,
with a directory lock and versioned JSON. A corrupt file is reported and preserved.
The keep.d entry preserves `/etc/rmm-dashboard/` during sysupgrade; include this
path in router backups. After a process is forcibly killed during a write, a stale
`client-names.json.lock` directory may require administrator inspection/removal
while rpcd is stopped. Preserve the JSON before recovery. The temporary file is
not authoritative. There are no credentials in this storage.

## Optional reverse DNS

Enable **DNS names** in the clients section to resolve clients without a manual
or DHCP name. The default is off; the switch is a browser preference. Requests
use `network.rrdns.lookup` from the packaged `rpcd-mod-rrdns` dependency and the
router's configured resolver, without changing DNS settings or selecting a public
resolver. This generates PTR queries, not pings or scans.

Lookups are asynchronous and independent of the 30-second telemetry refresh:
maximum eight unique addresses per cycle, one request in flight, 1-second timeout.
Only fresh local telemetry schedules them. Ambiguous addresses, link-local,
multicast and loopback addresses are skipped. Results only label existing clients;
DNS names never merge MACs or prove that a client is online. Details identify DNS
as the name source. A DNS failure leaves the main dashboard usable.

The page keeps at most 256 cached MAC+IP entries: positive names for ten minutes,
missing/invalid answers for two minutes, and RPC failures retried after 30 seconds.
The cache is in memory and disappears on reload. Disabling DNS discards pending
results and stops displaying DNS names. Manual names remain on the router.

Run `npm test` and inspect the synthetic browser fixture at mobile/desktop widths.
Verify one client row for same-MAC IPv4/IPv6, DHCPv6-only naming, complete details,
address search, and no speculative merge after ambiguity or source failure.
After installing a package containing this change, reload `/admin/dashboard`.

Reference: https://github.com/openwrt/luci/blob/master/libs/rpcd-mod-luci/src/luci.c
(`getDHCPLeases` may omit an empty MAC and returns IPv6 lease addresses separately).
