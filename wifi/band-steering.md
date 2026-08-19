# Hidden Band Steering

## Status

**Verified working on Nokia Beacon 3.1.**

ProductConfig reports:

```text
SupportBandSteering = 1
```

while the operator/UI capability layer may hide the control.

The runtime state is exposed as:

```text
X_ALU_COM_Sync_SSID_to_5G
```

on both the 2.4 GHz and 5 GHz primary SSIDs.

## Verified result

Before:

```text
2.4 GHz sync = 0
5 GHz   sync = 0
```

After:

```text
2.4 GHz sync = 1
5 GHz   sync = 1
```

## Important firmware-specific detail

On the tested build:

```text
sync_value=1
```

returned HTTP success but did **not** apply Band Steering.

The successful frontend-compatible values were:

```text
sync_value=true
delay=2
```

This matches the JavaScript path used when creating/saving a dual-band multiband SSID pair.

## Endpoint

Primary save path:

```text
POST /wlan_config_web_app.cgi?do_config_glb
```

The frontend treats the 2.4 GHz + 5 GHz primary pair as a multiband group and coordinates the 5 GHz side as part of the save workflow.

## Preconditions used during testing

- 2.4 GHz primary SSID enabled
- 5 GHz primary SSID enabled
- same SSID name on both bands
- ProductConfig `SupportBandSteering = 1`

## Verification

Re-read both endpoints:

```text
GET /wlan_config_status_web_app.cgi
GET /wlan_config_status_web_app.cgi?v=11ac
```

Then confirm:

```text
2.4 GHz X_ALU_COM_Sync_SSID_to_5G = 1
5 GHz   X_ALU_COM_Sync_SSID_to_5G = 1
```

## Client behavior

Band Steering being enabled does not guarantee every 2.4 GHz client will be moved to 5 GHz. Client telemetry can report capabilities such as:

```text
capable-24ghz
capable-5ghz
capable-bss-transition
capable-radio-measurement
preferred-band
category
```

A 2.4-only client cannot be steered to 5 GHz even if it supports BSS Transition Management.
