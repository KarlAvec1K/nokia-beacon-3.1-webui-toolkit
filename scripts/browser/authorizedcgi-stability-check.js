// Nokia Beacon 3.1 - read-only authorizedcgi stability check
// Performs three GETs to the known capabilities endpoint.
// Reports only counts and deterministic fingerprints, never the CGI list itself.

await (async () => {
  const fingerprint = values => {
    const canonical = [...new Set(values.map(String))].sort().join('\n');
    let hash = 0xcbf29ce484222325n;
    const prime = 0x100000001b3n;
    const mask = 0xffffffffffffffffn;

    for (let i = 0; i < canonical.length; i++) {
      const code = canonical.charCodeAt(i);
      hash ^= BigInt(code & 0xff);
      hash = (hash * prime) & mask;
      hash ^= BigInt((code >>> 8) & 0xff);
      hash = (hash * prime) & mask;
    }

    return hash.toString(16).padStart(16, '0');
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
        sortedSetFingerprint64: fingerprint(list),
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
    .map(x => x.sortedSetFingerprint64)
    .filter(Boolean);

  return JSON.stringify({
    meta: {
      mode: 'three-read-only-authorizedcgi-stability-snapshots',
      generatedAt: new Date().toISOString(),
      fingerprintAlgorithm: 'FNV-1a-like-64-over-sorted-unique-UTF16'
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
