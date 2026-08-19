# Nokia Beacon 3.1 — Authorized CGI Skipped-Entry Review

Date: 2026-08-19  
Session: normal authenticated admin, owner-authorized local WebUI  
Source script: [authorizedcgi-skipped-entry-review.js](../scripts/browser/authorizedcgi-skipped-entry-review.js)

## Executive summary

The corrected passive review covered all 146 unique entries from the current `authorizedcgi` list:

- 41 conservative `safe-read` entries (not included in the review tables).
- 65 conservative `mutator` entries (kept separate and not called).
- 31 `ambiguous-read` entries requiring a source-derived decision.
- 9 `unknown` entries without enough evidence for a safe classification.

The script sent one capability-list GET and zero requests to the reviewed CGI routes. It fetched same-origin JavaScript source only; discovered scripts were not executed, runtime response bodies were not retained, query values were redacted, and no configuration changed.

A `mutator` label is a safety bucket based on path/query/action patterns. It is not proof that every matching route mutates state. Conversely, `likely_GET` is only a frontend-source inference and is not authorization or runtime proof.

## Reviewed table: 31 ambiguous-read entries

| # | Endpoint (values redacted) | Frontend action(s) | Inferred HTTP method | Query key(s) | Likely side effect |
|---:|---|---|---|---|---|
| 1 | `/overview_status_web_app.cgi?cache=REDACTED` | — | — | cache | unknown; do not call without a separately reviewed frontend call site |
| 2 | `/overview_status_web_app.cgi?nocache=REDACTED` | — | — | nocache | unknown; do not call without a separately reviewed frontend call site |
| 3 | `/device_status_web_app.cgi?rootalias=REDACTED` | set_root_fname | likely_POST_or_action | rootalias | potential configuration change, action, scan, deletion, or service operation |
| 4 | `/ledctrl_web_app.cgi?SetLedGlb=REDACTED` | set_glbl_led_info | likely_POST_or_action | setledglb | potential configuration change, action, scan, deletion, or service operation |
| 5 | `/domain_route_web_app.cgi?enable=REDACTED` | enable_domain_route | likely_POST_or_action | enable | potential configuration change, action, scan, deletion, or service operation |
| 6 | `/lan_status_web_app.cgi?lan=REDACTED` | get_lan_status | likely_GET | lan | read-like or product-specific action; exact behavior is unresolved |
| 7 | `/storage_web_app.cgi?storageget=REDACTED` | set_usb_info | likely_POST_or_action | storageget | potential configuration change, action, scan, deletion, or service operation |
| 8 | `/storage_web_app.cgi?ls=REDACTED` | set_usb_table_info | likely_POST_or_action | ls | potential configuration change, action, scan, deletion, or service operation |
| 9 | `/lan_status_web_app.cgi?del=REDACTED` | delete_local_devices | likely_POST_or_action | del | potential configuration change, action, scan, deletion, or service operation |
| 10 | `/lan_status_web_app.cgi?delDom=REDACTED` | delete_domain_group | likely_POST_or_action | deldom | potential configuration change, action, scan, deletion, or service operation |
| 11 | `/device_name_web_app.cgi?add=REDACTED` | add_device_management_info | likely_POST_or_action | add | potential configuration change, action, scan, deletion, or service operation |
| 12 | `/usb_web_app.cgi?import=REDACTED` | import_backup_restore | unknown | import | potential configuration change, action, scan, deletion, or service operation |
| 13 | `/usb_web_app.cgi?export=REDACTED` | export_backup_restore | unknown | export | potential configuration change, action, scan, deletion, or service operation |
| 14 | `/diag_web_app.cgi?ping=REDACTED` | set_diagnotics_info | likely_POST_or_action | ping | potential configuration change, action, scan, deletion, or service operation |
| 15 | `/diag_web_app.cgi?cancel=REDACTED` | cancel_diagnotics_info | likely_POST_or_action | cancel | potential configuration change, action, scan, deletion, or service operation |
| 16 | `/command_web_app.cgi?cat=REDACTED` | — | — | cat | unknown; do not call without a separately reviewed frontend call site |
| 17 | `/command_web_app.cgi?pexist=REDACTED` | — | — | pexist | unknown; do not call without a separately reviewed frontend call site |
| 18 | `/log_status_web_app.cgi?vlog_glb=REDACTED` | get_log | likely_GET | vlog_glb | read-like or product-specific action; exact behavior is unresolved |
| 19 | `/troubleshooting_web_app.cgi?ping=REDACTED` | ping_ip | unknown | ping | read-like or product-specific action; exact behavior is unresolved |
| 20 | `/troubleshooting_web_app.cgi?usthroughputtest=REDACTED` | get_us_throughput_info | likely_GET | usthroughputtest | read-like or product-specific action; exact behavior is unresolved |
| 21 | `/troubleshooting_web_app.cgi?dsthroughputtest=REDACTED` | get_ds_throughput_info | likely_GET | dsthroughputtest | read-like or product-specific action; exact behavior is unresolved |
| 22 | `/troubleshooting_web_app.cgi?uspacketloss=REDACTED` | get_us_packet_loss_nfo | likely_GET | uspacketloss | read-like or product-specific action; exact behavior is unresolved |
| 23 | `/troubleshooting_web_app.cgi?dspacketloss=REDACTED` | get_ds_packet_loss_info | likely_GET | dspacketloss | read-like or product-specific action; exact behavior is unresolved |
| 24 | `/troubleshooting_web_app.cgi?latencytest=REDACTED` | get_latency_test_info | likely_GET | latencytest | read-like or product-specific action; exact behavior is unresolved |
| 25 | `/troubleshooting_web_app.cgi?dnsrestest=REDACTED` | get_dns_response_test | likely_GET | dnsrestest | read-like or product-specific action; exact behavior is unresolved |
| 26 | `/firewall_web_app.cgi?fire=REDACTED` | set_firewall_info | likely_POST_or_action | fire | potential configuration change, action, scan, deletion, or service operation |
| 27 | `/firewall_web_app.cgi?level_name=REDACTED` | set_firewall_info_181mode | likely_POST_or_action | level_name | potential configuration change, action, scan, deletion, or service operation |
| 28 | `/firewall_status_web_app.cgi?fire=REDACTED` | get_firewall_info | likely_GET | fire | read-like or product-specific action; exact behavior is unresolved |
| 29 | `/ipfilter_web_app.cgi?v_glb=REDACTED` | deleteIpFilterData<br>enableIpFilterRule | likely_POST_or_action | v_glb | read-like or product-specific action; exact behavior is unresolved |
| 30 | `/ipfilter_web_app.cgi?v_glb=REDACTED` | deleteIpFilterData<br>enableIpFilterRule | likely_POST_or_action | v_glb | potential configuration change, action, scan, deletion, or service operation |
| 31 | `/ipfilter_web_app.cgi?v_glb=REDACTED` | deleteIpFilterData<br>enableIpFilterRule | likely_POST_or_action | v_glb | read-like or product-specific action; exact behavior is unresolved |

## Reviewed table: 9 unknown entries

| # | Endpoint (values redacted) | Frontend action(s) | Inferred HTTP method | Query key(s) | Likely side effect |
|---:|---|---|---|---|---|
| 1 | `/rest-usp_web_app.cgi` | — | — | — | unknown; do not call without a separately reviewed frontend call site |
| 2 | `/storage_web_app.cgi` | — | — | — | unknown; do not call without a separately reviewed frontend call site |
| 3 | `/sta_info2_web_app.cgi` | get_sta_info2 | likely_GET | — | read-like or product-specific action; exact behavior is unresolved |
| 4 | `/neighboring_AP_web_app.cgi` | get_neigh_ap_info | likely_GET | — | read-like or product-specific action; exact behavior is unresolved |
| 5 | `/whw_beacon_mode_app_web_app.cgi` | setBridgemodeinfo | likely_POST_or_action | — | read-like or product-specific action; exact behavior is unresolved |
| 6 | `/troubleshooting_web_app.cgi?v=REDACTED` | set_port_mirror | likely_POST_or_action | v | potential configuration change, action, scan, deletion, or service operation |
| 7 | `/nat_glb_web_app.cgi?v=REDACTED` | set_dmz_config<br>set_alg_config<br>set_port_forwarding<br>set_port_triggering | likely_POST_or_action | v | potential configuration change, action, scan, deletion, or service operation |
| 8 | `/nat_glb_web_app.cgi?v=REDACTED` | set_dmz_config<br>set_alg_config<br>set_port_forwarding<br>set_port_triggering | likely_POST_or_action | v | potential configuration change, action, scan, deletion, or service operation |
| 9 | `/parental_ctrl_web_app.cgi` | post_parental_nok_control<br>post_parental_control_glbl | unknown | — | potential configuration change, action, scan, deletion, or service operation |

## Interpretation and next steps

1. Do not call the ambiguous or unknown routes from an inventory script.
2. Treat command CGI (`cat`, `pexist`), storage, backup/import/export, diagnostics, firewall, IP filtering, parental controls, NAT, bridge mode, and password-related paths as requiring a separate change plan.
3. For read-like candidates, inspect the exact frontend call site and request builder before considering a single controlled read.
4. For any approved write test, capture the current state, use a wired recovery path, change one field, verify the resulting state, and restore it.
5. Keep this report redacted: never publish tokens, cookies, PSKs, SSIDs, private MAC addresses, serial numbers, or raw response bodies.

## Machine-readable run summary

```json
{
  "generatedAt": "2026-08-19T03:53:39.296Z",
  "authorizedUniqueCount": 146,
  "safeReadCount": 41,
  "mutatorCount": 65,
  "ambiguousCount": 31,
  "unknownCount": 9,
  "jsFilesFetched": 18,
  "discoveredJsUrls": 19,
  "cgiRequestsSent": 0,
  "skippedCgiRequestsSent": 0,
  "runtimeResponseBodiesRetained": 0,
  "configurationChanges": 0,
  "sourceErrors": 1
}
```

The run reported one stale `zone.js` 404 while application bundles were still scanned successfully.
