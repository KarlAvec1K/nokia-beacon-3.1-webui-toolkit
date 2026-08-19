# Nokia.GenericService function inventory — 2026-08-19

Passive scan of the shipped Beacon 3.1 WebUI JavaScript identified **49 unique literal function names** passed to `createBody()` for requests routed through `service_function_web_app.cgi` using the frontend's `POST_CSRF_FWA` method class.

This is a **frontend inventory**, not proof that every function is implemented on Beacon 3.1 hardware. The shared Nokia frontend clearly contains substantial FWA/cellular code that may be unused on this product.

## GenericService envelope

The frontend constructs:

```json
{
  "version": 1,
  "csrf_token": "<localStorage.token>",
  "id": 1,
  "interface": "Nokia.GenericService",
  "service": "OAM",
  "function": "<set by createBody()>",
  "paralist": []
}
```

`createBody(functionName, optionalJsonString)` sets the `function` field, copies the current session token into `csrf_token`, and parses the optional JSON string into `paralist`.

`POST_CSRF_FWA` sends this object directly as JSON to `service_function_web_app.cgi` with:

```text
Content-Type: application/json
withCredentials: true
```

It does not use the RSA-encrypted `application/x-www-form-urlencoded` flow used by normal `POST_CSRF` Wi-Fi writes.

## 49 discovered function names

```text
BlockTraffic
ChangePassword
CleanLifeTimeDataCounter
DeleteAPN
DeleteAPN2
GetAPN
GetCAState
GetCBRSConfig
GetCBRSParams
GetCellLockConfig
GetCellLockInfo
GetCellularAccessConfig
GetCellularNetworkIdentification
GetDebugServerConfig
GetDeviceSIMPINLock
GetGPSInfo
GetLanItfInfo
GetLifeTimeDataCounter
GetLockStatus
GetModemLogMode
GetOperatorLockConfig
GetRoamingStatus
GetSIMInfo
GetSIMPIN
GetSIMSelectionPolicy
GetSupportedCellularBands
GetTrafficBlockStatus
GetTrafficForwardingStatus
GetUSIMAdminState
GetWANAccessMode
GetWLANSSIDConfig
GetWebDBFlag
PINCheck
PINUnlock
SetCBRSConfig
SetCellLockConfig
SetCellularAccessConfig
SetDebugServerConfig
SetDeviceSIMPINLock
SetGPSMode
SetModemLogMode
SetOperatorLockConfig
SetRoamingConfig
SetSupportedCellularBands
SetUSIMAdminState
SetWANAccessMode
TriggerSTCCellScan
UnblockTraffic
UnlockDevice
```

## Preliminary classification

### Read-only candidates worth runtime classification

These functions have `Get*` semantics and do not mutate configuration in their frontend call sites:

- `GetWebDBFlag`
- `GetLanItfInfo`
- `GetWLANSSIDConfig`
- `GetWANAccessMode`
- `GetTrafficForwardingStatus`
- `GetTrafficBlockStatus`
- `GetDebugServerConfig`
- `GetModemLogMode`
- `GetLockStatus`

The first group is preferred because it is closer to generic LAN/WAN/Wi-Fi behavior. The latter entries appear more FWA/operator-specific.

### Clearly FWA / cellular-oriented

Examples include:

- `GetSIMInfo`
- `GetCAState`
- `GetCellularNetworkIdentification`
- `GetCellularAccessConfig`
- `GetCBRSParams`
- `GetCBRSConfig`
- `GetCellLockConfig`
- `GetCellLockInfo`
- `GetSupportedCellularBands`
- `GetGPSInfo`
- `GetRoamingStatus`
- `GetOperatorLockConfig`
- `GetDeviceSIMPINLock`

Their presence in the shared WebUI does not imply Beacon 3.1 support.

### Mutating / do not probe during inventory

Do not use these merely to test endpoint access:

- all `Set*` functions
- `DeleteAPN` / `DeleteAPN2`
- `BlockTraffic` / `UnblockTraffic`
- `CleanLifeTimeDataCounter`
- `PINCheck` / `PINUnlock`
- `UnlockDevice`
- `TriggerSTCCellScan`
- `ChangePassword`

## Interesting exact call sites

### GetLanItfInfo

The frontend passes a known parameter structure:

```json
[
  {
    "LANItfType": 1,
    "LANItfInstanceID": 0
  }
]
```

### GetWLANSSIDConfig

Called without parameters from the WAN/APN UI when the operator capability `wan.wanServices.apnInterfaceType` is enabled.

### GetWebDBFlag

Called without parameters by the WAN services page to determine a voice-related WebDB flag.

### GetTrafficForwardingStatus

Called from the main application for an STCA-specific operator flow. This is useful as a generic read-only function name but should not be assumed relevant to Beacon 3.1.

## Actual role-gating reference

Separately from GenericService, the current normal-admin session has produced a genuine:

```text
HTTP 403
GET_RADIO_ACCESS API Failed
get_radio_access_status
```

This is valuable because it provides a concrete signature for a truly denied runtime request. By contrast, many hidden CGI status endpoints returned `200` with an empty body, which remains ambiguous.

## Next step

Use one minimal, non-mutating GenericService POST with the exact frontend envelope and inspect **response metadata only**, not `FunctionResult` contents. Start with a low-impact no-parameter getter such as `GetWebDBFlag`.
