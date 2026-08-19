# GenericService runtime result — 2026-08-19

A frontend-shaped POST to `service_function_web_app.cgi` using the `Nokia.GenericService` envelope returned HTTP 404 on the tested Beacon 3.1.

This is different from the observed HTTP 403 on `radio_receiver_status_web_app.cgi`.

## Interpretation

The 404 suggests that the GenericService handler is not installed, registered, or routed in this Beacon build. It is not proof that every GenericService function is absent, and it is not proof of superadmin-only access.

No further GenericService calls should be made without a concrete, read-only function used by this exact Beacon frontend.
