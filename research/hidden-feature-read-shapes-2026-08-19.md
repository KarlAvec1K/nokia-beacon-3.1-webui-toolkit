# Hidden-feature read shapes — 2026-08-19

## Scope

Six GET-only status probes recorded status codes, JSON classification, top-level keys, nested keys, array lengths, and coarse text-size buckets. Values and response bodies were suppressed.

## Observed read models

| Feature | Endpoint | Shape |
|---|---|---|
| STA information | `sta_info2_web_app.cgi` | non-empty text |
| Container status | `container_management_status_web_app.cgi` | execution-environment JSON |
| Mesh | `mesh_status_web_app.cgi` | topology/RRM JSON |
| Work mode | `whw_beacon_mode_app_status_web_app.cgi?getWorkMode` | reason/result/workMode |
| LAN IPv4 | `lan_ipv4_status_web_app.cgi` | detailed LAN model |
| LAN IPv6 | `lan_ipv6_status_web_app.cgi` | detailed IPv6 model |

## Container conclusion

The backend and product flag exist, but the page is hidden in the current AP/bridge mode. No lifecycle action was found in the inspected frontend.

## Safety conclusion

A hidden page can still have a working read backend. Readability does not authorize the corresponding write action.
