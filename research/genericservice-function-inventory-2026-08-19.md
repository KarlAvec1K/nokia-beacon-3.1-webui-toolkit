# GenericService function inventory — 2026-08-19

## Scope

The shared frontend contains GenericService and UBUS wrappers for several Nokia product families.

## Findings

- `service_function_web_app.cgi` is mapped to GenericService/FWA actions;
- the envelope uses JSON with a function name and optional parameter list;
- literal functions found in shared code include cellular/FWA operations such as `GetCAState` and `GetCellularNetworkIdentification`;
- these strings do not prove Beacon 3.1 support.

## Safety conclusion

Do not guess function names or parameters. A shared bundle is not a device capability list, and a GenericService POST may be state-changing.
