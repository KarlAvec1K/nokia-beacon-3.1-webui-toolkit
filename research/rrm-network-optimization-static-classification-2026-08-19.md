# RRM and network-optimization classification — 2026-08-19

## RRM / Enhanced Roaming

The frontend contains a real control chain:

- product support: `SupportRRM`;
- read field: `rrm_enable` from mesh status;
- write path: `mesh_web_app.cgi?v_glb=set&rrm_enable=0|1`;
- transport: CSRF-protected POST;
- confirmation dialog when enabling;
- mesh status refresh after success or failure.

RRM changes radio/mesh behavior. It was not called during the read-only investigation.

## Optimize Network

The radio-settings page has a separate capability gate and a write path:

- capability: `wifi.advancedSettings.optimizeNetwork`;
- endpoint: `wlan_config_web_app.cgi?OptimizeNetwork`;
- method: CSRF-protected POST;
- UI timer can keep the operation unavailable for roughly 15 minutes.

This may change channel behavior and was not called.

## Conclusion

Both features are implemented in the shared frontend, but neither is verified writable for the current admin session. Do not treat a bodyless POST as harmless.
