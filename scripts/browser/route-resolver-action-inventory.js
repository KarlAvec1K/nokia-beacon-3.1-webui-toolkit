// Nokia Beacon 3.1 - passive route-resolver/action inventory
// Fetches same-origin JS as text only. Does not navigate, execute discovered code,
// or call CGI/API endpoints other than static WebUI resources.

await (async () => {
  const MAX_JS_FILES = 250;
  const MAX_RESULTS = 250;
  const origin = location.origin;
  const queue = [];
  const queued = new Set();
  const sources = new Map();
  const errors = [];

  const enqueue = (raw, base = location.href) => {
    try {
      const url = new URL(raw, base);
      if (url.origin !== origin || !/\.m?js(?:[?#]|$)/i.test(url.href)) return;
      if (!queued.has(url.href) && queued.size < MAX_JS_FILES) {
        queued.add(url.href);
        queue.push(url.href);
      }
    } catch (_) {}
  };

  performance.getEntriesByType('resource').map(x => x.name).forEach(x => enqueue(x));

  try {
    const html = await fetch(location.href, {
      credentials: 'include',
      cache: 'no-store'
    }).then(r => r.text());
    for (const m of html.matchAll(/(?:src|href)=["']([^"']+\.m?js(?:[?#][^"']*)?)["']/gi)) {
      enqueue(m[1]);
    }
  } catch (e) {
    errors.push({ file: '(document)', error: String(e) });
  }

  while (queue.length && sources.size < MAX_JS_FILES) {
    const url = queue.shift();
    try {
      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!response.ok) {
        errors.push({ file: new URL(url).pathname.split('/').pop(), status: response.status });
        continue;
      }
      const source = await response.text();
      sources.set(url, source);
      for (const m of source.matchAll(/["'`]([^"'`\s]+\.m?js(?:[?#][^"'`\s]*)?)["'`]/gi)) {
        enqueue(m[1], url);
      }
    } catch (e) {
      errors.push({ file: new URL(url).pathname.split('/').pop(), error: String(e) });
    }
  }

  const sanitize = value => value
    .replace(/csrf_token\s*[:=]\s*["'][^"']+["']/gi, 'csrf_token:[REDACTED]')
    .replace(/(token|password|passwd|psk|secret|sessionid)\s*[:=]\s*["'][^"']+["']/gi, '$1:[REDACTED]')
    .replace(/\b(?:[0-9A-F]{2}:){5}[0-9A-F]{2}\b/gi, '[REDACTED_MAC]');

  const collect = (source, file, regex, radius) => {
    const out = [];
    regex.lastIndex = 0;
    let m;
    while (out.length < MAX_RESULTS && (m = regex.exec(source))) {
      const start = Math.max(0, m.index - radius);
      const end = Math.min(source.length, m.index + m[0].length + radius);
      out.push({
        file,
        value: sanitize(m[0]),
        position: m.index,
        context: sanitize(source.slice(start, end))
      });
      if (!m[0].length) regex.lastIndex++;
    }
    return out;
  };

  const resolverMethods = [];
  const routeResolverUses = [];
  const namedRequestCalls = [];
  const loadingStateChecks = [];

  for (const [url, source] of sources) {
    const file = new URL(url).pathname.split('/').pop();

    resolverMethods.push(...collect(
      source, file,
      /resolve\([^)]*\)\s*\{[^{}]{0,1200}\}/gi,
      240
    ));

    routeResolverUses.push(...collect(
      source, file,
      /\{path:["'][^"']*["'][^{}]{0,400}resolve:\[[^\]]+\][^{}]{0,500}\}/gi,
      80
    ));

    namedRequestCalls.push(...collect(
      source, file,
      /(?:api\.)?request\([^,]{0,100},\s*["'][A-Za-z0-9_]+["'][^)]{0,220}\)/gi,
      160
    ));

    loadingStateChecks.push(...collect(
      source, file,
      /loadingStateCheck\(\[[^\]]{1,600}\]\)/gi,
      140
    ));
  }

  const dedupe = items => {
    const seen = new Set();
    return items.filter(x => {
      const key = [x.file, x.position, x.value].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, MAX_RESULTS);
  };

  const result = {
    meta: {
      mode: 'passive-route-resolver-action-source-inventory',
      generatedAt: new Date().toISOString(),
      jsFilesFetched: sources.size,
      discoveredJsUrls: queued.size,
      remainingQueue: queue.length,
      errorCount: errors.length
    },
    safety: {
      cgiRequestsSent: 0,
      navigationPerformed: false,
      discoveredScriptsExecuted: false,
      responseBodiesIncluded: false
    },
    resolverMethods: dedupe(resolverMethods),
    routeResolverUses: dedupe(routeResolverUses),
    namedRequestCalls: dedupe(namedRequestCalls),
    loadingStateChecks: dedupe(loadingStateChecks),
    errors
  };

  result.counts = {
    resolverMethods: result.resolverMethods.length,
    routeResolverUses: result.routeResolverUses.length,
    namedRequestCalls: result.namedRequestCalls.length,
    loadingStateChecks: result.loadingStateChecks.length
  };

  return JSON.stringify(result, null, 2);
})();
