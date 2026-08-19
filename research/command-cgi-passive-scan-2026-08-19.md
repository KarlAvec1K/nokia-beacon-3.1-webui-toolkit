# Nokia Beacon 3.1 — Research: Command-CGI Passive Scan (2026-08-19)

## Result

Recursive source inspection fetched 18 JavaScript bundles and discovered 19 same-origin URLs. It found wrapper code for:

- `command_web_app.cgi?pexist+`;
- `command_web_app.cgi?cat+`;
- `command_web_app.cgi?catFWA+`.

No literal command argument or application call site was found.

## Safety

- zero command-CGI requests;
- no discovered script executed;
- no filesystem path tested;
- no response body collected.

The route is therefore confirmed as a frontend capability, not as an approved arbitrary command or file-reading interface. Do not invent arguments.
