Native DOM fixture extracted without modifications from the DOM class in official LuCI luci.js.
Source: https://github.com/openwrt/luci/blob/1fcad1ef1f5f28fe2b199dba8a060f9b5c58bb46/modules/luci-base/htdocs/luci-static/resources/luci.js
License: Apache-2.0 (see packages/luci-theme-rmm/LICENSE). Only the surrounding class factory is supplied by tests.

Bootstrap cascade.css is pinned to the same official LuCI commit; its copyright and Apache-2.0 notice are retained. Test servers serve both fixtures locally and use synthetic router data only.

The RTNL transport fixture exports constants only through `const`, matching
native lib/rtnl.c at ucode commit 3f64c8089bf3ea4847c96b91df09fbfcaec19e1d.
It rejects non-integer command/flags/family values; it is not a real kernel
transport. Native ucode executes the plugin and inventory tests.
