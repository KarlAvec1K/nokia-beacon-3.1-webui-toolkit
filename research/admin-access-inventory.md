# Beacon 3.1 admin-access inventory

This document tracks features and CGI routes that exist in the Nokia Beacon 3.1 WebUI/firmware but are hidden, disabled, or not listed for the current normal-admin role.

The three layers must be kept separate:

1. **Product support** — `ProdCfgData.ProductParameters` says the platform supports a feature.
2. **UI capability** — `AdminUserData` says whether a page/control is visible (`1`), disabled (`0`), or hidden (`-1`).
3. **CGI authorization** — `AdminUserData.authorizedcgi` lists routes granted to the current authenticated role.

A feature may therefore be hardware-supported, hidden in the UI, and still writable through an authorized generic CGI. OFDMA and Band Steering are confirmed examples on the tested Beacon 3.1.

## Current normal-admin baseline

The tested normal-admin capability response exposes a substantial `authorizedcgi` allow-list. Important authorized routes include:

### Wi-Fi

- `wlan_config_status_web_app.cgi`
- `wlan_config_status_web_app.cgi?v=11ac`
- `wlan_config_status_web_app.cgi?v=6g_band`
- `wlan_config_status_web_app.cgi?v=11ac_highband`
- `wlan_config_web_app.cgi?do_config_glb`
- `wlan_config_web_app.cgi?do_config_glb11ac`
- `wlan_config_web_app.cgi?do_config_6gband`
- `wlan_config_web_app.cgi?do_config_glb11ac_highband`
- `wlan_config_web_app.cgi?do_config_mlo`
- `wlan_config_web_app.cgi?OptimizeNetwork`
- guest Wi-Fi read/write CGI
- WPS CGI for 2.4/5/high-band

Presence in `authorizedcgi` does **not** prove that a physical 6 GHz or second 5 GHz radio exists. ProductConfig remains the hardware source of truth; the tested Beacon 3.1 reports only 2.4 GHz and 5 GHz physical radios.

### Mesh / Beacon management

- `mesh_status_web_app.cgi`
- `mesh_web_app.cgi?add`
- `mesh_web_app.cgi?del`
- `mesh_web_app.cgi?v_glb=set`
- `whw_beacon_mode_app_status_web_app.cgi?getWorkMode`
- `whw_beacon_mode_app_web_app.cgi`

The frontend constructs the RRM path under the authorized `mesh_web_app.cgi?v_glb=set` family.

### Diagnostics / maintenance

- `reboot_web_app.cgi`
- `restore_web_app.cgi?restore_glb`
- `restore_web_app.cgi?deep_factory`
- `diag_web_app.cgi?ping`
- `diag_web_app.cgi?cancel`
- `diag_status_web_app.cgi`
- `troubleshooting_status_web_app.cgi`
- TR-143 speed-test status/trigger routes
- log status/config routes

### Notable command CGI

The normal-admin allow-list contains:

- `command_web_app.cgi?cat`
- `command_web_app.cgi?pexist`

These are high-value research targets because the route names imply file/path-related operations, but their exact accepted parameters and authorization boundaries are **not yet documented**. Research should begin with frontend-code inspection and non-sensitive test inputs only.

## Product-supported but hidden/partially hidden

Confirmed examples from the tested capability profile:

| Feature | Product support | UI state | Current result |
|---|---:|---:|---|
| Band Steering | `SupportBandSteering=1` | `wifi.wifiNetworks.bandSteering=-1` | Successfully enabled through authorized Wi-Fi CGI |
| 5 GHz OFDMA | Wi-Fi 6 platform | `wifi.advancedSettings.wifi5.ofdma5=-1` | Successfully enabled through authorized Wi-Fi CGI |
| 2.4 GHz OFDMA | Wi-Fi 6 platform | `wifi.advancedSettings.wifi24.ofdma24=-1` | Not enabled/tested |
| RRM | `SupportRRM=1` | network-map RRM control present | CGI path identified; behavior still to test |
| Wireless schedule | frontend implementation exists | `wifi.wirelessSchedule.visibility=-1` | schedule CGI not currently confirmed in normal-admin allow-list |
| STA information | frontend feature exists | `wifi.wifiStatistics.staInformation.visibility=-1` | `sta_info2_web_app.cgi` is authorized |
| Deep factory reset | implementation exists | UI `deepFactoryReset=-1` | `restore_web_app.cgi?deep_factory` is authorized |

## Frontend-present but not currently listed in normal-admin authorization

These are especially useful for admin-vs-superadmin comparison. Their presence in JavaScript does not mean the current account may call them.

### `service_function_web_app.cgi`

The frontend maps both a generic `ubus` action and an FWA password-related action to:

```text
service_function_web_app.cgi
```

It was not present in the captured normal-admin `authorizedcgi` list. This makes it a primary candidate for role-gated functionality.

Do not assume arbitrary UBUS access. The accepted payload schema must be recovered from frontend call sites before testing.

### Other frontend route families to compare

The generic frontend bundle contains routes for features that may be for other products/operator profiles, including:

- wireless scheduling
- TR-069 / TR-369 views
- static/domain routing
- DNS configuration
- cellular/FWA management
- Bluetooth/PoE
- PON mode
- game mode
- delta configuration export

For Beacon 3.1, each route must be classified as:

- physically applicable,
- generic frontend-only,
- operator-hidden but authorized,
- or role-gated/not authorized.

## Current high-priority inventory questions

1. Which CGI strings exist in the loaded frontend but are absent from `authorizedcgi`?
2. Which UI leaves are `-1` while their corresponding CGI is authorized?
3. Which controls are `0` (disabled) rather than `-1` (hidden)?
4. Is `service_function_web_app.cgi` exclusively superadmin/operator-authorized on this build?
5. What are the exact safe/read-only semantics of `command_web_app.cgi?cat` and `?pexist`?
6. Does AP/bridge mode reduce backend functionality independently of role authorization?
7. Which differences come from firmware build versus operator profile?

## Inventory script

Run [`scripts/browser/admin-access-inventory.js`](../scripts/browser/admin-access-inventory.js) from DevTools while authenticated.

The script is read-only. It:

- fetches the capability response;
- extracts the current role's `authorizedcgi` list;
- scans loaded JavaScript bundles for CGI strings;
- compares frontend-present endpoints against the current allow-list;
- flattens UI capability flags and highlights high-value `-1` entries;
- reports ProductConfig support fields and radio definitions;
- does not send POST/PUT/DELETE requests;
- does not output session tokens or Wi-Fi passwords.

Save sanitized output from multiple firmware/operator versions so the repo can eventually maintain a role/firmware comparison matrix.
