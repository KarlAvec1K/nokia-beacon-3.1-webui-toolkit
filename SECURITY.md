# Nokia Beacon 3.1 WebUI Toolkit — Security and Responsible Use

This project is for Nokia Beacon 3.1 devices owned by, or explicitly administered by, the person running the tests.

## Data handling

Status and configuration responses may contain secrets or personal data. Before sharing a log, remove:

- Wi-Fi passwords and PSKs;
- WebUI passwords;
- session and CSRF tokens;
- encrypted session material and private keys;
- serial numbers;
- private/client MAC addresses;
- SSIDs, public IP addresses, and ISP/customer identifiers;
- raw STA, mesh, LAN, or cellular response bodies.

Prefer shape-only reports, counts, status codes, and redacted endpoint names.

## What is allowed here

- static inspection of the owner’s loaded JavaScript;
- read-only GET probes with response bodies suppressed;
- comparison of ProductConfig, UI capability, authorized-CGI metadata, and runtime behavior;
- owner-approved configuration changes with a backup and before/after verification;
- documentation of vendor-supported recovery procedures.

## What is not automated

The repository intentionally excludes automatic calls to:

- command CGI;
- GenericService functions with unknown payloads;
- RRM and Optimize Network;
- reboot, factory reset, firmware, password, deletion, install, or lifecycle actions;
- any route whose query looks like a write or scan.

A normal admin session does not become superadmin because a hidden route exists. Do not attempt to bypass role checks.

## Reporting security issues

If a finding enables unauthenticated or remote compromise, do not publish a weaponized proof of concept first. Contact the vendor/operator through a responsible disclosure channel and document the issue only after appropriate remediation steps.
