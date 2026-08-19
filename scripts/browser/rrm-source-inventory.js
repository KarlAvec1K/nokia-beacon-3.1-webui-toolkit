// Nokia Beacon 3.1 - passive RRM/network-optimization source inventory
// Downloads same-origin JavaScript source only. It does not execute discovered
// scripts, call any CGI, or change router configuration.

await (async () => {
  const MAX_JS_FILES = 250;
  const MAX_HITS_PER_TERM = 80;
  const CONTEXT_RADIUS = 220;

  const terms = [
    'rrm_enable',
    'set_rrm',
    'get_rrm',
    'SupportRRM',
    'supportRRM',
    'rrmEnable',
    'RRM',
    'optimizeNetwork',
    'OptimizeNetwork',
    'networkOptimization',
    'mesh_status_web_app.cgi'
  ];

  const normalizeUrl = value => {
    try {
      const url = new URL(value, location.href);
      return url.origin === location.origin ? url.href : null;
    } catch (_) {
      return null;
    }
  };

  const jsUrlsFrom = (source, baseUrl) => {
    const found = new Set();
    const patterns = [
      /(?:src|href)\s*=\s*["']([^"']+\.js(?:\?[^"']*)?)["']/gi,
      /["']([^"'\s]+\.js(?:\?[^"'\s]*)?)["']/gi
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(source))) {
        const url = normalizeUrl(new URL(match[1], baseUrl).href);
        if (url) found.add(url);
      }
    }
    return [...found];
  };

  const queue = [];
  const queued = new Set();
  const fetched = new Set();
  const errors = [];
  const hits = [];

  const enqueue = url => {
    const normalized = normalizeUrl(url);
    if (normalized && !queued.has(normalized) && !fetched.has(normalized)) {
      queued.add(normalized);
      queue.push(normalized);
    }
  };

  for (const entry of performance.getEntriesByType('resource')) {
    if (/\.js(?:\?|$)/i.test(entry.name)) enqueue(entry.name);
  }

  try {
    const htmlResponse = await fetch(location.href, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    const html = await htmlResponse.text();
    for (const url of jsUrlsFrom(html, location.href)) enqueue(url);
  } catch (e) {
    errors.push({ file: '(document)', error: String(e) });
  }

  while (queue.length && fetched.size < MAX_JS_FILES) {
    const url = queue.shift();
    queued.delete(url);
    if (fetched.has(url)) continue;
    fetched.add(url);

    let source;
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      if (!response.ok) {
        errors.push({ file: new URL(url).pathname.split('/').pop(), status: response.status });
        continue;
      }
      source = await response.text();
    } catch (e) {
      errors.push({
        file: new URL(url).pathname.split('/').pop(),
        error: String(e)
      });
      continue;
    }

    for (const discovered of jsUrlsFrom(source, url)) enqueue(discovered);

    const file = new URL(url).pathname.split('/').pop() || '(unnamed)';
    for (const term of terms) {
      let start = 0;
      let count = 0;
      const lowerSource = source.toLowerCase();
      const needle = term.toLowerCase();
      while (count < MAX_HITS_PER_TERM) {
        const position = lowerSource.indexOf(needle, start);
        if (position < 0) break;
        const from = Math.max(0, position - CONTEXT_RADIUS);
        const to = Math.min(source.length, position + term.length + CONTEXT_RADIUS);
        hits.push({
          file,
          term,
          position,
          context: source.slice(from, to)
        });
        count++;
        start = position + term.length;
      }
    }
  }

  const classifications = {
    capabilityOrProductFlagHits: hits.filter(x =>
      /support|prodcfg|capabil|visibility/i.test(x.context)
    ).length,
    readPathHits: hits.filter(x =>
      /get|status|\.cgi/i.test(x.context) && !/post_csrf|set_rrm/i.test(x.context)
    ).length,
    potentialWritePathHits: hits.filter(x =>
      /set_rrm|post_csrf|put|patch/i.test(x.context)
    ).length,
    routeOrMenuHits: hits.filter(x =>
      /route|path|menu|navigation/i.test(x.context)
    ).length
  };

  return JSON.stringify({
    meta: {
      mode: 'passive-rrm-network-optimization-source-inventory',
      generatedAt: new Date().toISOString(),
      maxJsFiles: MAX_JS_FILES,
      jsFilesFetched: fetched.size,
      remainingQueue: queue.length,
      hitCount: hits.length,
      errorCount: errors.length
    },
    safety: {
      sourceOnly: true,
      sameOriginOnly: true,
      discoveredScriptsExecuted: false,
      cgiRequestsSent: 0,
      rrmRequestsSent: 0,
      configurationChanges: 0
    },
    classifications,
    terms,
    hits,
    errors
  }, null, 2);
})();
