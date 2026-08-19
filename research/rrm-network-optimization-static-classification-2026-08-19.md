# RRM and network-optimization static classification — 2026-08-19

## Scope and safety

A passive recursive scan inspected 19 same-origin JavaScript bundles. No discovered script was executed, no CGI was called, and no configuration change was made.

The automatic hit counters are search heuristics rather than counts of distinct functions. Repeated minified contexts account for most of the 164 hits.

## RRM / Enhanced Roaming

The frontend contains a complete implemented control chain:

- product support flag: `SupportRRM` / `prodcfg.supportRRM`;
- Beacon 3.1 appears in the bundled fallback model list that supports RRM;
- UI label: Enhanced Roaming;
- display condition: product RRM support and root-device detail view;
- read source: `rrm_enable` from the existing mesh-status model;
- read endpoint: `mesh_status_web_app.cgi`;
- write action name: `set_rrm`;
- write endpoint prefix: `mesh_web_app.cgi?v_glb=set&rrm_enable=`;
- transport: CSRF-protected POST.

The toggle asks for confirmation when enabling. Cancelling restores the previous UI value. After a write attempt, both success and failure branches refresh mesh information, so the displayed value is resynchronized from the backend.

This is a real configuration control, not merely an unused string. It must not be runtime-probed during the read-only phase.

No distinct superadmin check was found in this chain. Visibility is based on product support and the root-device context.

## Optimize Network

A separate radio-settings feature exists:

- capability path: `wifi.advancedSettings.optimizeNetwork.visibility`;
- button capability: `wifi.advancedSettings.optimizeNetwork.optimizeButton`;
- write action: `set_ntw_optimize`;
- endpoint: `wlan_config_web_app.cgi?OptimizeNetwork`;
- UI handler: `optimizeNetwork()`;
- a warning is shown when bands are not using automatic channel selection;
- the UI maintains an optimization-running timer for up to approximately 15 minutes.

This feature is separate from the mesh RRM toggle. It appears capable of initiating radio/channel optimization and is therefore potentially disruptive. It must not be called during passive investigation.

## Conclusions

1. RRM/Enhanced Roaming is supported by the Beacon 3.1 frontend and backed by a read/write implementation.
2. Its current value is already available through the safely observed mesh-status response; recording that value is unnecessary.
3. Optimize Network is a second mutating feature with its own capability gate and endpoint.
4. Neither endpoint should be tested merely to distinguish authorization because the request itself can change radio behavior.
5. A final targeted source extraction may safely recover exact argument construction and response handling without contacting either endpoint.
