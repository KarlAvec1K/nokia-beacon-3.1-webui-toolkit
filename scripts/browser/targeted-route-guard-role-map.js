// Nokia Beacon 3.1 - targeted passive route/guard/role source map
// Static same-origin JS fetch only. No discovered code is executed and no CGI is called.

await (async () => {
  const MAX_JS_FILES = 250;
  const MAX_RESULTS = 300;
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

  performance.getEntriesByType('resource')
    .map(x => x.name)
    .forEach(x => enqueue(x));

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
        errors.push({
          file: new URL(url).pathname.split('/').pop(),
          status: response.status
        });
        continue;
      }

      const source = await response.text();
      sources.set(url, source);

      for (const m of source.matchAll(/["'`]([^"'`\s]+\.m?js(?:[?#][^"'`\s]*)?)["'`]/gi)) {
        enqueue(m[1], url);
      }
    } catch (e) {
      errors.push({
        file: new URL(url).pathname.split('/').pop(),
        error: String(e)
      });
    }
  }

  const sanitize = value => value
    .replace(/csrf_token\s*[:=]\s*["'][^"']+["']/gi, 'csrf_token:[REDACTED]')
    .replace(/(token|password|passwd|psk|secret|sessionid)\s*[:=]\s*["'][^"']+["']/gi, '$1:[REDACTED]')
    .replace(/\b(?:[0-9A-F]{2}:){5}[0-9A-F]{2}\b/gi, '[REDACTED_MAC]');

  const collect = (source, file, regex, radius = 260) => {
    const out = [];
    regex.lastIndex = 0;
    let match;
    while (out.length < MAX_RESULTS && (match = regex.exec(source))) {
      const start = Math.max(0, match.index - radius);
      const end = Math.min(source.length, match.index + match[0].length + radius);
      out.push({
        file,
        value: sanitize(match[0]),
        position: match.index,
        context: sanitize(source.slice(start, end))
      });
      if (!match[0].length) regex.lastIndex++;
    }
    return out;
  };

  const routes = [];
  const guardDefinitions = [];
  const roleChecks = [];
  const capabilityCalls = [];
  const menuEntries = [];

  for (const [url, source] of sources) {
    const file = new URL(url).pathname.split('/').pop();

    routes.push(...collect(
      source,
      file,
      /\{path:["'][^"']*["'][^{}]{0,500}(?:component:|loadChildren:|loadComponent:|redirectTo:)[^{}]{0,500}\}/gi,
      80
    ));

    guardDefinitions.push(...collect(
      source,
      file,
      /canActivate(?:Child)?\([^)]*\)\s*\{[^{}]{0,500}\}/gi,
      120
    ));

    roleChecks.push(...collect(
      source,
      file,
      /(?:localStorage|sessionStorage)\.getItem\(["'](?:userMode|userModeNKBC|currentUser|emailUser)["']\)\s*={2,3}\s*["'](?:Admin|User|superadmin|no|yes)["']/gi,
      180
    ));

    capabilityCalls.push(...collect(
      source,
      file,
      /device_capability\.getVal\([^)]{1,240}\)/gi,
      100
    ));

    menuEntries.push(...collect(
      source,
      file,
      /\{name:[^{}]{0,220}routerLink:["'][^"']+["'][^{}]{0,260}(?:visibility|key):[^{}]{0,120}\}/gi,
      60
    ));
  }

  const dedupe = items => {
    const seen = new Set();
    return items.filter(item => {
      const key = [item.file, item.position, item.value].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, MAX_RESULTS);
  };

  const result = {
    meta: {
      mode: 'passive-targeted-route-guard-role-source-map',
      generatedAt: new Date().toISOString(),
      jsFilesFetched: sources.size,
      discoveredJsUrls: queued.size,
      remainingQueue: queue.length,
      errorCount: errors.length
    },
    safety: {
      cgiRequestsSent: 0,
      discoveredScriptsExecuted: false,
      responseBodiesIncluded: false
    },
    routes: dedupe(routes),
    guardDefinitions: dedupe(guardDefinitions),
    roleChecks: dedupe(roleChecks),
    capabilityCalls: dedupe(capabilityCalls),
    menuEntries: dedupe(menuEntries),
    errors
  };

  result.counts = {
    routes: result.routes.length,
    guardDefinitions: result.guardDefinitions.length,
    roleChecks: result.roleChecks.length,
    capabilityCalls: result.capabilityCalls.length,
    menuEntries: result.menuEntries.length
  };

  return JSON.stringify(result, null, 2);
})();
