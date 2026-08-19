// Nokia Beacon 3.1 - passive recursive route/permission inventory
// Fetches same-origin HTML/JavaScript as text only. Does not execute discovered
// scripts and does not call CGI/API endpoints other than static WebUI resources.

await (async () => {
  const MAX_JS_FILES = 250;
  const MAX_MATCHES_PER_CATEGORY = 200;
  const MAX_CONTEXT = 220;

  const origin = location.origin;
  const initial = new Set(
    performance.getEntriesByType('resource')
      .map(x => x.name)
      .filter(x => /\.m?js(?:[?#]|$)/i.test(x))
  );

  const errors = [];
  try {
    const html = await fetch(location.href, {
      credentials: 'include',
      cache: 'no-store'
    }).then(r => r.text());

    for (const m of html.matchAll(/(?:src|href)=["']([^"']+\.m?js(?:[?#][^"']*)?)["']/gi)) {
      initial.add(new URL(m[1], location.href).href);
    }
  } catch (e) {
    errors.push({ file: '(document)', error: String(e) });
  }

  const queue = [...initial];
  const queued = new Set(queue);
  const fetched = new Map();

  const addUrl = (raw, base) => {
    try {
      const u = new URL(raw, base);
      if (u.origin !== origin || !/\.m?js(?:[?#]|$)/i.test(u.href)) return;
      if (!queued.has(u.href) && fetched.size + queue.length < MAX_JS_FILES) {
        queued.add(u.href);
        queue.push(u.href);
      }
    } catch (_) {}
  };

  while (queue.length && fetched.size < MAX_JS_FILES) {
    const url = queue.shift();
    try {
      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!response.ok) {
        errors.push({
          file: new URL(url).pathname.split('/').pop(),
          status: response.status
        });
        continue;
      }

      const source = await response.text();
      fetched.set(url, source);

      for (const m of source.matchAll(/["'`]([^"'`\s]+\.m?js(?:[?#][^"'`\s]*)?)["'`]/gi)) {
        addUrl(m[1], url);
      }
    } catch (e) {
      errors.push({
        file: new URL(url).pathname.split('/').pop(),
        error: String(e)
      });
    }
  }

  const categories = {
    roleTerms: /\b(?:superadmin|super_admin|administrator|admin|operator|userrole|user_role|roleid|role_id)\b/gi,
    accessTerms: /\b(?:accesscontrol|access_control|permission|privilege|authorize|authorization|guard|canactivate|forbidden|unauthorized)\b/gi,
    visibilityTerms: /\b(?:hidden|hide|visible|visibility|disabled|enabled|featureflag|feature_flag|capability)\b/gi,
    routeTerms: /\b(?:loadchildren|loadcomponent|redirectto|pathmatch|canmatch|canload|canactivate)\b/gi,
    cgiPaths: /[A-Za-z0-9_./-]+\.cgi(?:\?[A-Za-z0-9_+.%=&-]*)?/gi
  };

  const findings = Object.fromEntries(Object.keys(categories).map(k => [k, []]));

  const sanitize = value => value
    .replace(/csrf_token\s*[:=]\s*["'][^"']+["']/gi, 'csrf_token:[REDACTED]')
    .replace(/(?:token|password|passwd|psk|secret|sessionid)\s*[:=]\s*["'][^"']+["']/gi, '$1:[REDACTED]')
    .replace(/\b(?:[0-9A-F]{2}:){5}[0-9A-F]{2}\b/gi, '[REDACTED_MAC]');

  for (const [url, source] of fetched) {
    const file = new URL(url).pathname.split('/').pop();
    for (const [category, regex] of Object.entries(categories)) {
      regex.lastIndex = 0;
      let match;
      while (
        findings[category].length < MAX_MATCHES_PER_CATEGORY &&
        (match = regex.exec(source))
      ) {
        const start = Math.max(0, match.index - MAX_CONTEXT / 2);
        const end = Math.min(source.length, match.index + match[0].length + MAX_CONTEXT / 2);
        findings[category].push({
          file,
          value: sanitize(match[0]),
          position: match.index,
          context: sanitize(source.slice(start, end))
        });
        if (match[0].length === 0) regex.lastIndex++;
      }
    }
  }

  return JSON.stringify({
    meta: {
      mode: 'passive-recursive-same-origin-route-permission-source-only',
      generatedAt: new Date().toISOString(),
      maxJsFiles: MAX_JS_FILES,
      jsFilesFetched: fetched.size,
      discoveredJsUrls: queued.size,
      remainingQueue: queue.length,
      errorCount: errors.length
    },
    safety: {
      cgiRequestsSent: 0,
      discoveredScriptsExecuted: false,
      responseBodiesIncluded: false
    },
    counts: Object.fromEntries(
      Object.entries(findings).map(([k, v]) => [k, v.length])
    ),
    findings,
    errors
  }, null, 2);
})();
