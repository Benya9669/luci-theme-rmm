# RMM LuCI theme

`luci-theme-rmm` provides a compact dark LuCI shell matching `DESIGN.md`.
It uses the upstream Bootstrap LuCI menu and login modules, so the official
`luci-theme-bootstrap` package is a dependency. The theme does not change any
network settings and does not become active on installation.

Install the package from the signed RMM package feed, then select **RMM** in
**System → Language and Style**. To switch by SSH:

```sh
uci set luci.main.mediaurlbase='/luci-static/rmm'
uci commit luci
```

Refresh LuCI and verify the login page, navigation, forms, and mobile layout.
To return to the default theme:

```sh
uci set luci.main.mediaurlbase='/luci-static/bootstrap'
uci commit luci
```

The theme is based on the Apache-2.0 licensed LuCI Bootstrap templates.
