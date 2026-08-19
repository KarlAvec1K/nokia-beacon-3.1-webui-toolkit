// Nokia Beacon 3.1 - safe runtime GET authorization probe
// Purpose: distinguish `authorizedcgi` membership from actual runtime readability.
//
// READ-ONLY:
// - GET requests only
// - no POST/PUT/PATCH/DELETE
// - does not print response bodies
// - reports only metadata and top-level JSON keys
//
// Run while authenticated to the local Beacon 3.1 WebUI.

await (async () => {
  const candidates = [
    'capabilities_status_web_app.cgi',
    'main_web_app.cgi',
    'access_control_status_web_app.cgi',
    'channel_change_history_status_web_app.cgi',
    'dns_status_web_app.cgi',
    'route_status_web_app.cgi',
    'tr69_status_web_app.cgi',
    'tr369_status_web_app.cgi',
    'user_mgmt_status_web_app.cgi',
    'wifi_schedule_status_web_app.cgi',
    'sta_info_web_app.cgi',
    'sta_info2_web_app.cgi',
    'container_management_status_web_app.cgi',
    'service_function_web_app.cgi'
  ];

  let authorized = [];
  try {
    const caps = await fetch('/capabilities_status_web_app.cgi', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'manual'
    }).then(r => r.json());

    authorized = Array.isArray(caps?.AdminUserData?.authorizedcgi)
      ? caps.AdminUserData.authorizedcgi.map(String)
      : [];
  } catch {}

  const exactSet = new Set(authorized);
  const baseSet = new Set(authorized.map(x => String(x).split('?')[0]));

  const classifyBody = text => {
    const trimmed = String(text || '').trim();
    if (!trimmed) return {
      bodyKind: 'empty',
      bodyLength: 0,
      jsonTopLevelKeys: []
    };

    try {
      const obj = JSON.parse(trimmed);
      let keys = [];
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        keys = Object.keys(obj).slice(0, 50);
      }
      return {
        bodyKind: Array.isArray(obj) ? 'json-array' : 'json-object',
        bodyLength: trimmed.length,
        jsonTopLevelKeys: keys
      };
    } catch {
      const looksHtml = /^\s*<!doctype|^\s*<html|<body|<head/i.test(trimmed);
      return {
        bodyKind: looksHtml ? 'html-or-login-page' : 'text',
        bodyLength: trimmed.length,
        jsonTopLevelKeys: []
      };
    }
  };

  const results = [];

  for (const endpoint of candidates) {
    const base = endpoint.split('?')[0];
    const row = {
      endpoint,
      listedExact: exactSet.has(endpoint),
      listedBase: baseSet.has(base),
      status: null,
      ok: false,
      redirected: false,
      responseType: null,
      bodyKind: null,
      bodyLength: null,
      jsonTopLevelKeys: [],
      runtimeClass: 'unknown'
    };

    try {
      const r = await fetch('/' + endpoint, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        redirect: 'manual'
      });

      row.status = r.status;
      row.ok = r.ok;
      row.redirected = r.redirected;
      row.responseType = r.headers.get('content-type');

      const text = await r.text();
      Object.assign(row, classifyBody(text));

      if (r.ok && row.bodyKind.startsWith('json')) {
        row.runtimeClass = 'runtime-readable-json';
      } else if (r.ok && row.bodyKind === 'empty') {
        row.runtimeClass = 'runtime-200-empty';
      } else if (r.ok) {
        row.runtimeClass = 'runtime-readable-nonjson';
      } else if ([401, 403].includes(r.status)) {
        row.runtimeClass = 'runtime-denied';
      } else if ([301, 302, 303, 307, 308].includes(r.status)) {
        row.runtimeClass = 'runtime-redirect';
      } else if (r.status === 404) {
        row.runtimeClass = 'runtime-not-found';
      } else {
        row.runtimeClass = 'runtime-other';
      }
    } catch (e) {
      row.runtimeClass = 'fetch-error';
      row.error = String(e);
    }

    results.push(row);
  }

  console.table(results.map(x => ({
    endpoint: x.endpoint,
    listed: x.listedExact || x.listedBase,
    status: x.status,
    kind: x.bodyKind,
    length: x.bodyLength,
    runtimeClass: x.runtimeClass
  })));

  return JSON.stringify({
    meta: {
      mode: 'GET-only',
      generatedAt: new Date().toISOString(),
      origin: location.origin
    },
    results
  }, null, 2);
})();
