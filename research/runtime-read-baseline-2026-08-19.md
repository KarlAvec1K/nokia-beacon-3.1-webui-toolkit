# Nokia Beacon 3.1 — Research: Runtime Read Baseline (2026-08-19)

Tests were run from an authenticated normal-admin session on a Beacon 3.1 in AP/bridge mode. GET probes reported only status, body class/size, and shape metadata.

## Key result

`authorizedcgi` is not a complete runtime ACL.

- `capabilities_status_web_app.cgi`: HTTP 200 with a substantive JSON model despite being unlisted.
- `main_web_app.cgi`: HTTP 200 with a substantive JSON model despite being unlisted.
- `radio_receiver_status_web_app.cgi`: HTTP 403 despite capability metadata and list presence.
- `service_function_web_app.cgi`: GET 404; the frontend uses POST JSON, so the method remains unresolved.
- `sta_info2_web_app.cgi` and container status are runtime-readable.

Several unlisted status routes returned HTTP 200 with empty bodies. Empty 200 is ambiguous: it may be a stub, an AP/bridge limitation, a role response, or simply no applicable data.

## Radio-access behavior

The frontend starts radio-access polling when its capability visibility is enabled. The backend then denies the receiver-status request with 403 and the UI hides the card instead of retrying indefinitely.

## Stable list count

Three capability reads were stable at 150 raw entries and 146 unique entries. Use 146 as the normal-admin unique baseline.
