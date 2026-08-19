# Nokia Beacon 3.1 WebUI Toolkit

Community research and owner-access tooling for the **Nokia Beacon 3.1**.

This repository documents hidden WebUI capabilities, CGI/API endpoints, browser-side CSRF/encryption behavior, Wi-Fi features that may be present but hidden by operator profiles, and safe methods for owners to inspect or configure their own Beacon 3.1 when the normal UI does not expose those controls.

## Scope

This project is specific to the **Nokia Beacon 3.1**. Findings may not apply to other Nokia ONTs, gateways, or Beacon generations.

Current confirmed test platform:

- Product: Nokia / ALCL Beacon 3.1
- Wi-Fi generation: Wi-Fi 6
- Radio vendor reported by ProductConfig: Realtek
- Bands: 2.4 GHz + 5 GHz
- 5 GHz supported channel widths: 20/40/80/160 MHz
- WebUI architecture: JavaScript frontend + CGI backend

## Confirmed findings

### Product capabilities

Observed through `capabilities_status_web_app.cgi`:

- `SupportBandSteering = 1`
- `SupportRRM = 1`
- `SupportMimo = 1`
- `SupportWPS = 1`
- `SupportWifi = 1`
- `WifiVersion = wifi6`
- `SupportMaxUsers = 64`

### Confirmed read endpoints

- `GET /main_web_app.cgi`
- `GET /lan_status_web_app.cgi?lan`
- `GET /lan_status_web_app.cgi?wlan`
- `GET /wlan_config_status_web_app.cgi`
- `GET /wlan_config_status_web_app.cgi?v=11ac`
- `GET /capabilities_status_web_app.cgi`
- `GET /mesh_status_web_app.cgi`
- `GET /device_home_network_status_web_app.cgi`
- `GET /statistics_status_web_app.cgi`
- `GET /wlan_config_guest_status_web_app.cgi`

### Confirmed write endpoints

- `POST /wlan_config_web_app.cgi?do_config_glb` — 2.4 GHz
- `POST /wlan_config_web_app.cgi?do_config_glb11ac` — 5 GHz
- `POST /mesh_web_app.cgi?v_glb=set&rrm_enable=` — RRM / Enhanced Roaming path exposed by frontend code

### Browser-side POST behavior

The WebUI uses:

- `localStorage.token`
- `localStorage.pubkey`
- `csrf_token=<token>` appended to the form payload
- `crypto_page.encrypt_post_data(pubkey, payload)`
- `Content-Type: application/x-www-form-urlencoded`

A `200 OK` alone does **not** prove a setting was applied. Always re-read the status endpoint after a change.

## Verified hidden settings

### 5 GHz OFDMA

The normal UI/operator capability profile can hide OFDMA even though the backend accepts it.

Verified state transition:

```text
X_ASB_COM_OfdmaEnable: 0 -> 1
```

The important write field is:

```text
wl_ofdma=1
```

### Band Steering

The Beacon 3.1 ProductConfig reports Band Steering support, while some operator UI profiles hide the control.

Verified state transition:

```text
2.4 GHz X_ALU_COM_Sync_SSID_to_5G: 0 -> 1
5 GHz   X_ALU_COM_Sync_SSID_to_5G: 0 -> 1
```

On the tested build, the successful form fields were:

```text
sync_value=true
delay=2
```

`sync_value=1` returned HTTP success but did not apply the setting on the tested firmware.

## Hidden / internal VAPs

The interface mapping exposes:

```text
WLAN1      -> SSID1
WLAN1-VAP0 -> SSID2
WLAN1-VAP1 -> SSID3
WLAN1-VAP2 -> SSID4
WLAN0      -> SSID5
WLAN0-VAP0 -> SSID6
WLAN0-VAP1 -> SSID7
WLAN0-VAP2 -> SSID8
WLAN0-VAP3 -> SSID9
```

`SSID9` appears as a hidden 5 GHz VAP in topology/configuration data. Do not assume it is a normal user SSID; it may be tied to internal mesh/backhaul behavior.

## Admin vs. superadmin research

A major goal of this repository is to document what a legitimate owner can still inspect or configure when:

- the ISP/operator hides pages or controls,
- a superadmin credential is unavailable,
- the WebUI capability matrix suppresses supported features,
- a normal authenticated admin session still has access to underlying CGI endpoints.

The project focuses on **owner-controlled devices and authenticated local sessions**. It does not provide brute-force tooling, credential theft, or remote-authentication bypass techniques.

See [`docs/admin-superadmin.md`](docs/admin-superadmin.md).

## Repository layout

```text
docs/               Protocol, architecture, CGI and capability documentation
wifi/               Feature-specific findings and tested procedures
scripts/browser/    DevTools/browser scripts
scripts/powershell/ Local discovery and diagnostics
research/           Open questions and reverse-engineering notes
```

## Safety

Configuration writes can disconnect clients or make the WebUI unreachable. Prefer Ethernet, preserve a known-good configuration, and change one field at a time.

Never publish:

- Wi-Fi passwords / PSKs
- session tokens
- private keys or encrypted session material
- device serial numbers
- personal MAC addresses
- ISP/customer identifiers

## Status

Confirmed working on one Beacon 3.1 firmware/operator combination. More firmware samples are needed to identify what is universal versus operator-specific.

## License

MIT. See [`LICENSE`](LICENSE).
