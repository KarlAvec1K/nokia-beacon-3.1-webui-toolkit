# Hidden 5 GHz OFDMA

## Status

Verified on the tested Nokia Beacon 3.1 normal-admin session.

The 5 GHz status model exposes `X_ASB_COM_OfdmaEnable`. The frontend save field is `wl_ofdma`.

## Verified state

```
X_ASB_COM_OfdmaEnable: 0 -> 1
```

No active-channel change was observed during the recorded test.

## Endpoint and verification

The frontend-compatible save path is:

```
POST /wlan_config_web_app.cgi?do_config_glb11ac
```

After a change, re-read:

```
GET /wlan_config_status_web_app.cgi?v=11ac
```

HTTP 200 alone is not proof that OFDMA changed. Verify the status field.

The normal 2.4 GHz radio was intentionally left with OFDMA disabled in the recorded test. Preserve the current configuration before repeating the change.
