# Frontend command-service notes — 2026-08-19

## Scope

This note describes frontend wrappers only. It does not authorize arbitrary command execution.

The shared bundle defines wrappers for `pexist`, `cat`, and an FWA `catFWA` variant. The wrappers use CSRF-protected POST requests and append a caller-supplied argument to the URL.

## Current evidence

- the normal-admin authorized list contains the `cat` and `pexist` route families;
- recursive source scans found no literal arguments used by the current Beacon pages;
- no command-CGI request was sent.

## Safe interpretation

The frontend proves that Nokia uses a command-file helper in some product flows. It does not prove that arbitrary paths, shell commands, or sensitive files are accepted. Keep this feature out of automated tests until a documented, non-sensitive application-owned argument is identified.
