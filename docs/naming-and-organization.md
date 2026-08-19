# Nokia Beacon 3.1 — Naming and Organization Standard

## Folder structure

Use these top-level folders:

- `docs/` — stable user-facing explanations and indexes;
- `research/` — dated evidence and investigation reports;
- `scripts/browser/` — DevTools scripts;
- `wifi/` — verified Wi-Fi procedures;
- `.github/` — contribution, issue, and pull-request templates.

## File naming

Use lowercase kebab-case for new files:

```text
feature-area-purpose.md
feature-area-purpose-YYYY-MM-DD.md
action-scope-audit.js
```

Use the date suffix for a point-in-time research result. Use no date for a living guide or index.

Existing filenames such as `authorizedcgi-phase2-maximum-safe-audit.js` are retained for compatibility with links and previous instructions. Do not rename them casually; add a new alias or update every reference in the same change.

## Markdown titles

Every Markdown document begins with:

```markdown
# Nokia Beacon 3.1 — Clear Document Title
```

Research titles should include `Research:` and the observation date. Index files use `... — Documentation Index`, `... — Research Index`, or `... — Wi-Fi Findings Index`.

## Script naming

Browser scripts use:

```text
verb-scope-purpose.js
```

Examples:

- `comprehensive-passive-inventory.js`;
- `authorizedcgi-phase2-maximum-safe-audit.js`;
- `hidden-feature-read-shape-probe.js`.

Each script must state its safety mode in its header and report whether it sent CGI requests, read bodies, or changed configuration.

## Writing style

Use plain English, short sections, tables for comparisons, and explicit evidence labels. Separate:

- what the source code contains;
- what the current admin session could read;
- what the session changed successfully;
- what was deliberately not tested.

Never put secrets in filenames, Markdown, scripts, issues, or pull requests.
