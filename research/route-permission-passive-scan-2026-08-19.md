# Passive route and permission source inventory — 2026-08-19

## Scope and safety

A recursive same-origin static-source scan was run against the Nokia Beacon 3.1 WebUI:

- 19 JavaScript URLs discovered
- 18 JavaScript files fetched
- queue exhausted
- downloaded scripts were not executed
- no CGI requests were sent
- response bodies were not included
- one non-critical `zone.js` HTTP 404

The scanner reached its per-category cap for visibility terms and CGI paths, so those two counts are lower bounds rather than complete totals.

## Role model findings

The login flow maps a backend-provided `is_ctc_admin` value into frontend state:

```text
is_ctc_admin = true
  -> localStorage.userModeNKBC = "Admin"
  -> localStorage.userMode = "Admin"
  -> api.isAdmin = true

is_ctc_admin = false
  -> corresponding "User" state
```

Multiple components use `localStorage.userMode === "Admin"` or `api.isAdmin` to alter frontend behavior.

A separate literal `superadmin` check was found:

```text
sessionStorage.currentUser === "superadmin"
```

It appears in APN/URSP-related code inside the large shared bundle. This is evidence that the shared frontend knows a `superadmin` identifier, but it is **not** evidence that the Beacon 3.1 exposes a superadmin login or that this route is supported by its backend.

The frontend role flags are UI state, not an authorization boundary. Backend HTTP/CGI responses remain authoritative.

## Route guards

The application has:

- a top-level authentication guard protecting the main lazy-loaded module;
- an admin guard whose `canActivate()` returns `authService.isAdmin`;
- route resolvers applied broadly to feature modules.

The broad scan confirms that an admin guard exists but does not yet map every use of that guard to its exact route. A targeted route/guard extraction is needed.

## Route inventory

The main module contains lazy-loaded route groups including:

- overview
- messages
- WAN
- LAN
- Wi-Fi
- devices
- voice
- maintenance
- advanced settings
- security
- troubleshooting

Feature chunks contain many additional product-variant routes, including cellular/FWA, TR-069/TR-369, optics, QoS, IPsec, GRE, voice, and operator-lock-related UI.

Presence in the shared bundle is not runtime support. It may represent other Nokia products, operator profiles, or capability-disabled features.

## Menu visibility and capability model

The side-menu catalog initially defines many entries with a visible default. Runtime code then evaluates capability data through calls shaped like:

```text
device_capability.getVal(section, feature, property)
```

The router also checks the resolved menu visibility and redirects away from routes whose menu entry remains hidden.

Important interpretation:

1. a route can exist in Angular source while its menu is hidden;
2. a hidden menu can reflect device capability or operator configuration rather than user role;
3. navigating directly to a client-side route does not establish backend authorization.

Examples of capability-controlled areas include UPnP/DLNA, access control, WAN protocol toggles, Wi-Fi features, and other product-specific pages.

## CGI catalog

The static API map contains a large mixture of:

- read/status CGI paths;
- configuration CGI paths;
- destructive or state-changing operations;
- product-variant endpoints.

Examples of explicitly dangerous operations in the catalog include reboot, restore, firmware upgrade, password changes, WAN reconfiguration, route/filter deletion, radio configuration, and operator-lock/reset workflows.

No runtime calls should be inferred merely from catalog presence.

## High-confidence conclusions

- The current frontend recognizes an Admin/User distinction sourced from login response data.
- The shared frontend contains at least one `superadmin` literal.
- Menu visibility is heavily capability-driven.
- Many routes and CGI mappings are shared product-family code rather than confirmed Beacon 3.1 functionality.
- Client-side visibility and role checks are insufficient to establish backend permissions.
- Runtime probing must remain restricted to endpoints already classified as read-only.

## Next passive step

Extract structured route definitions and associate each route with:

- module/chunk;
- resolver list;
- `canActivate`, `canActivateChild`, `canLoad`, or `canMatch`;
- nearby Admin/User/superadmin conditions;
- corresponding menu key and capability lookup when visible in source.

Do not test hidden routes or CGI paths merely because they appear in this inventory.


## Targeted route/guard/role scan

A second passive scan produced:

- 90 route objects
- 3 guard method definitions
- 11 explicit role/storage checks
- 300 capability calls (scanner cap reached)
- 158 menu entries
- 0 CGI requests

### Guard mapping

The three extracted guard methods were:

```text
canActivateChild() -> checkIfAuthenticated()
canActivate()      -> checkIfAuthenticated()
canActivate()      -> authService.isAdmin
```

The top-level main-module route explicitly applies the authentication guard through both `canActivate` and `canActivateChild`.

No extracted feature route explicitly applies the admin guard. The guard exists in the bundle, but within the complete reachable route set scanned here it appears unused. This suggests that most effective feature restriction is implemented by menu/capability filtering and backend authorization rather than Angular route guards.

This remains a source-level conclusion; minification or dynamically assembled route metadata could hide an additional association.

### Explicit role checks

The targeted scan found:

- repeated `localStorage.userMode === "Admin"` checks;
- one `localStorage.userModeNKBC === "Admin"` check;
- one `sessionStorage.currentUser === "superadmin"` check in APN/URSP logic;
- an `emailUser === "no"` menu-hiding condition.

No broader superadmin route guard was found.

## Observed Overview runtime behavior

A console trace captured normal page initialization behavior:

```text
NO-CACHE CALLED
GET_RADIO_ACCESS API Failed: HTTP 403
Overview Onsuccess
```

Interpretation:

- the Overview component itself invokes the `get_radio_access_status` action;
- the backend returns HTTP 403 for that specific action under the current admin session;
- the rest of Overview continues and reports success;
- the session and transport remain functional.

This is a strong reference signature for real backend permission denial. It differs from the earlier GenericService HTTP 404, which is more consistent with an absent/unregistered handler than role denial.

The scan script did not trigger this CGI/API request; it was background activity from the already loaded Overview page.


## Initial resolver/action inventory

The first resolver-focused scan found:

- 11 route groups with resolver arrays;
- Overview uses `[T,O]`;
- messages, WAN, LAN, Wi-Fi, devices, voice, maintenance, advanced settings, security, and troubleshooting use `[y,T,O]`;
- one genuine resolver method whose only visible action is publishing `SHOW_HEADER_REFRESH_BUTTON = true`;
- one false-positive Promise `resolve()` from the Zone polyfill.

The simple regular expression did not correctly extract resolver methods containing nested blocks. Therefore, its list of 250 named `request(...)` calls is only a global API-call inventory and must **not** be attributed to route resolvers.

The 47 `loadingStateCheck(...)` findings are component initialization dependencies. They are useful for predicting what a page expects after navigation, but they do not show which calls are made by `y`, `T`, or `O`.

A brace-balanced resolver extraction is required before assigning any automatic request to these resolver aliases.


## Brace-balanced resolver extraction

The corrected extractor found exactly three Angular resolver methods plus one Zone.js Promise false positive.

### Header-refresh resolver

```text
resolve(...) {
  publish(SHOW_HEADER_REFRESH_BUTTON, true)
}
```

This performs no API request.

### First-login credential-change resolver

This resolver reads only the frontend flags:

- `needPasswordModify`
- `needWifiPwdModify`
- `needPpoePwdModify`

Depending on those flags, it redirects to login/prelogin and publishes the appropriate first-change event. It performs no CGI/API request and does not change credentials itself.

### Common-data resolver

The third resolver:

1. calls `getDeviceCapability` only when capability data is not already available;
2. always calls `getHardwareStatus`;
3. waits for those read operations and logs success or failure.

No other action-like string was found in its balanced method body.

### Separation from the Overview 403

None of the three route resolvers references `get_radio_access_status`. Therefore the observed HTTP 403 for that action originates from the Overview component lifecycle, not from shared route resolution.

The remaining task is to map the minified route aliases `y`, `T`, and `O` to these three resolver implementations through their ES-module import/export aliases.


## Final resolver alias mapping

The ES-module export/import chain gives an exact mapping:

```text
Hot -> export mc -> route alias y
Zot -> export nc -> route alias O
$ot -> export oc -> route alias T
```

Therefore:

| Route alias | Resolver behavior |
|---|---|
| `y` | show the header refresh button |
| `O` | enforce first-login password-change redirects |
| `T` | read `getDeviceCapability` when needed and always read `getHardwareStatus` |

Route application:

- Overview uses `[T,O]`: common read data plus credential-change enforcement.
- All other main sections use `[y,T,O]`: the same two resolvers plus the header refresh control.

This closes the route-resolver branch. None of these resolvers calls `get_radio_access_status`.
