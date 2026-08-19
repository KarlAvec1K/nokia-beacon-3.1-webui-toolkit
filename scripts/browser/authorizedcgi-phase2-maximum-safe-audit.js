// Nokia Beacon 3.1 - phase 2 maximum-safe authorized CGI audit
// One paste. It inventories every authorized CGI, enriches the classification
// from same-origin JavaScript source, and probes only strict GET/read routes.
// It never calls mutator-like endpoints and never reads response bodies.

await (async () => {
  const MAX_JS_FILES = 250;
  const REQUEST_TIMEOUT_MS = 6000;
  const MAX_SAFE_GETS = 150;
  const CONTEXT_RADIUS = 360;

  const mutatorWords = /(?:^|[_?&=./-])(set|add|del|delete|remove|start|stop|save|config|enable|disable|switch|reset|restore|upgrade|reboot|cancel|trigger|upload|download|export|import|post|password|passwd|pwd|factory|deep|firmware)(?:$|[_?&=./-])/i;
  const dangerousFragments = /(?:mesh_web_app|wlan_config_web_app|restore_web_app|reboot|factory|firmware|password|set_|add_|del_|delete|start_|stop_|save_|config_|enable_|disable_|switch_|trigger_)/i;
  const readQueryKeys = new Set([
    'status', 'info', 'get', 'getroot', 'getworkmode', 'ipv4', 'ipv6',
    'wlan', 'diagnostic_status', 'current_speed', 'act'
  ]);

  const normalize = (value, base = location.href) => {
    try {
      const url = new URL(value, base);
      return url.origin === location.origin ? url.href : null;
    } catch (_) {
      return null;
    }
  };

  const redact = value => {
    try {
      const url = new URL(value, location.origin);
      const keys = [...url.searchParams.keys()];
      return url.pathname + (
        keys.length
          ? '?' + keys.map(key => encodeURIComponent(key) + '=REDACTED').join('&')
          : ''
      );
    } catch (_) {
      return String(value).replace(/([?&][^=]+=)[^&]*/g, '$1REDACTED');
    }
  };

  const discoverJs = (source, base) => {
    const found = new Set();
    for (const pattern of [
      /(?:src|href)\s*=\s*["']([^"']+\.js(?:\?[^"']*)?)["']/gi,
      /["']([^"'\s]+\.js(?:\?[^"'\s]*)?)["']/gi
    ]) {
      let match;
      while ((match = pattern.exec(source))) {
        const url = normalize(match[1], base);
        if (url) found.add(url);
      }
    }
    return [...found];
  };

  const fileName = url => {
    try { return new URL(url).pathname.split('/').pop() || '(unnamed)'; }
    catch (_) { return '(invalid)'; }
  };

  const queue = [];
  const known = new Set();
  const fetched = new Set();
  const sources = [];
  const errors = [];

  const enqueue = value => {
    const url = normalize(value);
    if (url && !known.has(url)) {
      known.add(url);
      queue.push(url);
    }
  };

  for (const entry of performance.getEntriesByType('resource')) {
    if (/\.js(?:\?|$)/i.test(entry.name)) enqueue(entry.name);
  }

  try {
    const response = await fetch(new URL(location.pathname, location.origin), {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'manual'
    });
    discoverJs(await response.text(), location.href).forEach(enqueue);
  } catch (e) {
    errors.push({ scope: 'entry-document', error: String(e) });
  }

  while (queue.length && fetched.size < MAX_JS_FILES) {
    const url = queue.shift();
    if (fetched.has(url)) continue;
    fetched.add(url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        redirect: 'manual'
      });
      if (!response.ok) {
        errors.push({ scope: fileName(url), status: response.status });
        continue;
      }
      const source = await response.text();
      sources.push({ file: fileName(url), source });
      discoverJs(source, url).forEach(enqueue);
    } catch (e) {
      errors.push({ scope: fileName(url), error: String(e) });
    }
  }

  // Extract action -> CGI literals and a bounded source context for method hints.
  const mappings = [];
  const mappingPattern =
    /([A-Za-z_$][\w$]*)\s*:\s*["']([^"'\r\n]*\.cgi[^"'\r\n]*)["']/g;
  for (const item of sources) {
    let match;
    while ((match = mappingPattern.exec(item.source))) {
      mappings.push({
        action: match[1],
        endpoint: match[2],
        file: item.file,
        context: item.source.slice(
          Math.max(0, match.index - CONTEXT_RADIUS),
          Math.min(item.source.length, match.index + match[0].length + CONTEXT_RADIUS)
        )
      });
    }
  }

  const mappingFor = endpoint => {
    const path = (() => {
      try { return new URL(endpoint, location.origin).pathname; }
      catch (_) { return endpoint.split('?')[0]; }
    })();
    return mappings.filter(x => {
      try { return new URL(x.endpoint, location.origin).pathname === path; }
      catch (_) { return x.endpoint.split('?')[0] === path; }
    });
  };

  const strictReadPath = (url, mappingsForEndpoint) => {
    const path = url.pathname.toLowerCase();
    const base = path.split('/').pop() || '';
    const queryKeys = [...url.searchParams.keys()].map(x => x.toLowerCase());

    if (dangerousFragments.test(path + url.search)) {
      return { bucket: 'mutator', reason: 'mutator-fragment' };
    }
    if (queryKeys.some(key => !readQueryKeys.has(key) && key !== 'v')) {
      return { bucket: 'ambiguous-read', reason: 'unknown-query-key' };
    }
    if (mutatorWords.test(base) || mutatorWords.test(url.search)) {
      return { bucket: 'mutator', reason: 'mutator-word' };
    }

    const mappedRead = mappingsForEndpoint.some(x =>
      /(?:^|_)(get|status|info|overview|capabilit)/i.test(x.action) ||
      /\bGET\b|j\.GET|GET_EXPORT/i.test(x.context)
    );

    const readName =
      path === '/main_web_app.cgi' ||
      path === '/capabilities_status_web_app.cgi' ||
      /(?:^|_)(status|info)_web_app\.cgi$/.test(path) ||
      /(?:dashboard|device|wan|lan|wlan|mesh|overview|storage|pon|statistics|container)[^/]*\.cgi$/.test(path);

    if (mappedRead && readName) {
      return { bucket: 'safe-read', reason: 'static-read-mapping' };
    }
    if (readName) {
      return { bucket: 'safe-read', reason: 'strict-read-name' };
    }

    return { bucket: 'unknown', reason: 'not-proven-read' };
  };

  let authorized = [];
  try {
    const response = await fetch('/capabilities_status_web_app.cgi', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'manual'
    });
    const text = await response.text();
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch (_) {}
    authorized = Array.isArray(parsed?.AdminUserData?.authorizedcgi)
      ? [...new Set(parsed.AdminUserData.authorizedcgi.map(String))]
      : [];
  } catch (e) {
    return JSON.stringify({
      meta: { mode: 'phase2-maximum-safe-authorizedcgi-audit', aborted: true },
      safety: {
        capabilitiesRequestSent: 1,
        cgiRequestsSent: 0,
        responseBodiesRead: 1,
        configurationChanges: 0
      },
      error: String(e)
    }, null, 2);
  }

  const inventory = authorized.map(raw => {
    let url;
    try { url = new URL(raw, location.origin); }
    catch (_) { return { endpoint: redact(raw), bucket: 'invalid', reason: 'invalid-url' }; }

    if (url.origin !== location.origin) {
      return { endpoint: redact(raw), bucket: 'skipped', reason: 'cross-origin' };
    }

    const mapped = mappingFor(raw);
    const decision = strictReadPath(url, mapped);
    return {
      endpoint: redact(raw),
      bucket: decision.bucket,
      reason: decision.reason,
      mappedActions: [...new Set(mapped.map(x => x.action))].slice(0, 12)
    };
  });

  const safe = inventory.filter(x => x.bucket === 'safe-read');
  const snapshots = [];

  for (const item of safe.slice(0, MAX_SAFE_GETS)) {
    const original = authorized.find(raw => redact(raw) === item.endpoint);
    if (!original) continue;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const started = performance.now();

    try {
      const response = await fetch(new URL(original, location.origin).href, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        redirect: 'manual',
        signal: controller.signal
      });
      try { await response.body?.cancel(); } catch (_) {}
      snapshots.push({
        endpoint: item.endpoint,
        status: response.status,
        ok: response.ok,
        redirected: response.redirected,
        elapsedMs: Math.round(performance.now() - started)
      });
    } catch (e) {
      snapshots.push({
        endpoint: item.endpoint,
        status: 'transport-error',
        error: String(e),
        elapsedMs: Math.round(performance.now() - started)
      });
    } finally {
      clearTimeout(timer);
    }
  }

  const counts = {};
  for (const item of inventory) {
    counts[item.bucket] = (counts[item.bucket] || 0) + 1;
  }

  return JSON.stringify({
    meta: {
      mode: 'phase2-maximum-safe-authorizedcgi-audit',
      generatedAt: new Date().toISOString(),
      authorizedUniqueCount: authorized.length,
      jsFilesFetched: sources.length,
      discoveredJsUrls: known.size,
      inventoryCount: inventory.length,
      safeGetsAttempted: snapshots.length,
      errorCount: errors.length
    },
    safety: {
      sourceInspectionOnlyForBundles: true,
      sameOriginOnly: true,
      discoveredScriptsExecuted: false,
      capabilitiesRequestSent: 1,
      cgiRequestsSent: snapshots.length,
      safeReadGETsOnly: true,
      mutatorRequestsSent: 0,
      ambiguousRequestsSent: 0,
      responseBodiesRead: 0,
      responseBodiesCancelled: true,
      configurationChanges: 0
    },
    bucketCounts: counts,
    inventory,
    snapshots,
    errors
  }, null, 2);
})();
