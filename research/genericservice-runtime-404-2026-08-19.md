# GenericService runtime result: HTTP 404

Date: 2026-08-19

Target: Nokia Beacon 3.1

A minimal runtime probe was sent to:

```text
POST /service_function_web_app.cgi
Content-Type: application/json
```

using the exact frontend-style GenericService envelope and the read-only function `GetWebDBFlag`.

Observed result:

```text
HTTP status: 404
Content-Type: text/html; charset=utf-8
JSON response: no
GenericService result: unavailable
```

## Interpretation

This result does **not** look like the known role-denial behavior observed elsewhere on the same normal-admin session. A separate frontend request to `get_radio_access_status` returned a genuine HTTP 403, which is a better reference for an authorization failure.

Because both GET and correctly-formed POST requests to `service_function_web_app.cgi` return 404 on this Beacon 3.1 firmware, the strongest current interpretation is:

- the shared Nokia frontend bundle contains GenericService/FWA functionality;
- the Beacon 3.1 backend build does not expose `service_function_web_app.cgi` at this path, or the handler is not installed/registered for this product build;
- absence from `authorizedcgi` is therefore not enough to classify this endpoint as superadmin-only.

This remains an inference, not proof that no alternate backend route exists.

## Consequence for research

Do not spend time probing the 49 discovered GenericService function names against this endpoint unless a different route or product-specific registration mechanism is found.

Higher-value Beacon 3.1 research targets are now:

1. CGI endpoints that actually exist on this firmware but return 200 empty;
2. routes that return a real 403 under normal admin;
3. `command_web_app.cgi?cat...` / `?pexist...`, whose frontend methods are present and whose CGI entries are listed for the current admin;
4. hidden WebUI capabilities whose existing Wi-Fi CGI backend is already known to accept writes.

## Safety

No response body contents, session tokens, credentials, serials, PSKs, or personal identifiers are included here.
