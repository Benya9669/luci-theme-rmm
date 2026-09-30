# LuCI RMM 0.2.0

## Changes

- Desktop sidebar at 900 px and wider; mobile bottom navigation below 600 px.
- Current destination highlighting, keyboard-accessible tablet submenus,
  Escape dismissal and focus restoration on mobile/tablet.
- Shared theme/dashboard colors, wrapping device identity and mobile login fields.
- Russian dashboard labels and a language-neutral RMM menu entry.
- Protection against wide content overflowing the page and mobile CBI form layout.
- Navigation regression checks run before both SDK builds in GitHub Actions.

## Packages and upgrade

Both packages are version 0.2.0-r1. GitHub Actions builds IPK for OpenWrt 24.10.7
and APK for OpenWrt 25.12.4 and dispatches the published release to the existing
signed RMM feed. Upgrade luci-theme-rmm and luci-app-rmm-dashboard through that
feed using the router's package manager, then refresh LuCI with a full reload.
No router configuration change or reboot is required by this release.

Verify login, current menu destination, Tab/Shift+Tab/Escape, system forms,
network tables and RMM dashboard at 320/390/768/1024/1440 px. Dashboard polling
remains 30 seconds; this release adds no Internet probes or heartbeat changes.
To roll back appearance, select Bootstrap in System / Language and Style or
use the SSH rollback command in README.md.

## Verification limits

The live-router audit used 0.1.0 on OpenWrt 25.12.5; 0.2.0 has not yet been
validated on that router or a physical phone. Wide tables currently scroll
within the page content region; P2 will refine individual table containers and
touch targets. True 200% zoom and physical OpenWrt 24.10 testing remain pending.
