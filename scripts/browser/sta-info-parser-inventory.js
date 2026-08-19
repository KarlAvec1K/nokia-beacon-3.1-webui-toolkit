// Nokia Beacon 3.1 - passive STA-info frontend parser inventory
// Downloads same-origin JavaScript source only. It never calls sta_info2 or
// another CGI and therefore cannot expose client identifiers from its body.

await (async () => {
  const MAX_JS_FILES = 250;
  const RADIUS = 500;
  const terms = [
    'sta_info2_web_app.cgi',
    'sta_info_web_app.cgi',
    'sta_info2',
    'get_sta_info',
    'getStaInfo',
    'staInfo',
    'stationInfo',
    'connectedDevices',
    'homeNetworkClient'
  ];

  const normalize = (value, base = location.href) => {
    try {
      const url = new URL(value, base);
      return url.origin === location.origin ? url.href : null;
    } catch (_) {
      return null;
    }
  };

  const discover = (source, base) => {
    const urls = new Set();
    for (const pattern of [
      /(?:src|href)\s*=\s*["']([^"']+\.js(?:\?[^"']*)?)["']/gi,
      /["']([^"'\s]+\.js(?:\?[^"'\s]*)?)["']/gi
    ]) {
      let match;
      while ((match = pattern.exec(source))) {
        const url = normalize(match[1], base);
        if (url) urls.add(url);
      }
    }
    return [...urls];
  };

  const extractBalanced = (source, openBrace) => {
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let i = openBrace; i < source.length; i++) {
      const ch = source[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) return source.slice(openBrace, i + 1);
    }
    return null;
  };

  const queue = [];
  const known = new Set();
  const fetched = new Set();
  const hits = [];
  const parserCandidates = [];
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
    const response = await fetch(location.href, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    const html = await response.text();
    discover(html, location.href).forEach(enqueue);
  } catch (e) {
    errors.push({ file: '(document)', error: String(e) });
  }

  while (queue.length && fetched.size < MAX_JS_FILES) {
    const url = queue.shift();
    if (fetched.has(url)) continue;
    fetched.add(url);
    const file = new URL(url).pathname.split('/').pop() || '(unnamed)';

    let source;
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      if (!response.ok) {
        errors.push({ file, status: response.status });
        continue;
      }
      source = await response.text();
    } catch (e) {
      errors.push({ file, error: String(e) });
      continue;
    }

    discover(source, url).forEach(enqueue);

    for (const term of terms) {
      const lower = source.toLowerCase();
      const needle = term.toLowerCase();
      let position = -1;
      while ((position = lower.indexOf(needle, position + 1)) >= 0) {
        const context = source.slice(
          Math.max(0, position - RADIUS),
          Math.min(source.length, position + term.length + RADIUS)
        );
        hits.push({ file, term, position, context });

        // Extract nearby named method when the hit is inside a compact method.
        const before = source.slice(Math.max(0, position - 1200), position);
        const match = /([A-Za-z_$][\w$]*)\s*\([^{}]{0,160}\)\s*\{[^{}]*$/s.exec(before);
        if (match) {
          const methodStart = position - (before.length - match.index);
          const brace = source.indexOf('{', methodStart);
          const body = extractBalanced(source, brace);
          if (body && body.length <= 20000) {
            parserCandidates.push({
              file,
              method: match[1],
              position: methodStart,
              body
            });
          }
        }
      }
    }
  }

  const uniqueParsers = [...new Map(
    parserCandidates.map(x => [x.file + ':' + x.position, x])
  ).values()];

  return JSON.stringify({
    meta: {
      mode: 'passive-sta-info-frontend-parser-inventory',
      generatedAt: new Date().toISOString(),
      jsFilesFetched: fetched.size,
      remainingQueue: queue.length,
      hitCount: hits.length,
      parserCandidateCount: uniqueParsers.length,
      errorCount: errors.length
    },
    safety: {
      sourceOnly: true,
      sameOriginOnly: true,
      discoveredScriptsExecuted: false,
      cgiRequestsSent: 0,
      staInfoRequestsSent: 0,
      responseBodiesRead: 0,
      clientIdentifiersIncluded: false,
      configurationChanges: 0
    },
    hits,
    parserCandidates: uniqueParsers,
    errors
  }, null, 2);
})();
