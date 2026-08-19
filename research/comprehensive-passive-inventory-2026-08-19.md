# Comprehensive passive WebUI inventory — 2026-08-19

## Execution

The one-shot source inventory fetched 18 bundles, discovered 25 same-origin JavaScript URLs, and inspected about 6.6 MB of source.

Safety results:

- zero CGI requests;
- zero runtime response bodies;
- zero storage reads;
- zero configuration changes;
- no credentials or client identifiers included.

## Coverage

The scan covered roles/guards, GenericService/UBUS, command CGI, radio access, container management, RRM, Optimize Network, STA information, mesh/topology, hidden read models, and frontend routes.

It extracted 64 targeted methods, 279 static endpoint mappings, and 89 route strings. These are source literals, not proof that every action is reachable or authorized.

## Interpretation

Seven stale or duplicate JavaScript URLs returned 404 while the useful application bundles were still fetched. The 404s do not imply that the WebUI backend is broken.

This is the recommended single-copy source inventory. Runtime probes remain separate so that a source scan cannot accidentally call a router endpoint.
