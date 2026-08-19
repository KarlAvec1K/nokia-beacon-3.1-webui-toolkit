# Route and permission passive scan — 2026-08-19

## Scope

The scan inspected route declarations, guards, resolvers, role checks, capability reads, and frontend permission helpers without executing discovered JavaScript.

## Findings

- normal admin state is derived from the login response and stored as an admin mode;
- one literal `sessionStorage.currentUser === "superadmin"` exists in shared product code, but this does not prove a superadmin account exists on the Beacon;
- an admin guard exists, but extracted feature routes mostly rely on capabilities and menu logic;
- route resolvers refresh device/capability/hardware data and do not themselves grant privilege;
- `authorizedcgi` is advisory and incomplete at runtime.

## Conclusion

Hidden navigation is not proof of a superadmin-only backend. Conversely, a frontend route or mapping is not proof that the current admin may safely write through it.
