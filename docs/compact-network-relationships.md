# Compact network relationships

The diagram now shows reported WAN gateways, the router, one Ethernet FDB summary,
and one card per Wi-Fi interface. Radio identity, local interfaces and client actions
remain available in details. No extra RPC calls or connectivity probes are added.

Connectors use measured summary edges and a 2 px SVG stroke. ResizeObserver and
requestAnimationFrame recalculate positions after telemetry changes, disclosures,
font loading and container resizing. Wide containers show one row with a bus below
the cards; narrow containers show a vertical tree. Layout uses the number of branches
and the actual container width, rather than assuming a fixed number of SSIDs.

Ethernet counts come from the same validated local FDB paths as the client list.
They do not establish a direct cable connection or Internet reachability.

Verify in the synthetic browser fixture at 320, 390, 768 and 1440 px. Open router,
Ethernet and Wi-Fi details; resize and refresh telemetry. Check that connectors touch
card edges, stay outside text and have no page overflow. Also try multiple gateways,
long labels, extra SSIDs, empty lists and unavailable sources.

The change needs a normal LuCI package build and installation to appear on routers.
No router configuration change is required.
