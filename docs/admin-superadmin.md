# Admin vs. superadmin

The Beacon 3.1 WebUI separates at least three concepts that should not be confused:

1. **Product support** — whether the hardware/firmware implements a feature.
2. **UI capability / operator policy** — whether the WebUI exposes that feature to the logged-in role/operator profile.
3. **Backend acceptance** — whether the CGI actually accepts a setting from the current authenticated session.

A feature can therefore be:

- supported and visible,
- supported but disabled in the UI,
- supported but hidden in the UI,
- present in frontend code but rejected by the backend,
- accepted by the backend even when hidden by the UI.

## Capability behavior observed

The WebUI capability helper interprets values broadly as:

```text
1  -> visible/enabled
0  -> visible but disabled
-1 -> hidden
```

The ProductConfig layer separately reports actual device support, including `SupportBandSteering`, `SupportRRM`, `SupportMimo`, and Wi-Fi generation.

This distinction is important: on the tested Beacon 3.1, OFDMA and Band Steering were not normally exposed but their backend behavior could still be investigated from a normal authenticated local session.

## Research goal

Document what an owner can legitimately do when the superadmin credential is unavailable or cannot be recovered.

Priority areas:

- map `authorizedcgi` and role-dependent CGI access;
- identify hidden pages/routes that are only suppressed in navigation;
- compare normal-admin vs. superadmin capability responses when samples become available;
- determine what `service_function_web_app.cgi` exposes;
- document configuration-backup structure without publishing secrets;
- identify settings that remain backend-accessible to a normal authenticated administrator;
- document recovery methods that rely on owner-controlled local access and vendor-supported recovery paths.

## Non-goals

This repository is not intended for:

- credential brute force;
- credential theft;
- remote authentication bypass;
- attacking devices the researcher does not own or administer.

Research should be reproducible using a locally owned Beacon 3.1 and an authenticated session whenever possible.

## Open questions

- Is `authorizedcgi` generated from role, operator profile, firmware build, or all three?
- Does AP/bridge mode change backend authorization or only endpoint usefulness?
- Are hidden UI capability values enforced server-side, or only in JavaScript?
- Does the Beacon expose a recoverable privileged account through a documented owner recovery workflow?
- What exact role differences exist between operator-customized firmware builds?
