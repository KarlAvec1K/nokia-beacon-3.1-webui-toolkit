# Nokia Beacon 3.1 — Documentation Index

Use this folder for stable explanations that help readers understand the project before running scripts.

## Start here

1. [Project README](../README.md) — scope, current findings, and safety boundary.
2. [Admin and Superadmin Access](admin-superadmin.md) — what the current normal admin can read or change.
3. [CGI and API Map](cgi-api-map.md) — verified reads and frontend-only write mappings.
4. [Naming and Organization](naming-and-organization.md) — how files, folders, reports, and scripts are named.

## Evidence folders

- [Research index](../research/README.md) — dated investigation reports.
- [Wi-Fi index](../wifi/README.md) — feature-specific findings and verification procedures.
- [Browser scripts guide](../scripts/browser/README.md) — one-shot and specialized DevTools scripts.

## Reading labels

Every finding should use one of these labels:

- **Verified read** — a read request completed and only safe metadata was retained.
- **Verified writable by normal admin** — a setting changed and was verified afterward.
- **Frontend mapping only** — a source string or call site exists, but runtime behavior is unverified.
- **Ambiguous** — the endpoint may be readable, but its parameters or mode behavior are not proven safe.
- **Denied** — the backend returned an authorization-style denial.
- **Not tested** — intentionally excluded for safety.

- [Project checklist](../PROJECT_CHECKLIST.md) — completed work, remaining tests, and blocked actions.
