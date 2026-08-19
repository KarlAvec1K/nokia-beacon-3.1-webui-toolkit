# `service_function_web_app.cgi` request envelope

Passive frontend inspection recovered the exact request envelope used by the Nokia WebUI for the `POST_CSRF_FWA` method class.

No request to `service_function_web_app.cgi` was needed to recover this information.

## Shared body object

The API service initializes this object:

```js
{
  version: 1,
  csrf_token: "",
  id: 1,
  interface: "Nokia.GenericService",
  service: "OAM",
  function: "",
  paralist: []
}
```

The frontend's `createBody(t, r)` function then mutates it as follows:

```js
createBody(t, r) {
  this.body.function = t;
  this.body.csrf_token = localStorage.getItem("token");
  r
    ? this.body.paralist = JSON.parse(r)
    : this.body.paralist = [];
}
```

So the effective JSON body is:

```json
{
  "version": 1,
  "csrf_token": "<current WebUI token>",
  "id": 1,
  "interface": "Nokia.GenericService",
  "service": "OAM",
  "function": "<function name>",
  "paralist": []
}
```

`paralist` may contain arguments when the caller passes a JSON string to `createBody()`.

## HTTP method

For `POST_CSRF_FWA`, the dispatcher performs:

```js
http.post(relativeUrl, this.body, HTTP_OPTIONS_JSON)
```

The request body is therefore sent directly as JSON rather than through the normal form-encoded `postWithCSRFToken()` path.

Observed frontend mapping:

```text
set_fwa_password -> service_function_web_app.cgi
ubus             -> service_function_web_app.cgi
```

Functions routed through the same `ubus` endpoint include generic UBUS calls, SMS/FWA actions, cellular aggregation/status helpers, modem-log helpers and lifetime data counters in the shared multi-product frontend.

## Confirmed literal function names from call sites

Passive source inspection has identified at least:

```text
GetCAState
GetCellularNetworkIdentification
```

Example frontend flow:

```js
getCAInfo() {
  this.api.createBody("GetCAState");
  this.api.request(this, "getCAInfo");
}

getCellularNetworkIdentification() {
  this.api.createBody("GetCellularNetworkIdentification");
  this.api.request(this, "getCellularNetworkIdentification");
}
```

These functions are clearly tied to cellular/FWA products and do not establish that a Beacon 3.1 implements them.

## Beacon 3.1 relevance

The Beacon 3.1 frontend bundle is shared across multiple Nokia product families. Therefore:

- presence of a `GenericService` function in JavaScript does not prove backend implementation on Beacon 3.1;
- a GET 404 for `service_function_web_app.cgi` is not meaningful because the frontend uses POST JSON;
- absence from `authorizedcgi` does not by itself prove superadmin-only access;
- runtime testing must distinguish unsupported generic functions from role-gated functions.

## Safety / next step

Do not guess function names or send state-changing GenericService calls.

The next research step is passive enumeration of every literal `createBody("...")` call and its surrounding component. Read-only candidates can then be separated from setters before any runtime POST is considered.
