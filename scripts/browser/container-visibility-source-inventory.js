// Nokia Beacon 3.1 - passive container visibility-decision inventory
// Static same-origin JS reads only. No UBUS, GenericService, container, or CGI calls.

await (async () => {
  const origin = location.origin;
  const queue = [];
  const queued = new Set();
  const sources = new Map();
  const errors = [];

  const enqueue = (raw, base = location.href) => {
    try {
      const u = new URL(raw, base);
      if (u.origin !== origin || !/\.m?js(?:[?#]|$)/i.test(u.href)) return;
      if (!queued.has(u.href) && queued.size < 250) {
        queued.add(u.href);
        queue.push(u.href);
      }
    } catch (_) {}
  };

  performance.getEntriesByType('resource').map(x => x.name).forEach(x => enqueue(x));

  try {
    const html = await fetch(location.href, { credentials: 'include', cache: 'no-store' }).then(r => r.text());
    for (const m of html.matchAll(/(?:src|href)=["']([^"']+\.m?js(?:[?#][^"']*)?)["']/gi)) enqueue(m[1]);
  } catch (e) {
    errors.push({ file: '(document)', error: String(e) });
  }

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
      for (const m of source.matchAll(/["'`]([^"'`\s]+\.m?js(?:[?#][^"'`\s]*)?)["'`]/gi)) enqueue(m[1], url);
    } catch (e) {
      errors.push({ file: new URL(url).pathname.split('/').pop(), error: String(e) });
    }
  }

  const sanitize = s => s
    .replace(/csrf_token\s*[:=]\s*["'][^"']+["']/gi, 'csrf_token:[REDACTED]')
    .replace(/(token|password|passwd|psk|secret|sessionid)\s*[:=]\s*["'][^"']+["']/gi, '$1:[REDACTED]')
    .replace(/\b(?:[0-9A-F]{2}:){5}[0-9A-F]{2}\b/gi, '[REDACTED_MAC]');

  const terms = [
    'showContainerPage',
    'showcontainermenuLink',
    'getUbusRequest',
    'isFsecureAppActive',
    'isParentalCtlModeNew',
    'hidePagesForBridgeMode',
    'SupportContainerManagement'
  ];

  const matches = [];

  for (const [url, source] of sources) {
    const file = new URL(url).pathname.split('/').pop();
    for (const term of terms) {
      let from = 0;
      while (true) {
        const position = source.indexOf(term, from);
        if (position < 0) break;
        matches.push({
          term,
          file,
          position,
          context: sanitize(source.slice(
            Math.max(0, position - 1200),
            Math.min(source.length, position + term.length + 1800)
          ))
        });
        from = position + term.length;
      }
    }
  }

  return JSON.stringify({
    meta: {
      mode: 'passive-container-visibility-decision-source-inventory',
      generatedAt: new Date().toISOString(),
      jsFilesFetched: sources.size,
      discoveredJsUrls: queued.size,
      matchCount: matches.length,
      errorCount: errors.length
    },
    safety: {
      ubusRequestsSent: 0,
      genericServiceRequestsSent: 0,
      containerRequestsSent: 0,
      cgiRequestsSent: 0,
      navigationPerformed: false,
      discoveredScriptsExecuted: false
    },
    matches,
    errors
  }, null, 2);
})();
