// Nokia Beacon 3.1 - read-only authorizedcgi stability check
// Performs three GETs to the known capabilities endpoint.
// Reports only counts and SHA-256 fingerprints, never the CGI list itself.

await (async () => {
  const digest = async values => {
    const canonical = [...new Set(values.map(String))].sort().join('\n');
    const bytes = new TextEncoder().encode(canonical);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(hash)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  };

  const snapshots = [];

  for (let index = 0; index < 3; index++) {
    try {
      const response = await fetch('/capabilities_status_web_app.cgi', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });

      const text = await response.text();
      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch (_) {}

      const list = Array.isArray(parsed?.AdminUserData?.authorizedcgi)
        ? parsed.AdminUserData.authorizedcgi.map(String)
        : [];

      snapshots.push({
        index: index + 1,
        status: response.status,
        ok: response.ok,
        jsonValid: parsed !== null,
        rawCount: list.length,
        uniqueCount: new Set(list).size,
        sortedSetSha256: await digest(list),
        radioReceiverStatusListed: list.some(x =>
          x === 'radio_receiver_status_web_app.cgi' ||
          x.startsWith('radio_receiver_status_web_app.cgi?')
        )
      });
    } catch (e) {
      snapshots.push({
        index: index + 1,
        transportError: String(e)
      });
    }
  }

  const fingerprints = snapshots
    .map(x => x.sortedSetSha256)
    .filter(Boolean);

  return JSON.stringify({
    meta: {
      mode: 'three-read-only-authorizedcgi-stability-snapshots',
      generatedAt: new Date().toISOString()
    },
    safety: {
      requestsSent: 3,
      method: 'GET',
      endpoint: 'capabilities_status_web_app.cgi',
      authorizedCgiContentsIncluded: false,
      responseBodiesIncluded: false
    },
    stableWithinRun:
      fingerprints.length === 3 &&
      new Set(fingerprints).size === 1,
    snapshots
  }, null, 2);
})();
