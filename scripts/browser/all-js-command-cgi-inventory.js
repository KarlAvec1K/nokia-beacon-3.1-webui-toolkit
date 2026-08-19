// Nokia Beacon 3.1 - recursive passive command CGI source inventory
// Fetches same-origin HTML/JavaScript only.
// Sends NO request to command_web_app.cgi and executes NO discovered scripts.

await (async () => {
  const MAX_JS_FILES = 250;

  const seen = new Set();
  const queued = [];
  const texts = new Map();
  const errors = [];

  const sameOriginJs = raw => {
    try {
      const u = new URL(raw, location.href);
      if (u.origin !== location.origin) return null;
      if (!/\.js(?:$|\?)/i.test(u.href)) return null;
      return u.href;
    } catch (_) {
      return null;
    }
  };

  const enqueue = raw => {
    const u = sameOriginJs(raw);
    if (!u || seen.has(u) || queued.includes(u)) return;
    queued.push(u);
  };

  // Currently loaded resources.
  for (const s of document.scripts) if (s.src) enqueue(s.src);
  for (const r of performance.getEntriesByType('resource')) enqueue(r.name);

  // Parse the current document HTML for script references too.
  try {
    const html = await fetch(location.pathname || '/', {
      credentials: 'include',
      cache: 'no-store'
    }).then(r => r.text());

    for (const m of html.matchAll(/(?:src|href)=["']([^"']+\.js(?:\?[^"']*)?)["']/gi)) {
      enqueue(m[1]);
    }
  } catch (e) {
    errors.push({ stage: 'html', error: String(e) });
  }

  // Recursively fetch JS and discover lazy chunks referenced by source text.
  while (queued.length && seen.size < MAX_JS_FILES) {
    const url = queued.shift();
    if (seen.has(url)) continue;
    seen.add(url);

    let txt;
    try {
      const res = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) {
        errors.push({ file: url.split('/').pop(), status: res.status });
        continue;
      }
      txt = await res.text();
      texts.set(url, txt);
    } catch (e) {
      errors.push({ file: url.split('/').pop(), error: String(e) });
      continue;
    }

    // Broad same-origin JS reference discovery. This catches Angular lazy imports
    // such as import("./chunk-XXXX.js") as well as normal script-like references.
    const patterns = [
      /["'`]([^"'`\s]+\.js(?:\?[^"'`]*)?)["'`]/g,
      /import\(\s*["'`]([^"'`]+\.js(?:\?[^"'`]*)?)["'`]\s*\)/g
    ];

    for (const re of patterns) {
      let m;
      while ((m = re.exec(txt))) {
        try {
          const ref = new URL(m[1], url).href;
          enqueue(ref);
        } catch (_) {}
      }
    }
  }

  const methods = [
    'invokeShellExistCommand',
    'invokeShellCatCommand',
    'invokeShellCatCommandFWA'
  ];

  const calls = [];
  const literalArgs = [];
  const cmdStrings = [];

  const addUnique = (arr, item) => {
    const key = JSON.stringify(item);
    if (!arr.some(x => JSON.stringify(x) === key)) arr.push(item);
  };

  for (const [url, txt] of texts) {
    const file = url.split('/').pop();

    for (const method of methods) {
      // Capture method calls with a simple first-argument expression.
      const re = new RegExp(String.raw`(?:[A-Za-z_$][\\w$]*\\.)*${method}\\(\\s*([^\\n;]{0,240}?)\\s*\\)`, 'g');
      let m;
      while ((m = re.exec(txt))) {
        const pos = m.index;
        const argText = (m[1] || '').trim();
        const before = txt.slice(Math.max(0, pos - 80), pos);

        // Skip the wrapper method definition itself.
        const looksLikeDefinition = new RegExp(String.raw`${method}\\([^)]*\\)\\s*\\{\\s*return`).test(
          txt.slice(pos, Math.min(txt.length, pos + 180))
        );
        if (looksLikeDefinition) continue;

        const item = {
          file,
          method,
          argText,
          position: pos,
          context: txt.slice(Math.max(0, pos - 450), Math.min(txt.length, pos + 750))
        };
        addUnique(calls, item);

        const lm = argText.match(/^["'`]([^"'`]+)["'`]$/);
        if (lm) {
          addUnique(literalArgs, {
            file,
            method,
            argument: lm[1],
            position: pos
          });
        }
      }
    }

    // Also list command-looking string constants without treating them as executable.
    for (const m of txt.matchAll(/["'`]([^"'`\r\n]{1,120}\.cmd)["'`]/g)) {
      addUnique(cmdStrings, {
        file,
        value: m[1],
        position: m.index,
        context: txt.slice(Math.max(0, m.index - 240), Math.min(txt.length, m.index + 360))
      });
    }
  }

  const report = {
    meta: {
      mode: 'passive-recursive-same-origin-JS-source-only',
      generatedAt: new Date().toISOString(),
      maxJsFiles: MAX_JS_FILES,
      jsFilesFetched: texts.size,
      discoveredJsUrls: seen.size,
      remainingQueue: queued.length,
      callSiteCount: calls.length,
      literalArgumentCount: literalArgs.length,
      cmdStringCount: cmdStrings.length,
      errorCount: errors.length
    },
    safety: {
      commandCgiRequestsSent: 0,
      discoveredScriptsExecuted: false
    },
    literalArgs,
    calls,
    cmdStrings,
    errors
  };

  console.log('Beacon 3.1 recursive command CGI inventory:', report);
  console.table(literalArgs);
  console.table(calls.map(x => ({
    file: x.file,
    method: x.method,
    argText: x.argText.slice(0, 100)
  })));

  return JSON.stringify(report, null, 2);
})();
