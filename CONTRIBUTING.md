# Nokia Beacon 3.1 WebUI Toolkit — Contributing Guide

Thank you for helping improve the Nokia Beacon 3.1 WebUI Toolkit.

## Before opening an issue or pull request

- Confirm owner authorization.
- Record firmware/operator context without serial numbers or customer identifiers.
- Remove tokens, cookies, PSKs, passwords, private MACs, SSIDs, and raw sensitive bodies.
- Separate source evidence, read-only runtime evidence, and configuration-change evidence.
- State whether the session was normal admin or verified superadmin.

## Safe research standards

Prefer:

1. passive JavaScript/source inspection;
2. read-only status requests with bodies suppressed;
3. one controlled change only when recovery is clear;
4. before/after verification.

Do not automate factory reset, reboot, firmware, password changes, deletion, command CGI, unknown GenericService functions, RRM, Optimize Network, or container lifecycle actions.

An HTTP 200 response is transport evidence, not proof that a setting was accepted.

## Naming and organization

Follow [the repository naming standard](docs/naming-and-organization.md):

- new files use lowercase kebab-case;
- dated research uses `YYYY-MM-DD`;
- stable guides do not use dates;
- Markdown titles begin with `Nokia Beacon 3.1 —`;
- scripts use a clear verb/scope/purpose name;
- existing legacy filenames remain stable unless every reference is updated.

## Pull requests

Include a short summary, device context, safety impact, redacted evidence, documentation updates, and limitations.

Review checklist:

- [ ] No secrets or private identifiers.
- [ ] Owner-authorized scope.
- [ ] Mutating actions clearly marked.
- [ ] Read-only claims supported by status-only evidence.
- [ ] Firmware-specific behavior labeled.
- [ ] Relevant documentation updated.
