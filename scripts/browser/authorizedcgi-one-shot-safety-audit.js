// Nokia Beacon 3.1 - one-shot authorized CGI safety audit
// Classifies every authorized CGI entry, but probes only a strict read-only
// allowlist. Potential mutators are never requested, even when listed as
// authorized. Response bodies are never read.

await (async () => {
  const CAPABILITIES_ENDPOINT = '/capabilities_status_web_app.cgi';
  const REQUEST_TIMEOUT_MS = 5000;
  const MAX_SAFE_GETS = 150;

  const dangerous = /(?:^|[?&=_-])(set|add|del|delete|remove|start|stop|save|config|enable|disable|switch|reset|restore|upgrade|reboot|cancel|trigger|upload|download|export|import|post|password|passwd|pwd|ssid|factory|deep|web_app)$/i;
  const dangerousText = /(?:mesh_web_app|wlan_config_web_app|lan_status_web_app\?del|restore_web_app|reboot|factory|firmware|password|set_|add_|del_|delete|start_|stop_|save_|config_|enable_|disable_|switch_|trigger_)/i;
  const safeQueryKeys = new Set([
    'status', 'info', 'get', 'getroot', 'getworkmode', 'ipv4', 'ipv6',
    'wlan', 'diagnostic_status', 'current_speed', 'act=status', 'v=status'
  ]);

  const redact = value => {
    try {
      const url = new URL(value, location.origin);
      const queryKeys = [...url.searchParams.keys()];
      const query = queryKeys.length
        ? '?' + queryKeys.map(key => encodeURIComponent(key) + '=REDACTED').join('&')
        : '';
      return url.pathname + query;
    } catch (_) {
      return String(value).replace(/([?&][^=]+=)[^&]*/g, '$1REDACTED');
    }
  };

  const classify = raw => {
    let url;
    try {
      url = new URL(raw, location.origin);
    } catch (_) {
      return { classification: 'invalid', reason: 'invalid-url' };
    }

    if (url.origin !== location.origin) {
      return { classification: 'skipped', reason: 'cross-origin' };
    }

    const pathname = url.pathname;
    const basename = pathname.split('/').pop() || '';
    const lowerPath = pathname.toLowerCase();
    const lowerFull = (pathname + url.search).toLowerCase();

    if (dangerousText.test(lowerFull) || dangerous.test(basename)) {
      return { classification: 'skipped', reason: 'mutator-pattern' };
    }

    for (const key of url.searchParams.keys()) {
      const lowerKey = key.toLowerCase();
      if (!safeQueryKeys.has(lowerKey) && !lowerKey.startsWith('v=')) {
        return { classification: 'skipped', reason: 'unknown-query' };
      }
    }

    const strictReadPath =
      lowerPath === '/capabilities_status_web_app.cgi' ||
      lowerPath === '/main_web_app.cgi' ||
      /(?:^|_)(?:status|info)_web_app\.cgi$/.test(lowerPath) ||
      /dashboard_[^/]*status[^/]*\.cgi$/.test(lowerPath) ||
      /device_[^/]*status[^/]*\.cgi$/.test(lowerPath) ||
      /(?:^|_)(?:status|info)\.cgi$/.test(lowerPath);

    if (!strictReadPath) {
      return { classification: 'skipped', reason: 'not-strict-read-path' };
    }

    return {
      classification: 'safe-read-candidate',
      reason: 'strict-status-or-info-path'
    };
  };

  const snapshots = [];
  const errors = [];
  let authorized = [];

  try {
    const response = await fetch(CAPABILITIES_ENDPOINT, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'manual'
    });
    const text = await response.text();
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch (_) {}
    authorized = Array.isArray(parsed?.AdminUserData?.authorizedcgi)
      ? [...new Set(parsed.AdminUserData.authorizedcgi.map(String))]
      : [];
  } catch (e) {
    return JSON.stringify({
      meta: {
        mode: 'one-shot-authorizedcgi-safety-audit',
        generatedAt: new Date().toISOString(),
        aborted: true
      },
      safety: {
        capabilitiesRequestSent: 1,
        cgiRequestsSent: 0,
        responseBodiesRead: 1,
        authorizedEntriesLoaded: false,
        configurationChanges: 0
      },
      error: String(e)
    }, null, 2);
  }

  const candidates = authorized.map(raw => {
    const result = classify(raw);
    return {
      rawRedacted: redact(raw),
      ...result
    };
  });

  const safe = candidates
    .filter(x => x.classification === 'safe-read-candidate')
    .slice(0, MAX_SAFE_GETS);

  for (const item of safe) {
    const started = performance.now();
    let url;
    try {
      url = new URL(item.rawRedacted.replace(/=REDACTED/g, ''), location.origin);
      // The redacted representation is for reporting only. Reconstruct the
      // original entry from the same index to avoid ever sending placeholders.
      const original = authorized.find(x => redact(x) === item.rawRedacted);
      url = new URL(original, location.origin);
    } catch (e) {
      snapshots.push({
        endpoint: item.rawRedacted,
        status: 'not-sent',
        reason: 'url-reconstruction-failed'
      });
      continue;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.href, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        redirect: 'manual',
        signal: controller.signal
      });
      try { await response.body?.cancel(); } catch (_) {}
      snapshots.push({
        endpoint: item.rawRedacted,
        status: response.status,
        ok: response.ok,
        redirected: response.redirected,
        elapsedMs: Math.round(performance.now() - started)
      });
    } catch (e) {
      snapshots.push({
        endpoint: item.rawRedacted,
        status: 'transport-error',
        error: String(e),
        elapsedMs: Math.round(performance.now() - started)
      });
    } finally {
      clearTimeout(timer);
    }
  }

  const counts = {};
  for (const item of candidates) {
    counts[item.classification] = (counts[item.classification] || 0) + 1;
  }

  return JSON.stringify({
    meta: {
      mode: 'one-shot-authorizedcgi-safety-audit',
      generatedAt: new Date().toISOString(),
      authorizedRawCount: authorized.length,
      authorizedUniqueCount: new Set(authorized).size,
      candidatesClassified: candidates.length,
      safeGetsAttempted: snapshots.length,
      maxSafeGets: MAX_SAFE_GETS
    },
    safety: {
      capabilitiesRequestSent: 1,
      cgiRequestsSent: snapshots.length,
      safeReadGETsOnly: true,
      mutatorCandidatesRequested: 0,
      skippedCandidatesRequested: 0,
      responseBodiesRead: 0,
      responseBodiesCancelled: true,
      crossOriginRequestsSent: 0,
      configurationChanges: 0
    },
    classificationCounts: counts,
    candidates,
    snapshots,
    errors
  }, null, 2);
})();
