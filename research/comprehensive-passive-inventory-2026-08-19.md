# Nokia Beacon 3.1 — Research: Comprehensive Passive Inventory (2026-08-19)

## Execution

The one-shot source inventory fetched 18 bundles, discovered 19 same-origin JavaScript URLs, and inspected 6,596,715 bytes (about 6.6 MB) of source.

Safety results:

- zero CGI requests;
- zero runtime response bodies retained;
- zero storage reads;
- zero configuration changes;
- no credentials or client identifiers included.

## Coverage

The scan covered roles/guards, GenericService/UBUS, command CGI, radio access, container management, RRM, Optimize Network, STA information, mesh/topology, hidden read models, and frontend routes.

It extracted 64 targeted methods, 279 static endpoint mappings, and 89 route strings. These are source literals, not proof that every action is reachable or authorized.

## Interpretation

One stale `zone.js` URL returned HTTP 404 while the useful application bundles were still fetched. The 404 does not imply that the WebUI backend is broken.

This is the recommended single-copy source inventory. Runtime probes remain separate so that a source scan cannot accidentally call a router endpoint.


## Source-derived highlights

The scan returned 64 method hits, 279 endpoint mappings, and 89 route strings. The following mappings are frontend evidence only:

| Frontend action | Endpoint template | Classification |
|---|---|---|
| `get_radio_access_status` | `radio_receiver_status_web_app.cgi` | Read mapping; runtime authorization remains denied (403 in the tested session). |
| `get_container_info` | `container_management_status_web_app.cgi` | Read mapping; page visibility is product/mode dependent. |
| `get_sta_info2` | `sta_info2_web_app.cgi` | Read-like mapping; response may contain client identifiers and remains body-suppressed. |
| `set_rrm` | `mesh_web_app.cgi?v_glb=set&rrm_enable=` | Potential configuration change; not executed. |
| `set_ntw_optimize` | `wlan_config_web_app.cgi?OptimizeNetwork` | Potential optimization action; not executed. |
| `set_guest_wifi` | `wlan_config_guest_web_app.cgi?ConfigWhwGuest` | Potential Wi-Fi configuration change; not executed. |
| `setBridgemodeinfo` | `whw_beacon_mode_app_web_app.cgi` | Potential bridge-mode change; not executed. |
| `set_wifi_pwd` | `wlan_config_web_app.cgi?setwifi` | Potential password change; not executed. |
| `set_fwa_password` / `ubus` | `service_function_web_app.cgi` | Shared-product GenericService path; no guessed request was sent. |
| `invokeShellCatCommand` / `invokeShellExistCommand` | `command_web_app.cgi` | Command gateway wrapper; no argument was called. |

The scan found one shared frontend literal for `superadmin`; this does not prove that a superadmin account exists or that the current session can reach those features.


## Repeatability

Five consecutive passive runs between 03:57:51 and 03:59:15 produced the same 18-file manifest, the same 64 method hits, 279 endpoint mappings, 89 route strings, 6,596,715 source bytes, and the same single `zone.js` 404. No new lazy-loaded bundle appeared during these runs. This supports a stable source baseline for the current WebUI session, but it does not prove that undiscoverable or firmware-only resources do not exist.
