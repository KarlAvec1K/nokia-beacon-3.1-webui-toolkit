// Nokia Beacon 3.1 - passive resolver alias mapper
// Static same-origin JS reads only. No navigation, code execution, or CGI calls.

await (async () => {
  const origin = location.origin;
  const urls = new Set(
    performance.getEntriesByType('resource')
      .map(x => x.name)
      .filter(x => /\.m?js(?:[?#]|$)/i.test(x))
  );

  const html = await fetch(location.href, {
    credentials: 'include',
    cache: 'no-store'
  }).then(r => r.text());

  for (const m of html.matchAll(/(?:src|href)=["']([^"']+\.m?js(?:[?#][^"']*)?)["']/gi)) {
    try {
      const u = new URL(m[1], location.href);
      if (u.origin === origin) urls.add(u.href);
    } catch (_) {}
  }

  const sources = new Map();
  const queue = [...urls];
  const queued = new Set(queue);
  const errors = [];

  while (queue.length && sources.size < 250) {
    const url = queue.shift();
    try {
      const r = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (!r.ok) {
        errors.push({ file: new URL(url).pathname.split('/').pop(), status: r.status });
        continue;
      }
      const source = await r.text();
      sources.set(url, source);
      for (const m of source.matchAll(/["'`]([^"'`\s]+\.m?js(?:[?#][^"'`\s]*)?)["'`]/gi)) {
        try {
          const u = new URL(m[1], url);
          if (u.origin === origin && !queued.has(u.href)) {
            queued.add(u.href);
            queue.push(u.href);
          }
        } catch (_) {}
      }
    } catch (e) {
      errors.push({ file: new URL(url).pathname.split('/').pop(), error: String(e) });
    }
  }

  const sanitize = s => s
    .replace(/csrf_token\s*[:=]\s*["'][^"']+["']/gi, 'csrf_token:[REDACTED]')
    .replace(/(token|password|passwd|psk|secret|sessionid)\s*[:=]\s*["'][^"']+["']/gi, '$1:[REDACTED]')
    .replace(/\b(?:[0-9A-F]{2}:){5}[0-9A-F]{2}\b/gi, '[REDACTED_MAC]');

  const results = [];
  for (const [url, source] of sources) {
    const file = new URL(url).pathname.split('/').pop();

    for (const m of source.matchAll(/import\{[^}]+\}from["'][^"']+["']/g)) {
      if (/\bas\s+(?:y|T|O)\b/.test(m[0])) {
        results.push({
          kind: 'route-import',
          file,
          position: m.index,
          text: sanitize(m[0])
        });
      }
    }

    for (const name of ['Hot', 'Zot', '$ot']) {
      let pos = source.indexOf('var ' + name + '=');
      if (pos < 0) pos = source.indexOf(name + '=(()=>');
      if (pos >= 0) {
        results.push({
          kind: 'resolver-definition-anchor',
          resolver: name,
          file,
          position: pos,
          context: sanitize(source.slice(Math.max(0, pos - 200), Math.min(source.length, pos + 500)))
        });
      }
    }

    for (const m of source.matchAll(/export\{[^}]+\}/g)) {
      if (/\b(?:Hot|Zot|\$ot)\s+as\b/.test(m[0])) {
        results.push({
          kind: 'resolver-export',
          file,
          position: m.index,
          text: sanitize(m[0])
        });
      }
    }
  }

  return JSON.stringify({
    meta: {
      mode: 'passive-resolver-es-module-alias-map',
      generatedAt: new Date().toISOString(),
      jsFilesFetched: sources.size,
      discoveredJsUrls: queued.size,
      resultCount: results.length,
      errorCount: errors.length
    },
    safety: {
      cgiRequestsSent: 0,
      navigationPerformed: false,
      discoveredScriptsExecuted: false,
      responseBodiesIncluded: false
    },
    results,
    errors
  }, null, 2);
})();
