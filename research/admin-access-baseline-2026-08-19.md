# Normal-admin access baseline — 2026-08-19

## Test context

- Device: Nokia / ALCL Beacon 3.1
- Session: authenticated local normal admin
- Mode: AP / bridge
- Inventory: read-only
- Physical radios reported: 2.4 GHz and 5 GHz

## Baseline counts

- `authorizedcgi`: 150 raw entries, 146 unique entries
- Frontend CGI strings: about 278
- Capability leaves: 92 hidden (`-1`), 100 disabled (`0`)

## Important interpretation

`authorizedcgi` is not a complete runtime ACL. On this session, both `capabilities_status_web_app.cgi` and `main_web_app.cgi` were readable even though they were not listed.

Use four labels:

1. listed-authorized;
2. unlisted but runtime-readable;
3. runtime denied or empty;
4. not yet tested.

## Product support reported

The capability model reported support for Band Steering, MIMO, RRM, WPS, STA information, container management, port mirroring, Wi-Fi 6, and up to 64 users.

ProductConfig also contains generic ONT/GPON fields. Those fields should not override observed AP/bridge behavior.

## Verified hidden normal-admin writes

- Band Steering: changed and verified.
- 5 GHz OFDMA: changed and verified.

## Hidden or unverified areas

RRM, Optimize Network, bridge mode, mesh changes, guest Wi-Fi, routing, storage, diagnostics, reboot, restore, and firmware paths are present in shared frontend code but were not executed as part of the read-only baseline.

## Safe conclusion

The current normal admin can read substantially more than the navigation menu shows, and can change at least two hidden Wi-Fi settings. This does not establish superadmin access or authorize every mapped CGI.
