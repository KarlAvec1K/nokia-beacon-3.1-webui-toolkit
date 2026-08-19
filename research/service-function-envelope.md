# GenericService request envelope

## Purpose

This document records the JSON envelope recovered from frontend source. It does not recommend sending the request.

The shared API model is:

```json
{
  "version": 1,
  "csrf_token": "<current token>",
  "id": 1,
  "interface": "Nokia.GenericService",
  "service": "OAM",
  "function": "<function name>",
  "paralist": []
}
```

The token is read from browser state and must never be copied into a report.

## Frontend behavior

The GenericService/FWA method posts JSON to `service_function_web_app.cgi`. This differs from the form-encoded CSRF path used by many normal Wi-Fi settings.

Shared bundles contain functions for cellular/FWA products. Their presence does not establish Beacon 3.1 support.

## Safety

- do not guess function names;
- do not send setters or FWA actions;
- do not publish tokens or encrypted request material;
- treat the earlier 404 as method/build evidence, not as proof of superadmin-only access.
