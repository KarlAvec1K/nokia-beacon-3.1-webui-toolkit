# Frontend notes: command CGI and service function

These notes come from the Beacon 3.1 WebUI JavaScript bundle and are specific to the tested frontend build.

## Command helper mappings

The frontend defines:

```text
invoke_shell_exist_command -> command_web_app.cgi?pexist+
invoke_shell_cat_command   -> command_web_app.cgi?cat+
invoke_shell_cat_commandFWA -> command_web_app.cgi?catFWA+
```

The normal-admin `authorizedcgi` array lists:

```text
command_web_app.cgi?pexist
command_web_app.cgi?cat
```

The dedicated API methods construct requests as follows:

```text
invokeShellExistCommand(n)
  POST_CSRF -> command_web_app.cgi?pexist+<n>

invokeShellCatCommand(n)
  POST_CSRF_TEXT -> command_web_app.cgi?cat+<n>.cmd

invokeShellCatCommandFWA(n)
  POST_CSRF_TEXT -> command_web_app.cgi?catFWA+<n>.cmd
```

This is important because `cat` and `pexist` are not merely dead strings in a generic frontend bundle; there are explicit frontend methods for them.

The intended namespace represented by `<n>` is still unknown. Before testing, recover the call sites that supply `<n>` so the repository can document the expected command-file names rather than probing arbitrary filesystem paths.

## `service_function_web_app.cgi`

The relative URL table maps both:

```text
set_fwa_password -> service_function_web_app.cgi
ubus             -> service_function_web_app.cgi
```

The route is not listed in the captured normal-admin `authorizedcgi` array, but `authorizedcgi` has now been shown not to be a complete runtime ACL. Therefore its real status remains **unknown until safely tested**.

Do not send a write payload yet. First recover the API method(s) for `set_fwa_password` and `ubus`, including:

- HTTP method
- CSRF mode
- payload shape
- call sites
- whether the generic `ubus` mapping is used on Beacon 3.1 or only on other product families

## Authorization-model warning

`capabilities_status_web_app.cgi` and `main_web_app.cgi` are known readable by the current admin session despite not being listed in `authorizedcgi`.

Accordingly, future documentation must avoid language such as "not authorized" based solely on absence from the array. Use `not-listed-for-current-admin` until an actual runtime request classifies the route.
