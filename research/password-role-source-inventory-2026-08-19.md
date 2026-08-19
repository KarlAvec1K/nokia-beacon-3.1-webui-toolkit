# Nokia Beacon 3.1 — Password and Role Source Inventory (2026-08-19)

## Scope

This report records a passive same-origin JavaScript source scan from the current authenticated WebUI session. It does not test or invoke password, role, GenericService, session, or privilege-related endpoints.

## Safety result

- 16 JavaScript bundles fetched; 17 same-origin URLs discovered.
- 6,577,364 source bytes inspected.
- 0 CGI requests sent.
- 0 runtime storage values read.
- 0 response bodies from router APIs retained.
- 0 credentials or password values included.
- 0 configuration changes.
- One stale `zone.js` reference returned HTTP 404.

## Password-related frontend mappings

These are source literals and frontend action names only. They do not prove that the current normal-admin account is authorized to use them, nor that the backend accepts the inferred method.

| Frontend action | Endpoint template | Inferred method | Interpretation |
|---|---|---|---|
| `get_password_info` | `password_status_web_app.cgi` | likely GET | Password/status read mapping. |
| `set_globe_pwd` | `user_mgmt_web_app.cgi?setPsw` | likely POST/action | User-management password action; not tested. |
| `set_password_info` | `password_web_app.cgi?set` | likely POST/action | Password configuration action; not tested. |
| `set_changepassword_info` | `password_web_app.cgi?savedb` | likely POST/action | Change-password save action; not tested. |
| `set_skip_password` | `password_web_app.cgi?cancel` | likely POST/action | Skip-password-change flow; not tested. |
| `set_fwa_password` | `service_function_web_app.cgi` | likely POST/action | Shared FWA/GenericService path; not Beacon-specific proof. |
| `set_wifi_pwd` | `wlan_config_web_app.cgi?setwifi` | likely POST/action | Wi-Fi password configuration action; not tested. |
| `skip_wifi_pwd` | `wlan_config_web_app.cgi?cancel` | likely POST/action | Wi-Fi password flow cancellation; not tested. |
| `session` | `websoc_session_web_app.cgi` | likely POST/action | Session mapping; included by the scanner because “session” matched its sensitive-term filter, not because it is a password action. |

## Role evidence

The scan found:

- one `superadmin` literal in `chunk-TFGNHVAU.js`, inside a `getUser()` check against a client-side session value;
- `is_ctc_admin` login-response handling that sets client-side admin/user mode flags;
- repeated `userMode`, `userModeNKBC`, and `isAdmin` UI checks;
- login routes named `changePassword`, `changeWifiPassword`, and `changePpoePassword`.

These are frontend role and UI-state indicators. They do not prove that a superadmin account exists on this Beacon, do not reveal a superadmin credential, and do not establish that changing a client-side flag would change server authorization. Server-side authorization remains the decisive control.

## Conclusions

1. The source contains ordinary password-management flows for the current product family.
2. The scan did not identify a Beacon-specific superadmin password-reset mechanism.
3. The `set_fwa_password` mapping belongs to a shared product surface and is not evidence that the Beacon supports that operation.
4. No password or privilege endpoint should be called from an inventory script.
5. Further work should remain passive unless an official, documented recovery procedure is used on a spare device.

## Role terminology hypothesis

The firmware may use a two-level Beacon model in which:

- **Admin** is the highest role exposed by the Beacon WebUI;
- **User** is the lower or restricted role;
- **superadmin** is a shared Nokia/FWA/cellular product term that is not necessarily implemented on this Beacon.

The source supports the first two labels: the login response field `is_ctc_admin` drives the client-side `Admin` versus `User` mode. It does not establish that `Admin` is equivalent to a backend `superadmin` role. The single `superadmin` literal is in a shared product module and is insufficient to identify an account, credential, or privilege boundary on this device.

This hypothesis should be tested only through non-secret metadata and documented firmware behavior. Do not infer equivalence from a UI label or attempt to change a role value client-side.
