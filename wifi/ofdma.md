# Hidden 5 GHz OFDMA

## Status

**Verified on Nokia Beacon 3.1.**

The 5 GHz status object exposes:

```text
X_ASB_COM_OfdmaEnable
```

The frontend save path uses:

```text
wl_ofdma
```

A verified state change was observed:

```text
X_ASB_COM_OfdmaEnable: 0 -> 1
```

without changing the active channel.

## Endpoint

```text
POST /wlan_config_web_app.cgi?do_config_glb11ac
```

## Important request details

The Nokia frontend uses:

```text
Content-Type: application/x-www-form-urlencoded
```

and encrypts the full form payload after appending the CSRF token.

Sending an otherwise plausible payload without matching the frontend's request format can return `200 OK` while leaving OFDMA unchanged.

## Verification

After a write, re-read:

```text
GET /wlan_config_status_web_app.cgi?v=11ac
```

and confirm:

```text
X_ASB_COM_OfdmaEnable = 1
```

Do not treat HTTP status alone as proof of success.

## Notes

On the tested configuration, 5 GHz also remained:

```text
MU-MIMO: enabled
Configured bandwidth: Auto
Current bandwidth: 160 MHz
```

The 2.4 GHz radio was intentionally left with OFDMA disabled during testing.
