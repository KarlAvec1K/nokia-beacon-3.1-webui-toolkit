# command_web_app.cgi passive source scan — 2026-08-19

## Result

Two passive scans were performed without contacting `command_web_app.cgi`.

### Loaded-resource scan

- 8 JavaScript files scanned
- 14 wrapper/mapping/error-handling hits
- 0 literal command arguments

### Recursive same-origin scan

- 19 JavaScript URLs discovered
- 18 JavaScript files fetched
- 0 call sites
- 0 literal arguments
- 2 `.cmd` string matches
- 1 non-critical fetch error: `zone.js` returned HTTP 404
- 0 command CGI requests sent
- downloaded scripts were not executed

Both `.cmd` matches are template fragments inside the generic wrapper definitions in `chunk-TFGNHVAU.js`:

```text
<argument>.cmd
```

They are not concrete command names.

## Confirmed frontend mappings

```text
invokeShellExistCommand(n)
  POST_CSRF
  command_web_app.cgi?pexist+<n>

invokeShellCatCommand(n)
  POST_CSRF_TEXT
  command_web_app.cgi?cat+<n>.cmd

invokeShellCatCommandFWA(n)
  POST_CSRF_TEXT
  command_web_app.cgi?catFWA+<n>.cmd
```

## Interpretation

The recursively reachable same-origin JavaScript set contains the generic API wrappers but no concrete caller or literal command name. This lowers the likelihood that the Beacon 3.1 WebUI actively uses these CGI operations in its reachable route chunks.

It does not prove that the backend routes are absent. Possible remaining sources include runtime-computed arguments, unreachable or unreferenced chunks, other product variants, and firmware-side artifacts not shipped in the WebUI.

The `zone.js` 404 does not materially weaken the result: it is a framework dependency name and the queue was otherwise exhausted.

## Runtime testing policy

Do not send invented values to:

```text
command_web_app.cgi?pexist+
command_web_app.cgi?cat+
command_web_app.cgi?catFWA+
```

until a concrete command name is observed in Nokia-owned code or another owner-controlled firmware artifact. The argument namespace and side effects remain unknown even though the current admin role advertises some of these routes.

## Next passive step

Pivot away from runtime probing of the command CGI. Continue with one of:

1. inventory route definitions, lazy-load maps, feature flags, and access-control metadata across the fetched bundles;
2. search owner-controlled firmware/static artifacts for concrete `.cmd` names;
3. compare admin-visible routes with frontend route guards and superadmin-only identifiers.
