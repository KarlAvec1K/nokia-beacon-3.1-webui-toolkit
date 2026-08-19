# Security and responsible use

This project is intended for research on **Nokia Beacon 3.1 devices that you own or are explicitly authorized to administer**.

## Do not publish secrets

Before opening an issue, PR, discussion, or attaching logs, remove:

- Wi-Fi passwords / PSKs
- WebUI passwords
- session tokens
- CSRF tokens
- encrypted session blobs
- private keys
- device serial numbers
- personal/client MAC addresses
- ISP account or customer identifiers

Some Beacon status/configuration endpoints may expose sensitive values in clear text. Treat raw dumps as secrets until reviewed.

## Scope of this repository

Allowed research includes:

- documenting hidden UI controls;
- comparing ProductConfig support with UI capability gating;
- inspecting JavaScript loaded by the owner's WebUI;
- calling CGI endpoints from an already authenticated local session;
- documenting owner recovery and vendor-supported recovery procedures;
- verifying settings by reading device state before and after changes.

This repository should not be used to publish brute-force tooling, credential theft, remote authentication bypasses, or instructions for attacking devices without authorization.

## Reporting a vulnerability

If a finding would allow unauthenticated or remote compromise rather than merely exposing owner-accessible hidden controls, avoid publishing weaponized proof-of-concept code immediately. Prefer responsible disclosure to the vendor/operator first, then document the issue after an appropriate remediation window.
