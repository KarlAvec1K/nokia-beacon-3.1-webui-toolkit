# Nokia Beacon 3.1 — CGI and API Map

This map separates observed read paths from frontend write paths. It is not a list of commands to run blindly.

## Confirmed or structurally readable reads

| Endpoint | Evidence |
|---|---|
| `/main_web_app.cgi` | HTTP 200 with a substantive JSON model |
| `/capabilities_status_web_app.cgi` | HTTP 200 with capability and product data |
| `/lan_status_web_app.cgi?lan` | Read model observed |
| `/lan_status_web_app.cgi?wlan` | Read model observed |
| `/wlan_config_status_web_app.cgi` | Wireless status model |
| `/wlan_config_status_web_app.cgi?v=11ac` | 5 GHz status model |
| `/mesh_status_web_app.cgi` | Mesh/RRM status model |
| `/device_home_network_status_web_app.cgi` | Topology/client model |
| `/statistics_status_web_app.cgi` | Statistics model |
| `/lan_ipv4_status_web_app.cgi` | Detailed IPv4 model |
| `/lan_ipv6_status_web_app.cgi` | Detailed IPv6 model |
| `/container_management_status_web_app.cgi` | Container execution-environment model |
| `/sta_info2_web_app.cgi` | Non-empty text observed; body intentionally suppressed |

## Verified hidden writes

| Setting | Path | Current admin evidence |
|---|---|---|
| Band Steering | `POST /wlan_config_web_app.cgi?do_config_glb` | Changed and verified |
| 5 GHz OFDMA | `POST /wlan_config_web_app.cgi?do_config_glb11ac` | Changed and verified |

## Frontend write paths not verified for this session

These are documented only as source mappings:

- `/mesh_web_app.cgi?v_glb=set&rrm_enable=`;
- `/wlan_config_web_app.cgi?OptimizeNetwork`;
- guest Wi-Fi and general wireless save paths;
- bridge mode, mesh add/delete, parental-control, routing, storage, reboot, restore, and firmware paths.

Do not call them from a read-only audit.

## Request format

The frontend uses CSRF-protected POST requests. Depending on the action, the body is either form-encoded and encrypted or JSON for the FWA/GenericService family. A successful HTTP status alone does not prove a change. Always verify the status endpoint and preserve the previous state.

Never copy tokens, encrypted payloads, credentials, or raw response bodies into an issue or chat.
