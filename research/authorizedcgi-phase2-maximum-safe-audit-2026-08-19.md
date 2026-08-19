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


## First runtime result and classifier correction

The first phase-2 run classified 146 entries as follows:

- 42 `safe-read` candidates;
- 31 `ambiguous-read` candidates;
- 65 `mutator` candidates;
- 8 `unknown` candidates.

It sent 42 GETs: 41 returned HTTP 200 and the radio-receiver endpoint returned HTTP 403. No response bodies were retained and no POST/mutator request was sent.

A review found one overly broad classification: `storage_web_app.cgi` was accepted because the pathname matched a broad storage/read heuristic even though the bundle also contains mutating storage actions on that CGI family. The script has been corrected to:

- require matching query keys when consulting a source mapping;
- stop treating generic `storage_web_app.cgi` as a safe read path;
- keep overloaded CGI siblings out of the automatic probe unless the exact read form is proven.

The earlier status-only request did not include a query or body, and no configuration change was observed, but the result is treated as an audit caveat. Rerun the corrected script before using its safe-read count as the final baseline.


## Corrected-script rerun note

The next pasted report still showed the pre-correction behavior: generic `storage_web_app.cgi` remained in `safe-read`, and overloaded mappings such as `set_root_fname` were attached by pathname alone. That output must not be used as the final corrected baseline.

The repository script has since been updated again to remove the generic storage pathname from the safe-read allowlist. Use the current raw file content and rerun it after a fresh copy/paste. The expected corrected report should classify generic `storage_web_app.cgi` as `unknown` or `ambiguous-read`, not `safe-read`.
