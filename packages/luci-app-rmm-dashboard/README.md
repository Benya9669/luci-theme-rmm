# RMM LuCI dashboard

`luci-app-rmm-dashboard` adds **Status → RMM overview**. It reads router
identity, uptime, load, memory, WAN interface state, and the local RMM agent
service through read-only ubus calls. The page refreshes every 30 seconds.
The WAN value is link state, not an Internet reachability test.

The package works with either the RMM or the default LuCI theme and has no hard dependency on the RMM agent. It does not change OpenWrt configuration.

After installing, open **Status → RMM overview**. If values show
**Unavailable**, check the LuCI session's read permissions and the router's
ubus services. Agent configuration remains under **Services → RMM agent**.
