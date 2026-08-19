// Nokia Beacon 3.1 - read-only hidden-feature response-shape probe
// GET-only. Suppresses all response values and bodies.

await (async () => {
  const targets = [
    { id: 'staInfo2', path: '/sta_info2_web_app.cgi' },
    { id: 'containerManagement', path: '/container_management_status_web_app.cgi' },
    { id: 'meshStatus', path: '/mesh_status_web_app.cgi' },
    { id: 'beaconWorkMode', path: '/whw_beacon_mode_app_status_web_app.cgi?getWorkMode' },
    { id: 'lanIpv4Status', path: '/lan_ipv4_status_web_app.cgi' },
    { id: 'lanIpv6Status', path: '/lan_ipv6_status_web_app.cgi' }
  ];

  const describeJson = parsed => {
    if (parsed == null) return null;
    if (Array.isArray(parsed)) {
      return {
        topLevelType: 'array',
        topLevelLength: parsed.length,
        firstItemType: parsed.length ? typeof parsed[0] : null,
        firstItemKeys:
          parsed.length && parsed[0] && typeof parsed[0] === 'object'
            ? Object.keys(parsed[0]).sort()
            : []
      };
    }

    if (typeof parsed === 'object') {
      const keys = Object.keys(parsed).sort();
      return {
        topLevelType: 'object',
        topLevelKeys: keys,
        childShapes: Object.fromEntries(
          keys.slice(0, 50).map(key => {
            const value = parsed[key];
            if (Array.isArray(value)) {
              return [key, { type: 'array', length: value.length }];
            }
            if (value && typeof value === 'object') {
              return [key, {
                type: 'object',
                keys: Object.keys(value).sort().slice(0, 50)
              }];
            }
            return [key, { type: typeof value }];
          })
        )
      };
    }

    return { topLevelType: typeof parsed };
  };

  const results = [];

  for (const target of targets) {
    try {
      const response = await fetch(target.path, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });

      const text = await response.text();
      let parsed = null;
      let jsonValid = false;

      if (text) {
        try {
          parsed = JSON.parse(text);
          jsonValid = true;
        } catch (_) {}
      }

      results.push({
        id: target.id,
        endpoint: target.path.replace(/^\//, ''),
        status: response.status,
        ok: response.ok,
        redirected: response.redirected,
        contentType: response.headers.get('content-type'),
        bodyClass:
          text.length === 0 ? 'empty' :
          jsonValid ? 'json' :
          'non-json-text',
        bodyLengthBucket:
          text.length === 0 ? '0' :
          text.length < 256 ? '1-255' :
          text.length < 4096 ? '256-4095' :
          text.length < 65536 ? '4096-65535' :
          '65536+',
        jsonShape: jsonValid ? describeJson(parsed) : null
      });
    } catch (e) {
      results.push({
        id: target.id,
        endpoint: target.path.replace(/^\//, ''),
        transportError: String(e)
      });
    }
  }

  return JSON.stringify({
    meta: {
      mode: 'six-get-only-hidden-feature-response-shape-probe',
      generatedAt: new Date().toISOString()
    },
    safety: {
      requestsSent: targets.length,
      methods: ['GET'],
      responseBodiesIncluded: false,
      responseValuesIncluded: false,
      tokensIncluded: false
    },
    results
  }, null, 2);
})();
