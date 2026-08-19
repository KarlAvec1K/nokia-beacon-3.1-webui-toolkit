# Hidden-feature read-only response shapes — 2026-08-19

## Scope and safety

Six status endpoints were queried with GET only. The probe suppressed all response values and bodies and retained only:

- HTTP metadata;
- JSON/non-JSON classification;
- top-level keys;
- nested object keys;
- array lengths;
- coarse body-size buckets.

No identifiers, addresses, SSIDs, credentials, tokens, serial numbers, MAC addresses, or configuration values were recorded.

## Results

| Feature | Endpoint | Result |
|---|---|---|
| STA information | `sta_info2_web_app.cgi` | 200, non-empty non-JSON text |
| Container management | `container_management_status_web_app.cgi` | 200, JSON |
| Mesh | `mesh_status_web_app.cgi` | 200, JSON |
| Beacon work mode | `whw_beacon_mode_app_status_web_app.cgi?getWorkMode` | 200, JSON |
| LAN IPv4 | `lan_ipv4_status_web_app.cgi` | 200, JSON |
| LAN IPv6 | `lan_ipv6_status_web_app.cgi` | 200, JSON |

## STA information

The authorized `sta_info2_web_app.cgi` endpoint returns substantive non-JSON text in the 256–4095 byte range.

This confirms that the hidden STA-information feature is runtime-readable. Its legacy/text serialization must be parsed cautiously because it may contain client identifiers. No body content was retained.

## Container management

The hidden, product-supported container endpoint returns:

```text
DeploymentUnitNumberOfEntries
ExecEnv
ExecEnvNumberOfEntries
ExecutionUnitNumberOfEntries
```

Observed shape:

- one `ExecEnv` array entry;
- numeric deployment-unit, execution-environment, and execution-unit counts.

This confirms that the container-management backend is implemented and exposes at least one execution environment. It does not establish that any application/deployment unit is installed, because the numeric count values were intentionally suppressed.

No lifecycle or configuration action was called.

## Mesh status

The mesh endpoint returns structured runtime data with:

```text
beaconEntries
beacon_detail
has_bridge_wan
is_rgwSerialNo
root_info
rrm_enable
wifipoint_list
```

Observed shapes include one entry each for `beaconEntries`, `is_rgwSerialNo`, `root_info`, and `wifipoint_list`, while `beacon_detail` was empty.

This confirms that the mesh/root topology model is active even without additional beacon-detail entries. Values and identifiers were not retained.

## Beacon work mode

The work-mode endpoint returns a compact JSON object:

```text
reason: number
result: number
workMode: string
```

The actual work-mode string was intentionally not recorded in this shape-only artifact. Earlier contextual evidence classifies the current deployment as AP/bridge mode.

## LAN IPv4

The IPv4 status endpoint returns a substantive configuration model including:

- DHCP configuration;
- LAN interface address/subnet fields;
- DNS/router/domain fields;
- route arrays;
- aliases and device configuration;
- bridge/CPE indicators;
- secondary-LAN structure;
- DHCP relay and operator-specific option fields.

Notable shapes:

- 18 alias entries;
- 5 device configuration entries;
- 4 IPv4 route entries;
- empty static MAC bindings;
- empty conditional serving pools.

This confirms that several LAN controls hidden by capability metadata are backed by a populated read model.

## LAN IPv6

The IPv6 status endpoint returns a substantive model including:

- DHCPv6 server and pool;
- SLAAC configuration;
- prefix delegation;
- LAN DNS configuration;
- prefix/static-mode structures;
- one interface-connection entry.

This likewise confirms a functional read backend behind the partially hidden IPv6 controls.

## High-confidence conclusions

1. All six tested hidden/partially hidden feature families have installed, reachable read endpoints.
2. Hidden UI state does not mean backend absence.
3. Container management is implemented at least through its execution-environment data model.
4. Mesh/root topology is active and structurally populated.
5. LAN IPv4 and IPv6 expose detailed backend models even where individual controls are hidden.
6. Runtime accessibility still does not authorize any corresponding write action.

## Next passive step

Inspect the container-management frontend statically to classify:

- read actions;
- lifecycle actions;
- install/uninstall/update operations;
- capability gates;
- whether the page is hidden solely by capability or also by role.

Do not call container lifecycle endpoints.


## Container-management frontend classification

Static inspection found:

- route: `maintenance/container-management`;
- menu key: `containerManagement`;
- product flag: `SupportContainerManagement`;
- one read action: `get_container_info`;
- one backend mapping: `container_management_status_web_app.cgi`;
- table labels for application name, version, and installation/status state.

No frontend call site or API mapping was found for:

- install;
- uninstall;
- deploy/undeploy;
- start/stop;
- update;
- execution-environment configuration.

Within the reachable WebUI bundles, container management is therefore an **informational status page**, not a lifecycle-management interface.

### Visibility logic

The menu is calculated dynamically and depends on several conditions:

- parental-control capability visibility;
- new parental-control mode;
- `showContainerPage`;
- whether the container status CGI finished loading;
- bridge-mode page suppression;
- whether an F-Secure application is active;
- presence/absence of DeploymentUnit and ExecutionUnit entries.

The route's hidden state is therefore consistent with product/mode/application conflict logic rather than a dedicated admin route guard.

A separate passive inspection is needed to determine how `showContainerPage` is populated and whether that decision depends on the unavailable GenericService/UBUS path.


## Container visibility decision — final classification

A second static pass resolves the remaining ambiguity:

- `showContainerPage` is assigned directly from the product configuration flag for container-management support;
- it is not derived from GenericService or UBUS;
- the observed UBUS helper is FWA-only and requests APN information, so it is unrelated to container visibility;
- `hidePagesForBridgeMode` follows the runtime bridge/AP-mode indicator;
- bridge/AP mode directly suppresses the container menu in the current deployment;
- outside bridge mode, parental-control mode, completion of the container-status read, F-Secure state, and unit presence further affect visibility;
- F-Secure activity is inferred from active execution units whose names contain the bundled SENSE/GRYPHON identifiers.

This closes the container-management branch: the read backend and product support are present, while the WebUI intentionally hides the informational page in the current AP/bridge deployment. No dedicated superadmin gate and no container lifecycle action were found in the inspected frontend. The GenericService/UBUS 404 is not the cause of this menu decision.

## Next passive step

Map the RRM/network-optimization feature statically. The mesh read model exposes an `rrm_enable` field, but no write endpoint should be invoked. The next inventory must only classify product flags, menu/route visibility, read paths, write-path names, payload construction, and UI side effects from downloaded JavaScript source.
