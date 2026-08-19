# Nokia Beacon 3.1 — Research: Authorized-CGI Phase 2 Maximum-Safe Audit (2026-08-19)

## Scope

The phase-2 script combines authorized-CGI enumeration, same-origin bundle discovery, static action-to-endpoint hints, risk classification, and status-only reads.

## Final corrected baseline

- 146 unique entries classified;
- 41 `safe-read` entries probed;
- 31 `ambiguous-read` entries skipped;
- 65 `mutator` entries skipped;
- 9 `unknown` entries skipped;
- 40 safe reads returned HTTP 200;
- `radio_receiver_status_web_app.cgi` returned HTTP 403;
- no response bodies retained;
- no mutator or ambiguous request sent;
- no configuration change observed.

## Overloaded CGI handling

The corrected classifier matches query keys before applying a frontend mapping:

- generic `storage_web_app.cgi` is `unknown`;
- `storageget` and `ls` forms are ambiguous and skipped;
- `device_status_web_app.cgi?getroot` is a read;
- `device_status_web_app.cgi?rootalias` is a write-like form and is skipped.

This is the final read-only authorized-CGI baseline for the current session. It is not a permission-bypass tool.
