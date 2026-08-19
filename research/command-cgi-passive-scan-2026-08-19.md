# command_web_app.cgi passive source scan — 2026-08-19

## Result

A passive scan of the JavaScript resources currently loaded by the Nokia Beacon 3.1 WebUI found:

- 8 JavaScript files scanned
- 14 hits related to the command CGI wrappers/mappings
- 0 literal arguments passed to `invokeShellExistCommand`, `invokeShellCatCommand`, or `invokeShellCatCommandFWA`

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

The scan only found the API wrapper definitions, route map, enum/action names, and generic error handling. It did **not** find a real page/component calling these methods with a concrete command name.

## Important interpretation

`literalArgumentCount = 0` does **not** prove the command CGI is unused.

The first scanner only inspected JavaScript files already loaded in the current browser session. The WebUI is an Angular application with lazy-loaded route chunks, so a call site may exist in a chunk that has not yet been fetched by the browser.

The next step is therefore still passive: recursively discover same-origin JavaScript chunk references and inspect all reachable chunks without executing them and without calling `command_web_app.cgi`.

## Runtime testing policy

Do not send arbitrary values to:

```text
command_web_app.cgi?pexist+
command_web_app.cgi?cat+
command_web_app.cgi?catFWA+
```

until a concrete command name is observed in Nokia's own frontend code or another owner-controlled firmware artifact.

These names strongly suggest an interface to pre-defined shell/command files. Even if the current admin role lists the `pexist` and `cat` routes, the accepted argument namespace and side effects remain unknown.
