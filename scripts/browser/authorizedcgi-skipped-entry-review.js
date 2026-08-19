// Nokia Beacon 3.1 - passive review of skipped authorized CGI entries
// Produces reviewed tables for ambiguous-read and unknown entries.
// It fetches only the capability list and same-origin JavaScript source.
// It never calls any skipped CGI and never reads router response bodies.

await (async () => {
  const MAX_JS_FILES = 250;
  const CONTEXT_RADIUS = 420;

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

  const fileName = url => {
    try { return new URL(url).pathname.split('/').pop() || '(unnamed)'; }
    catch (_) { return '(invalid)'; }
  };

  const discoverJs = (source, base) => {
    const found = new Set();
    for (const pattern of [
      /(?:src|href)\s*=\s*["']([^"']+\.js(?:\?[^"'\s]*)?)["']/gi,
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
    let requested;
    try { requested = new URL(endpoint, location.origin); }
    catch (_) { return []; }

    const requestedKeys = [...requested.searchParams.keys()].sort().join('&');

    return mappings.filter(item => {
      let mapped;
      try { mapped = new URL(item.endpoint, location.origin); }
      catch (_) { return false; }
      if (mapped.pathname !== requested.pathname) return false;
      const mappedKeys = [...mapped.searchParams.keys()].sort().join('&');
      return mappedKeys === requestedKeys;
    });
  };

  const inferMethod = item => {
    const action = item.action.toLowerCase();
    const context = item.context;

    if (/\b(j\.GET|GET_EXPORT|method:\s*["']GET["'])\b/i.test(context)) {
      return 'GET';
    }
    if (/POST_CSRF_TEXT|POST_CSRF_FWA|POST_CSRF|POST_FORM_DATA|method:\s*["']POST["']/i.test(context)) {
      return /POST_CSRF_FWA/i.test(context) ? 'POST_JSON' : 'POST';
    }
    if (/^(get|status|info|overview|check)/i.test(action)) return 'likely_GET';
    if (/^(set|add|del|delete|remove|start|stop|save|config|enable|disable|reset|restore|upgrade|reboot|cancel|trigger)/i.test(action)) {
      return 'likely_POST_or_action';
    }
    return 'unknown';
  };

  const sideEffectFor = (entry, mappingsForEntry) => {
    const raw = entry.toLowerCase();
    const actions = mappingsForEntry.map(x => x.action).join(' ');
    if (dangerousFragments.test(raw) || mutatorWords.test(raw) || mutatorWords.test(actions)) {
      return 'potential configuration change, action, scan, deletion, or service operation';
    }
    if (mappingsForEntry.length) {
      return 'read-like or product-specific action; exact behavior is unresolved';
    }
    return 'unknown; do not call without a separately reviewed frontend call site';
  };

  const classify = raw => {
    let url;
    try { url = new URL(raw, location.origin); }
    catch (_) { return 'unknown'; }

    if (url.origin !== location.origin) return 'unknown';

    const path = url.pathname.toLowerCase();
    const base = path.split('/').pop() || '';
    const queryKeys = [...url.searchParams.keys()].map(x => x.toLowerCase());

    if (dangerousFragments.test(path + url.search) ||
        mutatorWords.test(base) ||
        mutatorWords.test(url.search)) {
      return 'ambiguous-read';
    }

    if (queryKeys.some(key => !readQueryKeys.has(key) && key !== 'v')) {
      return 'ambiguous-read';
    }

    const readName =
      path === '/main_web_app.cgi' ||
      path === '/capabilities_status_web_app.cgi' ||
      /(?:^|_)(status|info)_web_app\.cgi$/.test(path) ||
      /(?:dashboard|device|wan|lan|wlan|mesh|overview|pon|statistics|container)[^/]*\.cgi$/.test(path);

    return readName ? 'ambiguous-read' : 'unknown';
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
      meta: { mode: 'passive-skipped-authorizedcgi-review', aborted: true },
      safety: {
        capabilitiesRequestSent: 1,
        cgiRequestsSent: 0,
        skippedCgiRequestsSent: 0,
        responseBodiesRead: 1,
        configurationChanges: 0
      },
      error: String(e)
    }, null, 2);
  }

  const allSkipped = authorized.filter(raw => {
    const bucket = classify(raw);
    return bucket === 'ambiguous-read' || bucket === 'unknown';
  });

  const reviewed = allSkipped.map(raw => {
    const mapped = mappingFor(raw);
    const url = new URL(raw, location.origin);
    const methods = [...new Set(mapped.map(inferMethod))];
    return {
      endpoint: redact(raw),
      bucket: classify(raw),
      queryKeys: [...new Set([...url.searchParams.keys()].map(x => x.toLowerCase()))],
      frontendActions: [...new Set(mapped.map(x => x.action))],
      inferredHttpMethods: methods,
      sourceFiles: [...new Set(mapped.map(x => x.file))],
      likelySideEffect: sideEffectFor(raw, mapped)
    };
  });

  const ambiguous = reviewed.filter(x => x.bucket === 'ambiguous-read');
  const unknown = reviewed.filter(x => x.bucket === 'unknown');

  return JSON.stringify({
    meta: {
      mode: 'passive-skipped-authorizedcgi-review',
      generatedAt: new Date().toISOString(),
      authorizedUniqueCount: authorized.length,
      skippedReviewedCount: reviewed.length,
      ambiguousCount: ambiguous.length,
      unknownCount: unknown.length,
      jsFilesFetched: sources.length,
      discoveredJsUrls: known.size,
      errorCount: errors.length
    },
    safety: {
      sourceOnlyForBundles: true,
      sameOriginOnly: true,
      discoveredScriptsExecuted: false,
      capabilitiesRequestSent: 1,
      cgiRequestsSent: 0,
      skippedCgiRequestsSent: 0,
      responseBodiesRead: 0,
      runtimeValuesIncluded: false,
      queryValuesRedacted: true,
      configurationChanges: 0
    },
    tables: {
      ambiguousRead: ambiguous,
      unknown: unknown
    },
    errors
  }, null, 2);
})();
