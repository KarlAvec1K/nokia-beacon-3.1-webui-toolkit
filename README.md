# Nokia Beacon 3.1 WebUI Toolkit

Owner-authorized research and diagnostic tools for the Nokia Beacon 3.1 WebUI.

This repository maps frontend routes, CGI endpoints, capability gates, and safe browser-side inspection methods. It is written for people who administer their own Beacon and want to understand why a normal admin session can see, read, or change less than the firmware appears to support.

## Important scope

The results are from one Beacon 3.1 firmware/operator build running in AP/bridge mode. Shared Nokia bundles contain code for other products, so a string in JavaScript is not proof that the current device implements or authorizes that feature.

The repository does not provide credential theft, brute force, remote authentication bypass, or instructions for accessing devices without authorization.

## Current normal-admin findings

The tested session was a normal authenticated local admin session, not a verified superadmin session.

### Verified settings changed successfully by normal admin

These settings were previously changed and verified by reading the status endpoint afterward:

| Setting | Hidden UI state | Write path | Verification |
|---|---|---|---|
| Band Steering | capability hidden on the tested profile | `POST /wlan_config_web_app.cgi?do_config_glb` | `wlan_config_status_web_app.cgi` and `?v=11ac` |
| 5 GHz OFDMA | capability hidden on the tested profile | `POST /wlan_config_web_app.cgi?do_config_glb11ac` | `wlan_config_status_web_app.cgi?v=11ac` |

These are the only hidden write settings currently verified for the normal admin account.

### Readable even when hidden or unlisted

The following read paths were observed as reachable or structurally readable:

- `capabilities_status_web_app.cgi`
- `main_web_app.cgi`
- `lan_status_web_app.cgi`
- `mesh_status_web_app.cgi`
- `device_home_network_status_web_app.cgi`
- `statistics_status_web_app.cgi`
- `lan_ipv4_status_web_app.cgi`
- `lan_ipv6_status_web_app.cgi`
- `whw_beacon_mode_app_status_web_app.cgi?getWorkMode`
- `container_management_status_web_app.cgi`
- `sta_info2_web_app.cgi` (body suppressed because it may contain client identifiers)

A route missing from `authorizedcgi` is not automatically superadmin-only: `capabilities_status_web_app.cgi` and `main_web_app.cgi` were readable despite not being listed.

### Exposed but not verified as writable

The frontend contains write paths for:

- RRM / Enhanced Roaming;
- Optimize Network;
- general 2.4/5 GHz wireless configuration;
- guest Wi-Fi;
- mesh add/delete;
- bridge mode;
- parental controls;
- port and routing features;
- storage and diagnostic actions.

These paths are not proof that the current normal-admin session may safely use them. RRM and Optimize Network can affect radio operation, and several other paths can disconnect clients or change management access.

## Safe workflow

1. Run the one-shot source inventory from [scripts/browser/comprehensive-passive-inventory.js](scripts/browser/comprehensive-passive-inventory.js).
2. Run the corrected authorized-CGI audit from [scripts/browser/authorizedcgi-phase2-maximum-safe-audit.js](scripts/browser/authorizedcgi-phase2-maximum-safe-audit.js).
3. Share only redacted JSON: no tokens, cookies, PSKs, private MACs, serial numbers, SSIDs, or raw response bodies.
4. Before any verified write, export or record a known-good configuration, use Ethernet if possible, change one field, and re-read the matching status endpoint.
5. Treat HTTP 200 as transport success only; verify the resulting state.

## Repository map

- `docs/`: explanations of roles, capabilities, and CGI behavior.
- `wifi/`: verified Wi-Fi setting procedures.
- `scripts/browser/`: DevTools scripts.
- `research/`: dated evidence and limitations.

## Safety boundary

Never run factory reset, reboot, firmware upgrade, password changes, deletion, command CGI, RRM, Optimize Network, or container lifecycle actions from an automated inventory script. Those require a separate, explicit decision and a recovery plan.

See [docs/admin-superadmin.md](docs/admin-superadmin.md), [docs/cgi-api-map.md](docs/cgi-api-map.md), and [SECURITY.md](SECURITY.md).

## Community files

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Issue templates](.github/ISSUE_TEMPLATE/)
- [Pull request template](.github/PULL_REQUEST_TEMPLATE.md)
