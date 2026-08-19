# Hidden Band Steering

## Status

Verified working on the tested Nokia Beacon 3.1 normal-admin session.

ProductConfig reported `SupportBandSteering = 1`, while the operator capability layer hid the control.

## Verified state

The primary 2.4 GHz and 5 GHz SSIDs were changed from synchronization disabled to enabled:

```
X_ALU_COM_Sync_SSID_to_5G: 0 -> 1
```

The frontend-compatible form fields on that firmware were:

```
sync_value=true
delay=2
```

Using `sync_value=1` returned transport success but did not apply the setting on that build.

## Endpoint and verification

The frontend save path is:

```
POST /wlan_config_web_app.cgi?do_config_glb
```

After a change, re-read:

```
GET /wlan_config_status_web_app.cgi
GET /wlan_config_status_web_app.cgi?v=11ac
```

Never publish the form payload with tokens or encrypted material. Use Ethernet and preserve the previous state before changing it.

Band Steering does not guarantee that every client moves to 5 GHz. A 2.4-only client cannot be steered to 5 GHz.
