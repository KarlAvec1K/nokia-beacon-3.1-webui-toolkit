# Contributing

Thank you for helping improve the Nokia Beacon 3.1 WebUI Toolkit.

## Before opening an issue or pull request

- Confirm that the device was yours or that you had explicit authorization.
- Record firmware/operator context without publishing serial numbers or customer identifiers.
- Remove tokens, cookies, PSKs, passwords, private MAC addresses, SSIDs, and raw sensitive response bodies.
- Separate static source evidence, runtime read evidence, and configuration-change evidence.
- State whether the result was observed on a normal admin session or a verified superadmin session.

## Safe research standards

Prefer this order:

1. passive JavaScript/source inspection;
2. read-only status requests with response bodies suppressed;
3. one controlled configuration change only when the purpose and recovery path are clear;
4. before/after verification using the matching status endpoint.

Do not add automated calls for factory reset, reboot, firmware, password changes, deletion, command CGI, GenericService functions with unknown payloads, RRM, Optimize Network, or container lifecycle actions.

A HTTP 200 response is transport evidence, not proof that a setting was accepted.

## Pull requests

A useful pull request should include:

- a short summary of the finding or change;
- exact device/firmware context when relevant;
- safety impact and whether any request changed configuration;
- redacted evidence or a reproducible script;
- documentation updates;
- limitations and open questions.

Keep commits focused. Do not include generated dumps containing secrets.

## Documentation style

Use clear English, stable endpoint names, and explicit labels such as:

- Verified read;
- Verified writable by normal admin;
- Frontend mapping only;
- Ambiguous;
- Denied;
- Not tested for safety.

## Review checklist

- [ ] No secrets or private identifiers are included.
- [ ] The scope is owner-authorized.
- [ ] Mutating actions are clearly marked.
- [ ] Read-only claims are supported by status-only evidence.
- [ ] Firmware-specific behavior is labeled as such.
- [ ] Relevant Markdown documentation is updated.
