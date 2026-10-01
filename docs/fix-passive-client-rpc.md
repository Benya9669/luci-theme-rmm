# Passive client RPC: constant namespace fix

LuCI 0.8.0 registered `rmm.dashboard` but `clients` returned
`Invalid input data or parameter`. Native ucode RTNL exports numeric constants
under `rtnl.const`; the plugin incorrectly read constants directly from `rtnl`.
The first RTM_GETLINK request therefore received an absent command/flag/family.

The plugin now reads all command, flag and address-family constants from
`rtnl.const`. No router configuration or RPC write access is changed.

The test transport now matches the native constant namespace and rejects
non-integer parameters. With the published plugin it reproduces the reported
error; after the fix plugin loading, passive collection and failure checks pass.
The test still substitutes the kernel transport and does not prove operation on
a particular router.

After installing a release containing this fix, read-only verification is:

```sh
ubus call rmm.dashboard clients
```

Expect `fdb`, `neighbors` and `truncated` fields, possibly empty. Then check
`/admin/dashboard` after the next 30-second poll. No UCI setup is needed.
This fix is included in the LuCI 0.9.0 release.
