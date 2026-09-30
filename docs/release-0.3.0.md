# LuCI RMM 0.3.0

## Changes

- P2 forms, tables, tabs, technical output, dropdowns and dialogs.
- Mobile tables become labelled records; original header/sorting controls remain.
- Read-only tables scroll locally; editable widgets retain visible overflow.
- Diagnostics command groups stack and include visible destination labels.
- Default controls are 36 px; login, mobile and coarse-pointer controls are 42 px.
- Dropdowns are bounded to the viewport and positioned above the bottom bar.
- Non-login dialogs expose accessible titles, bounded height, Tab containment and
  focus restoration while keeping native LuCI action handlers.
- Responsive rules use viewport width consistently, without device-width imports.
- Initial LuCI entry aliases highlight the dispatcher-resolved destination.
- DOM, CSS parsing, contrast and navigation checks run before both SDK builds.

## Upgrade and verification

Both packages use 0.3.0-r1. Actions builds IPK for OpenWrt 24.10.7 and APK for
25.12.4, publishes the release and requests the signed shared feed sync.
The RMM sync now replaces older versions of the theme/dashboard in stable
before indexing; versioned feeds and other packages remain unchanged.

Upgrade luci-theme-rmm and luci-app-rmm-dashboard through the existing feed
using the router's package manager, then fully reload the browser. No reboot
or network configuration change is required. Check the entry URL, menu focus,
DHCP, interfaces, Wi-Fi, firewall, startup, DDNS, diagnostic layout, selects,
modal focus and login at 320/390/768/1024/1440 px. Do not run diagnostics or
save network forms merely to check their appearance. Appearance rollback to
Bootstrap is documented in README.md.

Dashboard polling stays 30 seconds. No Internet probes, heartbeat changes,
configuration writes or additional RPC permissions are introduced.

## Verification limits

DOM tests exercise native node preservation, polling-created rows, nested and
editable tables, diagnostics labels, modal focus, dropdown bounds, entry route
selection and CSS parsing/contrast. They do not render browser layouts.
Live-router markup was inspected on 0.2.0; the new release still needs manual
visual checks after installation. Physical touch, actual 200% zoom, OpenWrt
24.10 and third-party dialogs remain pending. Custom components outside standard
LuCI classes may need separate compatibility fixes.
