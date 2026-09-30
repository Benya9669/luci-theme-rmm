# P2 live-router verification — 2026-09-30

Installed theme: 0.3.0 assets; OpenWrt reports 25.12.5. Read-only browser audit; no saves, applies, diagnostics, scans or service actions.

- CSS P2 is now present. Earlier stale stylesheet mismatch is no longer observed.
- DHCP labelled records and diagnostic columns fit at 320/390 px. DHCP page overflow is zero at 320/390/768/1024/1440 px.
- Static lease edit dialog fits 320 x 740 viewport (296 px wide, 12 px outer margin), with no document overflow.
- Shift+Tab from first input wraps to Save; Tab from Save wraps to first input.
- Open lease-time dropdown uses fixed placement, fits within 320 x 740 and leaves space above mobile navigation.
- Escape uses native LuCI cancellation: closes the dialog and returns focus to Edit. No values were changed.
- Firewall zones, Wi-Fi and DDNS at 320 px have no document overflow; Wi-Fi's local table still needs the new headerless-summary correction.
- Interfaces at 320 px have 381 px document overflow because their summary table has no header. Corrected in 0.4.0 source; post-install visual verification is pending.

Browser viewport restored and tab returned to RMM dashboard. Physical touch, actual 200% zoom, OpenWrt 24.10 and third-party modal coverage remain unverified. P2 is not considered fully closed by these checks.
