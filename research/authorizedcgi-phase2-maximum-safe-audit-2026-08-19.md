# Authorized CGI phase 2 maximum-safe audit — 2026-08-19

## Purpose

`authorizedcgi-phase2-maximum-safe-audit.js` is the next broad pass after the first 146-entry audit.

It combines:

- authorized CGI enumeration;
- same-origin bundle discovery;
- static action-to-endpoint and GET/read hints;
- risk buckets for every entry;
- status-only GET probes for routes proven read-only by strict naming and source evidence.

## Buckets

- `safe-read`: eligible for a sequential GET probe;
- `ambiguous-read`: looks readable but has an unknown query or insufficient proof;
- `mutator`: contains a configuration/action/reset/delete/start/stop pattern;
- `unknown`: not proven safe;
- `invalid` or `skipped`: malformed or cross-origin.

Only `safe-read` entries are requested. Mutator, ambiguous and unknown entries are inventory-only.

## Safety

- no discovered JavaScript is executed;
- only same-origin bundles are fetched;
- no POST/PUT/PATCH/DELETE is sent;
- no response body is retained;
- all probe responses are cancelled immediately;
- requests are sequential and timeout after six seconds;
- query values are redacted in the report;
- no configuration change is attempted.

This is the broadest automatic pass that remains defensible as read-only. A later mutator phase would require an explicit per-endpoint allowlist and state-preservation plan.
