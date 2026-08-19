# Nokia Beacon 3.1 — Research: Normal-Admin Access Inventory

This document records features found in the Beacon 3.1 frontend or firmware that are hidden, disabled, unlisted, or only partially usable for the tested normal admin.

## Three independent layers

1. **Product support**: the device model and firmware implement a feature.
2. **UI capability**: the operator profile shows, disables, or hides a page/control.
3. **CGI behavior**: the backend accepts, rejects, ignores, or delays a request.

A feature may be supported, hidden, and still writable. Band Steering and 5 GHz OFDMA are confirmed examples.

## Current admin evidence

### Verified writable

- Band Steering through the normal wireless save flow.
- 5 GHz OFDMA through the normal 5 GHz save flow.

### Readable or structurally present

- capability and main device models;
- LAN/WLAN, mesh, topology, statistics, work-mode, IPv4 and IPv6 status;
- container execution-environment status;
- STA information shape.

### Listed but denied or unresolved

- `radio_receiver_status_web_app.cgi`: HTTP 403;
- `service_function_web_app.cgi`: GET returned 404, but the frontend uses POST JSON;
- command CGI: listed, but no argument was tested.

## Frontend-only write paths

The shared bundle contains mappings for wireless saves, guest Wi-Fi, RRM, Optimize Network, mesh changes, bridge mode, routing, storage, diagnostics, reboot, restore, and firmware. Presence in the bundle or `authorizedcgi` list is not proof that the normal admin can safely use them.

## Admin-facing rule

Use the normal UI or a frontend-confirmed operation, preserve state, change one setting, and verify the matching status endpoint. Do not infer superadmin access from a hidden route and do not bypass a server-side denial.
