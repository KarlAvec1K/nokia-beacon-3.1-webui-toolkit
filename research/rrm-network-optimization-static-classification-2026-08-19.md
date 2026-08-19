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


## Exact method extraction

Brace-balanced extraction recovered the complete relevant methods.

### Enhanced Roaming payload and state recovery

The toggle converts the Boolean choice to the integer `1` or `0` and passes that value as the suffix of the RRM endpoint. Enabling requires an explicit confirmation; disabling proceeds directly.

The request contains no JSON body in this frontend model. It is a CSRF-protected POST whose URL ends with the selected integer. After either success or failure, the page requests mesh status again and replaces the toggle value with the returned `rrm_enable` value. This confirms both the mutation risk and the backend-as-source-of-truth recovery behavior.

### Optimize Network invocation

The optimization method first identifies bands whose automatic-channel setting is disabled:

- if every supported band is manual, it displays an informational warning and does not call the endpoint;
- if only some bands are manual, it displays a continuation warning listing those bands;
- otherwise it calls `setNetworkOptimize` and disables the button.

The API method sends a CSRF-protected POST to the OptimizeNetwork endpoint with no explicit request body. The local timer only controls UI availability and messaging; it does not poll or cancel the backend operation.

## Branch status

The RRM and Optimize Network source classification is complete. No runtime authorization probe is warranted because even a bodyless POST can initiate the corresponding configuration change. The recurring `zone.js` 404 is a harmless discovery artifact and does not affect the extracted application bundle.
