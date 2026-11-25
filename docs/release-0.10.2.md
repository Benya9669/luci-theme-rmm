# LuCI 0.10.2

- The dashboard reads the enable flag and polling intervals through a dedicated read-only RPC. Dashboard access no longer grants access to the complete agent configuration.
- The desktop layout shows the router hostname above the page content.
- Upgrade the theme and dashboard packages together and reload rpcd to activate the updated ACL.
