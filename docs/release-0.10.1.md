# LuCI 0.10.1

- Match DHCPv4/v6 and local ARP/NDP/FDB by validated MAC, with conservative IPv6 matching.
- Persistent manual display names by MAC, dedicated write ACL, conflict detection and atomic storage.
- Optional background reverse DNS through the router resolver, bounded batches/cache; disabled by default.
- Russian and Chinese translations, responsive name editor, draft retention during polling.
- Offline manufacturer lookup with a bundled IEEE MA-L registry; explicit local MAC labels.
- In-page client observation history and optional nlbwmon accounting by MAC.
- Compact client previews beneath ports and SSIDs with direct detail navigation.
- Native ucode persistence/insights/RPC checks and responsive browser checks in Actions.

Upgrade matching theme, dashboard and translation packages from the common signed feed.
The package adds rpcd-mod-rrdns. Reload LuCI after installation; restart rpcd if new
methods are not visible. Verify `ubus -v list rmm.dashboard` and
`ubus call rmm.dashboard clients`. No LAN/DHCP/firewall configuration changes.
Back up `/etc/rmm-dashboard/`; sysupgrade preservation is included.

Check name save/removal, reload and reboot persistence, read-only permissions, and
DNS toggle on the router. DNS is optional and does not establish physical identity
or online status. See client-identity-matching.md for limits and recovery.

Manufacturer data, history scope and traffic setup/limits: see client-insights.md.

Includes the 0.10.0 features and fixes a browser-test selector that also matched the nested observation history summary. The 0.10.0 workflow stopped before package publication.
