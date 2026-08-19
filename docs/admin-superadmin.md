# Normal admin versus superadmin

The WebUI exposes three separate layers. They must not be treated as the same permission system.

1. **Product support**: the firmware and hardware implement a feature.
2. **UI capability**: the operator profile decides whether a page or control is visible or disabled.
3. **Backend behavior**: the CGI accepts, rejects, ignores, or delays a request for the current session and operating mode.

A feature can therefore be supported but hidden, visible but disabled, readable but not writable, or present in shared JavaScript but unsupported on this device.

## What is verified for the current normal admin

Verified hidden writes:

- Band Steering;
- 5 GHz OFDMA.

Verified reads:

- capability and main device models;
- LAN/WLAN, mesh, topology, statistics, work-mode, IPv4 and IPv6 status;
- container status;
- STA information shape.

Observed denial:

- `radio_receiver_status_web_app.cgi` returned HTTP 403 even though the capability node was present and the CGI appeared in `authorizedcgi`.

Observed unresolved behavior:

- `service_function_web_app.cgi` returned 404 to a GET, but the frontend uses POST JSON;
- `command_web_app.cgi?cat` and `?pexist` are listed, but no argument was tested;
- RRM, Optimize Network, bridge mode, guest Wi-Fi, mesh changes, and other write paths were not executed in the read-only phase.

## How to read the evidence

- **Hidden** (`-1`) means the UI is suppressing a capability.
- **Disabled** (`0`) means the UI shows a control but blocks it.
- **Visible** (`1`) means the UI intends to expose it.
- **Listed in authorizedcgi** is advisory metadata, not a complete runtime ACL.
- **HTTP 200** proves transport success, not that a setting was applied.
- **HTTP 403** is a strong denial signal, but the cause may be role, mode, device applicability, or operator integration.

## Admin setting guide

| Area | Current normal-admin status | Guidance |
|---|---|---|
| Band Steering | Verified writable | Use the documented Wi-Fi procedure and verify both bands afterward. |
| 5 GHz OFDMA | Verified writable | Use the documented frontend-compatible flow and verify the 5 GHz status. |
| RRM / Enhanced Roaming | Frontend write path found, not verified | Do not call automatically; it changes mesh radio behavior. |
| Optimize Network | Frontend write path found, not verified | Do not call automatically; it can alter channel selection and run for minutes. |
| Guest Wi-Fi and primary Wi-Fi | Write paths exist | Treat as configuration changes; preserve the current state first. |
| Mesh add/delete and bridge mode | Write paths exist | Can disconnect nodes or change topology; not part of passive inventory. |
| Container lifecycle | No lifecycle call sites found | Status is readable; install/start/stop/update actions were not found. |
| Reboot, factory reset, firmware, passwords | Present in shared frontend | Never include in an automated test. |

This table describes evidence from one normal-admin session. It is not a promise that another firmware or operator profile will behave the same way.

## Recovery rule

Before a write:

1. Use a wired connection if possible.
2. Export or record a known-good configuration.
3. Change one setting only.
4. Capture the pre-change status shape.
5. Perform the vendor/frontend operation.
6. Re-read the matching status endpoint.
7. Stop immediately if the UI, LAN, or Wi-Fi becomes unstable.

Do not use hidden routes to bypass authentication or role checks.
