# Nokia Beacon 3.1 — Browser Scripts Guide

## Recommended one-shot workflow

For a single passive source scan, copy the complete file:

- [`comprehensive-passive-inventory.js`](https://github.com/KarlAvec1K/nokia-beacon-3.1-webui-toolkit/blob/main/scripts/browser/comprehensive-passive-inventory.js)

It discovers same-origin JavaScript bundles, does not execute discovered scripts, and reports roles, guards, routes, CGI mappings, GenericService, command CGI, radio access, containers, RRM, optimization, STA, mesh, and hidden read models.

## Recommended runtime workflow

After the source scan, use:

- [`authorizedcgi-phase2-maximum-safe-audit.js`](https://github.com/KarlAvec1K/nokia-beacon-3.1-webui-toolkit/blob/main/scripts/browser/authorizedcgi-phase2-maximum-safe-audit.js)

It classifies every authorized entry and probes only strict read/status paths. It does not send POST/PUT/PATCH/DELETE and does not retain response bodies.

## How to run

1. Open the Beacon WebUI in the already authenticated browser.
2. Open DevTools and select Console.
3. Paste the complete script.
4. Send only the resulting JSON.
5. Redact tokens, cookies, PSKs, SSIDs, private MACs, serial numbers, and raw bodies.

A `zone.js 404` can be a stale support-bundle reference. It does not automatically invalidate successful application-bundle results.

## Review skipped entries

To build redacted tables for the ambiguous and unknown authorized-CGI entries without calling them, use:

- [authorizedcgi-skipped-entry-review.js](authorizedcgi-skipped-entry-review.js)

The output uses the same corrected bucket rules as the phase-2 audit: safe-read entries are excluded, mutator-like entries are placed in a separate `mutators` table, and only the 31 `ambiguousRead` plus 9 `unknown` entries form the reviewed tables. Each reviewed row reports query keys, frontend action names, inferred HTTP methods, source files, and likely side effects. It sends zero requests to the skipped CGI routes.

## Do not automate

Do not add RRM, Optimize Network, command CGI, GenericService, reboot, reset, password, firmware, deletion, storage, or container lifecycle calls to a read-only script. These require a separate, explicit and recoverable change plan.

## Password and role source review

For a passive review of password-related routes and role guards, use:

- [passive-password-role-source-inventory.js](passive-password-role-source-inventory.js)

This script inspects only same-origin JavaScript source. It reports password endpoint templates, inferred frontend methods, and redacted `superadmin`/admin guard contexts. It reads no runtime storage values, calls zero CGI routes, and cannot change a password or elevate privileges.
