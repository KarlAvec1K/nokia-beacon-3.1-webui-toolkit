// Nokia Beacon 3.1 - passive STA info 2 consumer/model inventory
// Reads same-origin JavaScript source only. It does not call STA CGI endpoints
// and does not inspect any runtime-cached STA values.

await (async () => {
  const MAX_JS_FILES = 250;
  const RADIUS = 900;
  const needles = [
    'getStaInfo2Data',
    'getStaInfo2(',
    'get_sta_info2',
    'GET_STA_INFO2',
    '.get_sta_info2',
    'new g_'
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

  const queue = [];
  const known = new Set();
  const fetched = new Set();
  const occurrences = [];
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
    discover(await response.text(), location.href).forEach(enqueue);
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

    for (const needle of needles) {
      let position = -1;
      while ((position = source.indexOf(needle, position + 1)) >= 0) {
        const before = source.slice(Math.max(0, position - 80), position);
        const after = source.slice(position + needle.length, position + needle.length + 30);
        const looksLikeDefinition =
          /(?:^|[};])\s*$/.test(before) &&
          /^\s*(?:\([^)]*\))?\s*\{/.test(after);

        occurrences.push({
          file,
          needle,
          position,
          classification: looksLikeDefinition ? 'probable-definition' : 'reference-or-call',
          context: source.slice(
            Math.max(0, position - RADIUS),
            Math.min(source.length, position + needle.length + RADIUS)
          )
        });
      }
    }
  }

  return JSON.stringify({
    meta: {
      mode: 'passive-sta-info2-consumer-model-inventory',
      generatedAt: new Date().toISOString(),
      jsFilesFetched: fetched.size,
      remainingQueue: queue.length,
      occurrenceCount: occurrences.length,
      errorCount: errors.length
    },
    safety: {
      sourceOnly: true,
      sameOriginOnly: true,
      discoveredScriptsExecuted: false,
      cgiRequestsSent: 0,
      staInfoRequestsSent: 0,
      runtimeCachedValuesRead: false,
      clientIdentifiersIncluded: false,
      configurationChanges: 0
    },
    counts: {
      probableDefinitions: occurrences.filter(x => x.classification === 'probable-definition').length,
      referencesOrCalls: occurrences.filter(x => x.classification === 'reference-or-call').length
    },
    occurrences,
    errors
  }, null, 2);
})();
