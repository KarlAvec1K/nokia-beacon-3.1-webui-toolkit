// Nokia Beacon 3.1 - passive deep resolver extraction
// Uses brace-balanced static source parsing. No navigation, script execution, or CGI calls.

await (async () => {
  const MAX_JS_FILES = 250;
  const MAX_METHODS = 200;
  const MAX_METHOD_LENGTH = 12000;
  const origin = location.origin;
  const queue = [];
  const queued = new Set();
  const sources = new Map();
  const errors = [];

  const enqueue = (raw, base = location.href) => {
    try {
      const u = new URL(raw, base);
      if (u.origin !== origin || !/\.m?js(?:[?#]|$)/i.test(u.href)) return;
      if (!queued.has(u.href) && queued.size < MAX_JS_FILES) {
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

  while (queue.length && sources.size < MAX_JS_FILES) {
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

  const matchingCloseParen = (s, open) => {
    let depth = 0, quote = '', escaped = false;
    for (let i = open; i < s.length; i++) {
      const c = s[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === quote) quote = '';
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '(') depth++;
      else if (c === ')' && --depth === 0) return i;
    }
    return -1;
  };

  const matchingCloseBrace = (s, open) => {
    let depth = 0, quote = '', escaped = false;
    for (let i = open; i < s.length && i - open <= MAX_METHOD_LENGTH; i++) {
      const c = s[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === quote) quote = '';
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '{') depth++;
      else if (c === '}' && --depth === 0) return i;
    }
    return -1;
  };

  const methods = [];
  for (const [url, source] of sources) {
    const file = new URL(url).pathname.split('/').pop();
    const re = /\bresolve\s*\(/g;
    let m;
    while (methods.length < MAX_METHODS && (m = re.exec(source))) {
      const parenOpen = source.indexOf('(', m.index);
      const parenClose = matchingCloseParen(source, parenOpen);
      if (parenClose < 0) continue;
      let braceOpen = parenClose + 1;
      while (/\s/.test(source[braceOpen] || '')) braceOpen++;
      if (source[braceOpen] !== '{') continue;
      const braceClose = matchingCloseBrace(source, braceOpen);
      if (braceClose < 0) continue;

      const method = source.slice(m.index, braceClose + 1);
      const nearbyStart = Math.max(0, m.index - 900);
      const nearbyEnd = Math.min(source.length, braceClose + 901);
      const actions = [...method.matchAll(/["']([A-Za-z][A-Za-z0-9_]{2,})["']/g)]
        .map(x => x[1])
        .filter(x => /^(?:get|set|add|del|delete|check|access|show|hide|load|refresh|invoke|publish)/i.test(x));

      methods.push({
        file,
        position: m.index,
        length: method.length,
        method: sanitize(method),
        actionLikeStrings: [...new Set(actions)].sort(),
        nearby: sanitize(source.slice(nearbyStart, nearbyEnd))
      });
      re.lastIndex = braceClose + 1;
    }
  }

  return JSON.stringify({
    meta: {
      mode: 'passive-brace-balanced-resolver-source-extraction',
      generatedAt: new Date().toISOString(),
      jsFilesFetched: sources.size,
      discoveredJsUrls: queued.size,
      resolverCandidateCount: methods.length,
      errorCount: errors.length
    },
    safety: {
      cgiRequestsSent: 0,
      navigationPerformed: false,
      discoveredScriptsExecuted: false,
      responseBodiesIncluded: false
    },
    methods,
    errors
  }, null, 2);
})();
