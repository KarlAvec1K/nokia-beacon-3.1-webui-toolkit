# Nokia Beacon 3.1 — Research: STA Information Classification (2026-08-19)

## Scope and safety

Nineteen same-origin JavaScript bundles were inspected without calling either STA CGI. No response body or client identifier was read or recorded.

## Two distinct endpoints

The frontend defines two separate GET actions:

| Action | Endpoint | Observed frontend role |
|---|---|---|
| `get_sta_info` | `sta_info_web_app.cgi` | Main STA Information table |
| `get_sta_info2` | `sta_info2_web_app.cgi` | Secondary data cache used by helper methods |

The main Wi-Fi statistics page calls `getStaInfo`, expects a parsed object containing `WLAN_CLIENT`, and sends its first entry to `syncSTAdata`.

Its table columns are capability-gated and can include:

- MAC address;
- SSID;
- channel;
- connection duration;
- Wi-Fi mode;
- RSSI.

These field names describe the frontend schema only. No values were collected.

## Visibility and role behavior

The STA tab requires both:

- the product flag `supportSTAinfo`;
- the capability path `wifi.wifiStatistics.staInformation.visibility`.

The table itself has an additional capability visibility check. The component records whether the session is an admin, but the extracted STA route and loading chain do not show a dedicated superadmin guard.

## STA info 2

`getStaInfo2` is a normal GET request. Two components define a `getStaInfo2Data` helper whose success handler only assigns `response.data` to the shared `api.get_sta_info2` model. One helper optionally invokes a callback afterward.

No parser for the previously observed non-JSON text and no direct field consumer was identified in this first pass. This suggests one of the following:

1. parsing occurs in the shared response/model layer before the success callback;
2. the endpoint is a legacy or conditionally used data source;
3. its consumer is referenced indirectly and was not captured by the broad term scan.

The earlier shape-only GET established that the endpoint is runtime-readable, but its body must remain suppressed because it may contain client identifiers.

## Next passive step

Search exact definitions versus call sites of `getStaInfo2Data`, references to `api.get_sta_info2`, and the instantiated response-model class. Do not call either STA endpoint and do not print any cached runtime value.
