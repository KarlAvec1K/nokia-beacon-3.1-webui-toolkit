# CGI / API map

Confirmed on Nokia Beacon 3.1.

## Read endpoints

| Endpoint | Status | Notes |
|---|---:|---|
| `/main_web_app.cgi` | Confirmed | Main device state |
| `/lan_status_web_app.cgi?lan` | Confirmed | LAN data |
| `/lan_status_web_app.cgi?wlan` | Confirmed | WLAN data |
| `/wlan_config_status_web_app.cgi` | Confirmed | 2.4 GHz configuration |
| `/wlan_config_status_web_app.cgi?v=11ac` | Confirmed | 5 GHz configuration |
| `/wlan_config_status_web_app.cgi?v=11ac_highband` | Returns data | On tested dual-band Beacon 3.1, appears to expose an internal/hidden VAP rather than a separate physical high-band radio |
| `/wlan_config_status_web_app.cgi?v=6g_band` | Returns data | On tested Beacon 3.1, response aliases hidden 5 GHz data; not evidence of a 6 GHz radio |
| `/capabilities_status_web_app.cgi` | Confirmed | ProductConfig + UI capability data |
| `/mesh_status_web_app.cgi` | Confirmed | Mesh/RRM state |
| `/device_home_network_status_web_app.cgi` | Confirmed | AP/client topology and capability telemetry |
| `/statistics_status_web_app.cgi` | Confirmed | Interface statistics |
| `/wlan_config_guest_status_web_app.cgi` | Confirmed | Guest/main WLAN data; may contain credentials, sanitize before sharing |

## Write endpoints discovered in frontend

| Endpoint | Purpose |
|---|---|
| `/wlan_config_web_app.cgi?do_config_glb` | 2.4 GHz save |
| `/wlan_config_web_app.cgi?do_config_glb11ac` | 5 GHz save |
| `/wlan_config_web_app.cgi?do_config_glb11ac_highband` | High-band/generic code path |
| `/wlan_config_web_app.cgi?do_config_6gband` | 6 GHz/generic code path |
| `/wlan_config_web_app.cgi?do_config_mlo` | MLO/generic code path |
| `/mesh_web_app.cgi?v_glb=set&rrm_enable=` | RRM setting |
| `/wlan_config_web_app.cgi?OptimizeNetwork` | Network optimization action |

## Important behavior

The frontend uses POST requests with:

```text
Content-Type: application/x-www-form-urlencoded
```

and constructs the protected body by appending `csrf_token`, then calling:

```js
crypto_page.encrypt_post_data(pubkey, payload)
```

where `token` and `pubkey` are read from `localStorage`.

A successful HTTP status does not necessarily mean the requested setting was accepted. Always verify the corresponding status CGI after a write.
