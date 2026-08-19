// Nokia Beacon 3.1 - passive service_function frontend source inventory
// Reads already-loaded JavaScript bundles only. Sends no CGI POST requests.

await (async () => {
  const jsUrls = [...new Set([
    ...[...document.scripts].map(s => s.src),
    ...performance.getEntriesByType('resource').map(r => r.name)
  ].filter(u => u && /\.js(?:\?|$)/i.test(u)))];

  const needles = [
    'service_function_web_app.cgi',
    'POST_CSRF_FWA',
    'setFWAPassword(',
    'callUBUS(',
    'getSMSList(',
    'deleteSMS(',
    'setSMSState(',
    'getCAInfo(',
    'getCellularNetworkIdentification(',
    'setModemLogMode(',
    'getLifeTimeDataCounter(',
    '.callUBUS(',
    '.setFWAPassword(',
    'this.body=',
    'body=' 
  ];

  const hits = [];

  for (const url of jsUrls) {
    let txt;
    try {
      txt = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      }).then(r => r.text());
    } catch (e) {
      hits.push({ file: url.split('/').pop(), error: String(e) });
      continue;
    }

    for (const needle of needles) {
      let pos = 0;
      let count = 0;

      while ((pos = txt.indexOf(needle, pos)) !== -1 && count < 20) {
        hits.push({
          file: url.split('/').pop(),
          needle,
          position: pos,
          context: txt.slice(
            Math.max(0, pos - 1800),
            Math.min(txt.length, pos + 3200)
          )
        });
        pos += needle.length;
        count++;
      }
    }
  }

  const unique = [...new Map(hits.map(h => [
    `${h.file}|${h.needle}|${h.position}`,
    h
  ])).values()];

  const report = {
    meta: {
      mode: 'passive-JS-source-only',
      generatedAt: new Date().toISOString(),
      jsFilesScanned: jsUrls.length,
      hitCount: unique.length
    },
    knownFromFrontend: {
      endpoint: 'service_function_web_app.cgi',
      methodClass: 'POST_CSRF_FWA',
      contentTypeObservedForMethodClass: 'application/json',
      note: 'No service_function request is sent by this script.'
    },
    hits: unique
  };

  console.log('Beacon 3.1 service_function source inventory:', report);
  return JSON.stringify(report, null, 2);
})();
