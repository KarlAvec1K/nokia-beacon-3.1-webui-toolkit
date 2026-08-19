// Nokia Beacon 3.1 - passive targeted RRM/optimization method extraction
// Downloads same-origin JavaScript source and extracts brace-balanced method
// bodies. It sends no CGI request and makes no configuration change.

await (async () => {
  const MAX_JS_FILES = 250;
  const targets = [
    'onRRMToggleClick',
    'setEnhancedRoaming',
    'syncMeshData',
    'optimizeNetwork',
    'checkAllowNetworkOptimize',
    'resetOptimize',
    'setRRM',
    'setNetworkOptimize'
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
    const patterns = [
      /(?:src|href)\s*=\s*["']([^"']+\.js(?:\?[^"']*)?)["']/gi,
      /["']([^"'\s]+\.js(?:\?[^"'\s]*)?)["']/gi
    ];
    for (const pattern of patterns) {
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
    let templateExpressionDepth = 0;

    for (let i = openBrace; i < source.length; i++) {
      const ch = source[i];

      if (quote) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === '\\') {
          escaped = true;
          continue;
        }
        if (quote === '`' && ch === '$' && source[i + 1] === '{') {
          templateExpressionDepth++;
          i++;
          continue;
        }
        if (quote === '`' && ch === '}' && templateExpressionDepth) {
          templateExpressionDepth--;
          continue;
        }
        if (ch === quote && templateExpressionDepth === 0) quote = null;
        continue;
      }

      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch;
        continue;
      }
      if (ch === '{') depth++;
      if (ch === '}' && --depth === 0) return source.slice(openBrace, i + 1);
    }
    return null;
  };

  const findMethods = (source, file) => {
    const results = [];
    for (const name of targets) {
      const patterns = [
        new RegExp('(?:^|[};])' + name + '\\s*\\(([^)]*)\\)\\s*\\{', 'g'),
        new RegExp(name + '\\s*=\\s*\\(([^)]*)\\)\\s*=>\\s*\\{', 'g')
      ];
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(source))) {
          const brace = source.indexOf('{', match.index + match[0].length - 1);
          const body = extractBalanced(source, brace);
          results.push({
            file,
            method: name,
            parameters: match[1],
            position: match.index,
            bodyExtracted: body !== null,
            body
          });
        }
      }
    }
    return results;
  };

  const queue = [];
  const known = new Set();
  const fetched = new Set();
  const methods = [];
  const actionContexts = [];
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
    for (const url of discover(html, location.href)) enqueue(url);
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

    for (const discovered of discover(source, url)) enqueue(discovered);
    methods.push(...findMethods(source, file));

    for (const needle of ['set_ntw_optimize', 'set_rrm']) {
      let position = -1;
      while ((position = source.indexOf(needle, position + 1)) >= 0) {
        actionContexts.push({
          file,
          action: needle,
          position,
          context: source.slice(Math.max(0, position - 300), position + 500)
        });
      }
    }
  }

  return JSON.stringify({
    meta: {
      mode: 'passive-targeted-rrm-optimization-method-extraction',
      generatedAt: new Date().toISOString(),
      jsFilesFetched: fetched.size,
      remainingQueue: queue.length,
      methodCount: methods.length,
      actionContextCount: actionContexts.length,
      errorCount: errors.length
    },
    safety: {
      sourceOnly: true,
      sameOriginOnly: true,
      discoveredScriptsExecuted: false,
      cgiRequestsSent: 0,
      rrmRequestsSent: 0,
      optimizeRequestsSent: 0,
      configurationChanges: 0
    },
    methods,
    actionContexts,
    errors
  }, null, 2);
})();
