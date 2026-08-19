# Comprehensive passive WebUI inventory — 2026-08-19

## Execution safety

The one-shot source inventory completed with:

- 18 JavaScript bundles fetched;
- 25 same-origin JavaScript URLs discovered;
- approximately 6.6 MB of source inspected;
- 0 CGI requests;
- 0 response bodies read;
- 0 storage/runtime-cache reads;
- 0 configuration changes;
- no credentials, tokens, client identifiers, or router values included.

## Coverage

The report covered ten source categories:

- roles and route guards;
- GenericService and UBUS;
- command CGI wrappers;
- radio access;
- container management;
- RRM and network optimization;
- STA information;
- mesh/topology;
- hidden read models;
- frontend routes.

It extracted 64 targeted method bodies, 279 static endpoint mappings, and 89 route strings. These are source literals and do not prove that every mapped action is reachable or authorized in the current account.

## Important counts

The source scan found:

- role/guard references, including one superadmin literal and many ordinary admin checks;
- GenericService/UBUS references, dominated by FWA APN/UBUS code;
- command CGI wrappers but no command invocation;
- radio-access references and the known receiver-status mapping;
- container visibility/status logic;
- RRM and Optimize Network write mappings;
- both STA endpoints and the `WLAN_CLIENT` schema;
- mesh status/topology fields;
- hidden LAN/work-mode/capability endpoint mappings;
- route strings including `container-management`, `network-map`, `radio-settings`, `wifi-statistics`, maintenance and security routes.

The route and endpoint totals are intentionally descriptive only. Many mappings are mutating actions present in the shared frontend for other product variants; none were executed by this script.

## Handling of 404 entries

Seven fetch errors were recorded for JavaScript filenames that also appeared in the browser's resource/discovery set. This is consistent with stale chunk references, duplicate filenames under different base paths, or support bundles no longer present at one discovered URL. It does not invalidate the successful bundle scan: the key application chunk was fetched through another same-origin URL and yielded the expected RRM, STA, container, radio-access, route and endpoint evidence.

## High-confidence conclusion

The omnibus script now provides a single safe source-inventory pass for the current WebUI session. Runtime read probes remain separate by design, and all potentially mutating POST actions remain excluded.
