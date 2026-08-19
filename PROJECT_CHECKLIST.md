# Nokia Beacon 3.1 WebUI Toolkit — Project Checklist

Last reviewed: 2026-08-19

This checklist tracks what has been verified on the current Beacon 3.1 normal-admin session and what remains. It is a planning document, not an authorization to run every listed action.


## Status legend

- [x] Complete
- [ ] Remaining
- [!] Blocked or requires a separate decision
- [-] Intentionally excluded from automation

## Completed

### Repository and documentation

- [x] Standardize Markdown titles and English documentation.
- [x] Add documentation, research, Wi-Fi, contribution, security, and community-health indexes.
- [x] Add Code of Conduct, Contributing Guide, issue templates, and pull-request template.
- [x] Document normal-admin versus superadmin evidence rules.
- [x] Define file, folder, script, and report naming conventions.

### Frontend and permission inventory

- [x] Recursively inspect same-origin JavaScript bundles.
- [x] Map frontend routes, guards, resolvers, capability checks, and menu visibility.
- [x] Compare ProductConfig, UI capabilities, `authorizedcgi`, and runtime behavior.
- [x] Establish the stable normal-admin baseline: 150 raw entries / 146 unique `authorizedcgi` entries.
- [x] Confirm that `authorizedcgi` is advisory and incomplete at runtime.
- [x] Document the shared frontend’s normal-admin and superadmin references without claiming a superadmin account exists.

### Safe runtime reads

- [x] Run the one-shot authorized-CGI safety audit.
- [x] Run the corrected phase-2 maximum-safe audit.
- [x] Probe 41 strict read/status paths.
- [x] Record 40 HTTP 200 responses and the radio receiver HTTP 403.
- [x] Suppress response bodies and retain no client identifiers.
- [x] Read capability, main device, LAN/WLAN, mesh, topology, statistics, work-mode, IPv4, IPv6, STA, and container response shapes.
- [x] Confirm the container backend exists while the page is hidden in AP/bridge mode.
- [x] Confirm GenericService GET 404 is method/build evidence, not proof of superadmin-only access.

### Hidden settings already verified

- [x] Verify Band Steering can be changed by the normal admin and confirmed through both band status reads.
- [x] Verify 5 GHz OFDMA can be changed by the normal admin and confirmed through the 5 GHz status read.
- [x] Record that HTTP 200 alone is not proof of a successful configuration change.

### Static-only investigations

- [x] Command CGI wrappers and absence of literal Nokia command arguments.
- [x] GenericService/UBUS envelope and shared-product function inventory.
- [x] RRM / Enhanced Roaming write path and confirmation flow.
- [x] Optimize Network write path and timer behavior.
- [x] STA and STA2 frontend data paths.
- [x] Container visibility and absence of lifecycle call sites.
- [x] Radio-access polling chain and 403 fallback behavior.

## Remaining investigation

### A. Review the 40 skipped entries

- [x] Add a passive skipped-entry review script that produces redacted tables.
- [x] Re-run the latest script from the raw GitHub file; the earlier 03:49 result was from the older classifier (`137 ambiguous / 9 unknown`).
- [x] Confirm the corrected 41 safe-read / 65 mutator / 31 ambiguous-read / 9 unknown split.
- [x] Produce a reviewed table for the 31 `ambiguous-read` entries.
- [x] Produce a reviewed table for the 9 `unknown` entries.
- [x] For each entry, identify the exact frontend action, HTTP method, query keys, and likely side effect.
- [x] Publish the redacted dated report: [authorized CGI skipped-entry review](research/authorizedcgi-skipped-entry-review-2026-08-19.md).
- [ ] Do not probe an ambiguous entry until its exact read behavior is proven from source.

### B. Complete passive source coverage

- [ ] Inspect any lazy-loaded chunks that are not present in the current session.
- [ ] Re-run the one-shot source inventory after visiting relevant pages.
- [ ] Resolve stale chunk 404s where a valid application copy is available.
- [ ] Add a source-derived endpoint/method matrix with separate read and write columns.

### C. Command CGI

- [ ] Search all lazy-loaded frontend chunks for a literal Nokia argument.
- [ ] Identify whether `cat` and `pexist` are used only for product-internal command files.
- [ ] Document the accepted namespace without calling the endpoint.
- [-] Do not test arbitrary paths, shell commands, or guessed filenames.

### D. GenericService

- [ ] Enumerate every literal `createBody("...")` call and its product context.
- [ ] Separate Beacon-relevant read candidates from cellular/FWA-only functions.
- [ ] Confirm whether a Beacon-specific read function exists.
- [-] Do not send guessed GenericService POST requests.

### E. Normal admin versus superadmin

- [ ] Obtain a legitimate, documented superadmin comparison session or firmware sample, if available.
- [ ] Compare capability trees, `authorizedcgi`, route guards, and runtime statuses.
- [ ] Record differences without publishing credentials or tokens.
- [-] Do not attempt privilege escalation or account discovery.

### F. Hidden or unverified configuration settings

- [ ] Decide whether to test guest Wi-Fi with a reversible, pre-recorded state.
- [ ] Decide whether to test RRM / Enhanced Roaming with a recovery plan.
- [ ] Decide whether to test Optimize Network with a recovery plan.
- [ ] Decide whether to test bridge mode or mesh changes only when physical access is available.
- [ ] Review parental-control, routing, storage, and diagnostic write paths individually.
- [ ] For every approved change: capture state, change one setting, verify, and restore if needed.

## Blockers and operational items

- [!] Browser automation is blocked by the plugin’s trusted-RPC path error; manual DevTools execution remains available.
- [ ] Replace the temporary router admin password after testing.
- [ ] Keep a wired recovery path and known-good configuration before any write test.
- [ ] Remove all temporary credentials and sensitive attachments from local notes and public reports.
- [ ] Record the exact firmware/operator build if it becomes available without exposing device identifiers.

## Intentionally excluded

- [-] Factory reset.
- [-] Reboot or service restart as a test.
- [-] Firmware upgrade or downgrade.
- [-] Password or account changes through hidden CGI.
- [-] Delete, restore, storage-write, or container lifecycle actions.
- [-] Command CGI calls.
- [-] GenericService calls with guessed or unverified payloads.
- [-] Automated RRM or Optimize Network changes.

## Recommended next order

1. Use the completed skipped-entry report to select only source-proven, reversible read candidates.
2. Complete passive command-CGI and GenericService call-site inventories.
3. Obtain a legitimate admin/superadmin comparison only if available.
4. Choose at most one reversible hidden setting for a controlled test.
5. Re-run the read-only baseline and update the dated research report.
