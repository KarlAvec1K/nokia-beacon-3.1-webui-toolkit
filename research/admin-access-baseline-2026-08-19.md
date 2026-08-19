# Normal-admin access baseline — 2026-08-19

This captures the first full read-only access inventory from the tested Nokia Beacon 3.1.

## Test context

- Device: Nokia / ALCL Beacon 3.1
- Current role: normal authenticated local admin
- Operating context: AP / bridge configuration
- Inventory mode: read-only
- Physical radios reported by ProductConfig: 2.4 GHz + 5 GHz

## Inventory totals

- `authorizedcgi`: **146** entries
- CGI strings discovered in loaded frontend JavaScript: **278**
- Frontend CGI strings not listed in `authorizedcgi`: **132**
- Hidden (`-1`) capability leaves: **92**
- Disabled (`0`) capability leaves: **100**

## Important correction: `authorizedcgi` is not a complete runtime ACL

Do **not** interpret `not listed in authorizedcgi` as proof that a route is inaccessible.

Two known counterexamples on this exact session are:

- `capabilities_status_web_app.cgi`
- `main_web_app.cgi`

Both are callable by the current admin session even though the captured `authorizedcgi` array does not list them.

Therefore the project now distinguishes:

1. **listed-authorized** — present in `AdminUserData.authorizedcgi`;
2. **unlisted-but-runtime-readable** — not listed, but an authenticated GET succeeds;
3. **unlisted-and-denied/empty** — runtime test does not expose useful data;
4. **unknown** — not yet safely probed.

The next phase is a safe runtime GET probe of read/status endpoints.

## ProductConfig baseline

Reported support includes:

- `SupportBandSteering = 1`
- `SupportMimo = 1`
- `SupportRRM = 1`
- `SupportWPS = 1`
- `SupportSTAinfo = 1`
- `SupportContainerManagement = 1`
- `SupportsPortMirror = 1`
- `WifiVersion = wifi6`
- `SupportMaxUsers = 64`

The ProductConfig block also reports `DeviceType=ONT` and `UplinkType=GPON` even though this unit is being used as a Beacon/AP. Treat those generic product fields cautiously and prefer observed runtime behavior for mode-specific conclusions.

## Confirmed hidden-but-usable features

| Feature | UI capability | Backend path | Runtime result |
|---|---:|---|---|
| Band Steering | `wifi.wifiNetworks.bandSteering=-1` | `wlan_config_web_app.cgi?do_config_glb` | **Confirmed enabled** |
| 5 GHz OFDMA | `wifi.advancedSettings.wifi5.ofdma5=-1` | `wlan_config_web_app.cgi?do_config_glb11ac` | **Confirmed enabled** |
| STA information | `wifi.wifiStatistics.staInformation.visibility=-1` | `sta_info2_web_app.cgi` | Listed for admin; runtime detail still to inventory |
| Deep factory reset | `wifi.networkMap.deviceInfoDetails.deepFactoryReset=-1` | `restore_web_app.cgi?deep_factory` | Listed for admin; intentionally not tested |
| Container management | `maintenance.containerManagement.visibility=-1` | `container_management_status_web_app.cgi` | Product-supported and listed; runtime detail still to inventory |

## High-value hidden feature groups

### WAN / management

Hidden UI leaves include:

- WAN bridge configuration
- DHCP option 50/60/61/77/90 controls
- TR-069
- TR-369
- static routing
- domain routing
- GRE tunnel
- IPsec tunnel
- optics status
- upstream classifier

Some corresponding status/write CGI families are **not listed** for the current admin role. This does not yet prove denial; runtime GET tests are required.

### LAN

Hidden leaves include:

- DHCP relay
- port mode
- DNS configuration / DNS tables
- IPv6 prefix gateway controls

Notably `lan_ipv4_status_web_app.cgi` and `lan_ipv6_status_web_app.cgi` are listed for the current admin, while several corresponding write endpoints are not.

### Wi-Fi

Hidden leaves include:

- Band Steering
- OFDMA 2.4 / 5 / generic high-band / 6 GHz UI controls
- wireless schedule
- STA information
- channel-change history
- some encryption-mode options
- domain grouping

Band Steering and 5 GHz OFDMA already prove that a hidden UI capability does not imply backend denial.

## `service_function_web_app.cgi`

The frontend maps both:

- `ubus`
- `set_fwa_password`

to `service_function_web_app.cgi`.

It is not listed in the current `authorizedcgi` array.

This remains a high-priority role-gating target, but no write request should be made until its exact frontend payload schema and runtime authorization behavior are understood.

## `command_web_app.cgi`

The current admin allow-list explicitly contains:

- `command_web_app.cgi?pexist`
- `command_web_app.cgi?cat`

Frontend code reveals the request construction:

- existence check: `POST_CSRF` to `command_web_app.cgi?pexist+<argument>`
- cat helper: `POST_CSRF_TEXT` to `command_web_app.cgi?cat+<name>.cmd`

This means the route family is not merely a string artifact; the frontend has dedicated methods for it.

The accepted argument namespace and file boundary are not yet documented. Do not publish arbitrary path-reading examples until the intended command-file mechanism is understood.

## Candidate runtime-read probes

Priority GET-only candidates:

- `capabilities_status_web_app.cgi` — known readable despite not being listed
- `main_web_app.cgi` — known readable despite not being listed
- `access_control_status_web_app.cgi`
- `channel_change_history_status_web_app.cgi`
- `dns_status_web_app.cgi`
- `route_status_web_app.cgi`
- `tr69_status_web_app.cgi`
- `tr369_status_web_app.cgi`
- `user_mgmt_status_web_app.cgi`
- `wifi_schedule_status_web_app.cgi`
- `sta_info_web_app.cgi`
- `service_function_web_app.cgi` — GET metadata probe only, no payload

The runtime probe script deliberately reports HTTP status, redirect behavior, body length and top-level JSON keys while suppressing response values that could contain credentials or customer data.
