// Nokia Beacon 3.1 - passive password and role source inventory
// Source-only DevTools script.
// It fetches same-origin HTML/JavaScript source, never executes discovered
// scripts, never calls a CGI endpoint, and never reads runtime storage values.
// It extracts password-related endpoint mappings and role-guard evidence only.

await (async () => {
  const MAX_JS_FILES = 250;
  const CONTEXT_RADIUS = 360;

  const sensitiveTerms =
    /(?:password|passwd|pwd|csrf|token|cookie|session|psk|secret|private[_-]?key)/i;
  const targetTerms = [
    'superadmin',
    'is_ctc_admin',
    'userMode',
    'userModeNKBC',
    'isAdmin',
    'admincheck',
    'authorizedcgi',
    'password_web_app.cgi',
    'set_password_info',
    'set_changepassword_info',
    'set_wifi_pwd',
    'set_fwa_password',
    'changePassword',
    'changeWifiPassword',
    'changePpoePassword'
  ];

  const normalize = (value, base = location.href) => {
    try {
      const url = new URL(value, base);
      return url.origin === location.origin ? url.href : null;
    } catch (_) {
      return null;
    }
  };

  const fileName = url => {
    try {
      return new URL(url).pathname.split('/').pop() || '(unnamed)';
    } catch (_) {
      return '(invalid)';
    }
  };

  const sanitizeContext = value => String(value)
    .replace(/(?:localStorage|sessionStorage)\.getItem\([^)]*\)/gi, 'storage.getItem(REDACTED)')
    .replace(/(?:localStorage|sessionStorage)\.(?:setItem|removeItem)\([^)]*\)/gi, 'storage.mutation(REDACTED)')
    .replace(/([?&](?:token|csrf_token|password|passwd|pwd|psk|secret)=)[^&"'\\s]*/gi, '$1REDACTED')
    .replace(/(["'](?:token|csrf_token|password|passwd|pwd|psk|secret)["']\s*:\s*)["'][^"']*["']/gi, '$1"REDACTED"');

  const discoverJs = (source, base) => {
    const found = new Set();
    for (const pattern of [
      /(?:src|href)\s*=\s*["']([^"']+\.js(?:\?[^"']*)?)["']/gi,
      /["']([^"'\\s]+\.js(?:\?[^"'\\s]*)?)["']/gi
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

  const hits = [];
  for (const item of sources) {
    for (const term of targetTerms) {
      let offset = 0;
      while (true) {
        const position = item.source.toLowerCase().indexOf(term.toLowerCase(), offset);
        if (position < 0) break;
        hits.push({
          file: item.file,
          term,
          position,
          context: sanitizeContext(item.source.slice(
            Math.max(0, position - CONTEXT_RADIUS),
            Math.min(item.source.length, position + term.length + CONTEXT_RADIUS)
          ))
        });
        offset = position + term.length;
      }
    }
  }

  const mappings = [];
  const mappingPattern =
    /([A-Za-z_$][\w$]*)\s*:\s*["']([^"'\\r\\n]*\.cgi[^"'\\r\\n]*)["']/g;

  for (const item of sources) {
    let match;
    while ((match = mappingPattern.exec(item.source))) {
      const endpoint = match[2];
      if (!sensitiveTerms.test(match[1] + ' ' + endpoint) &&
          !/password|passwd|pwd|set_wifi_pwd|set_fwa_password/i.test(match[1] + ' ' + endpoint)) {
        continue;
      }
      const context = sanitizeContext(item.source.slice(
        Math.max(0, match.index - CONTEXT_RADIUS),
        Math.min(item.source.length, match.index + match[0].length + CONTEXT_RADIUS)
      ));
      const action = match[1];
      const likelyMethod =
        /(?:j\.GET|method:\s*["']GET["'])/i.test(context) ? 'GET' :
        /POST_CSRF|POST_FORM_DATA|method:\s*["']POST["']/i.test(context) ? 'POST' :
        /^(get|status|info|check)/i.test(action) ? 'likely_GET' :
        'likely_POST_or_action';

      let redactedEndpoint = endpoint.replace(
        /([?&](?:token|csrf_token|password|passwd|pwd|psk|secret)=)[^&]*/gi,
        '$1REDACTED'
      );

      mappings.push({
        file: item.file,
        action,
        endpointTemplate: redactedEndpoint,
        inferredHttpMethod: likelyMethod,
        classification: /^(get|status|info|check)/i.test(action)
          ? 'read-like-source-mapping'
          : 'password-or-configuration-action',
        context
      });
    }
  }

  const roleHits = hits.filter(x =>
    /superadmin|is_ctc_admin|userMode|isAdmin|admincheck|authorizedcgi/i.test(x.term)
  );
  const passwordHits = hits.filter(x =>
    /password|passwd|pwd|changePassword|set_fwa_password|set_wifi_pwd/i.test(x.term)
  );

  return JSON.stringify({
    meta: {
      mode: 'passive-password-role-source-inventory',
      generatedAt: new Date().toISOString(),
      jsFilesFetched: sources.length,
      discoveredJsUrls: known.size,
      sourceBytes: sources.reduce((sum, item) => sum + item.source.length, 0),
      roleHitCount: roleHits.length,
      passwordHitCount: passwordHits.length,
      passwordMappingCount: mappings.length,
      errorCount: errors.length
    },
    safety: {
      sourceOnly: true,
      sameOriginOnly: true,
      discoveredScriptsExecuted: false,
      runtimeStorageRead: false,
      cgiRequestsSent: 0,
      responseBodiesRead: 0,
      runtimeValuesIncluded: false,
      credentialValuesIncluded: false,
      configurationChanges: 0
    },
    passwordMappings: mappings,
    roleGuardHits: roleHits,
    passwordRelatedHits: passwordHits,
    errors
  }, null, 2);
})();
