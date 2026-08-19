# Authorized CGI one-shot safety audit — 2026-08-19

## Purpose

`scripts/browser/authorizedcgi-one-shot-safety-audit.js` classifies every unique entry returned by `capabilities_status_web_app.cgi` in one run.

It does not blindly call all entries. The authorized list includes route names and query forms that can represent writes, scans, resets, starts, deletes, or other state changes.

## Safety policy

The script:

- makes one GET to load the authorized list;
- classifies every entry;
- rejects cross-origin entries;
- rejects mutator-looking names and query forms;
- rejects unknown query keys;
- probes only strict status/info/capability/main read paths;
- sends sequential GETs with a 5-second timeout;
- uses manual redirect handling;
- cancels each response body immediately;
- never prints response bodies or runtime values;
- never sends POST/PUT/PATCH/DELETE;
- never calls command CGI, GenericService, RRM, Optimize Network, container lifecycle, reset, reboot, firmware, password, or scan actions.

The report includes all redacted candidates and status-only snapshots for the strict read subset. Query values are replaced with `REDACTED` in the report.

## Interpretation

A skipped entry is not necessarily unauthorized. It means only that the entry could not be proven safe from its URL template alone. This is intentional: an exhaustive security audit must not trade safety for a larger count.

A status code from the safe subset also does not prove that every other CGI in the authorized list is readable or harmless. It provides a bounded read-only baseline.


## Runtime result

The one-shot run classified 146 unique entries from the returned list:

- 35 strict read candidates;
- 111 skipped as mutator-like, unknown-query, or otherwise not provably safe;
- 35 GET requests sent sequentially;
- 34 responses returned HTTP 200;
- `radio_receiver_status_web_app.cgi` exceeded the 5-second timeout;
- 0 response bodies retained;
- 0 mutator candidates requested;
- 0 configuration changes.

The timeout is consistent with the endpoint's earlier authorization/runtime irregularity. It is not evidence of a successful request or a permission grant. It should remain unprobed until a narrower, separately approved diagnostic is justified.
