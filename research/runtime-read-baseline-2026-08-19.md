# Runtime read baseline — 2026-08-19

Tested from an authenticated normal-admin WebUI session on a Nokia Beacon 3.1 in AP/bridge mode.

This probe used **GET requests only** and intentionally did not print response bodies, only response class, size, and top-level JSON keys.

## Key conclusion

`AdminUserData.authorizedcgi` is **not a complete runtime access-control list**.

Two endpoints that are absent from `authorizedcgi` are nevertheless directly readable at runtime:

- `capabilities_status_web_app.cgi` -> HTTP 200, substantive JSON (`AdminUserData`, `ProdCfgData`)
- `main_web_app.cgi` -> HTTP 200, substantive JSON with router/operator/mode flags

Therefore an endpoint must not be classified as "superadmin-only" solely because it is missing from `authorizedcgi`.

## Runtime classes observed

| Endpoint | Listed in `authorizedcgi` | Runtime result | Interpretation |
|---|---:|---|---|
| `capabilities_status_web_app.cgi` | no | 200, JSON, ~55 KB | runtime-readable despite not being listed |
| `main_web_app.cgi` | no | 200, JSON | runtime-readable despite not being listed |
| `access_control_status_web_app.cgi` | no | 200, empty | ambiguous: role-gated, AP-mode stub, or no data |
| `channel_change_history_status_web_app.cgi` | no | 200, empty | ambiguous |
| `dns_status_web_app.cgi` | no | 200, empty | ambiguous |
| `route_status_web_app.cgi` | no | 200, empty | ambiguous |
| `tr69_status_web_app.cgi` | no | 200, empty | ambiguous |
| `tr369_status_web_app.cgi` | no | 200, empty | ambiguous |
| `user_mgmt_status_web_app.cgi` | no | 200, empty | ambiguous |
| `wifi_schedule_status_web_app.cgi` | no | 200, empty | ambiguous |
| `sta_info_web_app.cgi` | no | 200, empty | ambiguous / legacy variant |
| `sta_info2_web_app.cgi` | yes | 200, non-empty text | runtime-readable |
| `container_management_status_web_app.cgi` | yes | 200, JSON | runtime-readable |
| `service_function_web_app.cgi` | no | 404 on GET | **does not prove route absence**; frontend maps write/service actions to this CGI and it may be method-specific |

## Important caution: HTTP 200 empty

A `200 OK` with a zero-length body is **not equivalent to authorization success**.

On this platform it may represent any of the following:

1. a CGI stub present in the generic firmware;
2. a feature disabled by the current operator profile;
3. functionality suppressed by AP/bridge mode;
4. role-dependent behavior returning no data;
5. a valid endpoint with no applicable entries.

These cases require comparison against frontend method/payload construction and, where safe, another operating mode or privilege level.

## `service_function_web_app.cgi`

The generic frontend maps at least two actions to this CGI:

- `ubus`
- `set_fwa_password`

A plain GET returned HTTP 404. Because the frontend treats this as an action endpoint rather than a status endpoint, the GET result should be classified as **method-unresolved**, not "missing" or "superadmin-only".

No POST should be attempted until the exact frontend method and payload schema are recovered.

## `command_web_app.cgi`

The current admin allow-list explicitly contains:

- `command_web_app.cgi?pexist`
- `command_web_app.cgi?cat`

Frontend URL mappings include:

- `command_web_app.cgi?pexist+`
- `command_web_app.cgi?cat+`
- an additional `catFWA` variant in the generic bundle

These endpoints are high-value but should be handled conservatively because their names imply filesystem-backed operations. Research should first recover exact frontend call sites and only use non-sensitive, known application-owned filenames/paths.

## Next classification model

For each endpoint, track four independent dimensions:

1. **Frontend-present** — string/call site exists in shipped JS.
2. **Capability-visible** — related UI capability is `1`, `0`, or `-1`.
3. **Listed in `authorizedcgi`** — advisory role metadata only; not definitive.
4. **Runtime behavior** — readable JSON/text, 200-empty, rejected, not found, or method-unresolved.

This model is more accurate than treating `authorizedcgi` as the sole access-control source.


## Overview radio-access 403 classification

Static source analysis and an observed console trace establish the full chain:

```text
overview.radioAccess.visibility.isOn
  -> Overview starts a five-second polling stream
  -> action getRadioAccessStatus
  -> internal action get_radio_access_status
  -> GET radio_receiver_status_web_app.cgi
  -> HTTP 403
```

The frontend has a separate FWA-gateway action:

```text
get_radio_access_status_fwa_gw
  -> overview_get_web_app.cgi
```

That variant is handled separately and is not the action seen in the captured 403.

### Error handling

On successful radio-access response, Overview:

- marks radio-access data available;
- shows the radio-access card;
- processes the returned signal data.

On failure, Overview:

- hides the radio-access card;
- increments `hasRadioAccessError`;
- logs the error.

On the next polling tick, the error counter causes the polling subscription to reset and unsubscribe. The 403 therefore normally produces one failed request followed by graceful suppression of the unsupported/denied card, not endless retry traffic.

### Interpretation

The page only starts this request when the resolved device capability reports:

```text
overview.radioAccess.visibility.isOn == true
```

The current session therefore exhibits a capability/backend mismatch: the frontend capability enables the card, while the backend denies its read endpoint with HTTP 403.

Possible causes remain:

- normal-admin role restriction;
- AP/bridge-mode restriction;
- generic/operator capability data that is too broad for this device;
- firmware integration mismatch.

The current evidence does not distinguish those causes, but it does establish a real backend authorization-style denial and a safe frontend fallback.
