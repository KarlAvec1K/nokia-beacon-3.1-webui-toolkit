// Nokia Beacon 3.1 - passive GenericService/service_function inventory
// Reads loaded JavaScript bundles only. Sends NO request to service_function_web_app.cgi.

await (async () => {
  const jsUrls = [...new Set([
    ...[...document.scripts].map(x => x.src),
    ...performance.getEntriesByType('resource').map(x => x.name)
  ].filter(x => x && /\.js(?:\?|$)/i.test(x)))];

  const literals = [];
  const serviceCalls = [];

  const add = (arr, item) => {
    const key = JSON.stringify(item);
    if (!arr.some(x => JSON.stringify(x) === key)) arr.push(item);
  };

  for (const url of jsUrls) {
    let txt;
    try {
      txt = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      }).then(r => r.text());
    } catch (e) {
      continue;
    }

    const file = url.split('/').pop();

    // Literal createBody("FunctionName"[, ...]) calls.
    const re = /createBody\(\s*["']([^"']+)["']([^)]*)\)/g;
    let m;
    while ((m = re.exec(txt))) {
      const pos = m.index;
      add(literals, {
        file,
        functionName: m[1],
        hasExtraArgText: Boolean((m[2] || '').trim().replace(/^\s*,\s*/, '')),
        callText: m[0].slice(0, 300),
        context: txt.slice(Math.max(0, pos - 500), Math.min(txt.length, pos + 900))
      });
    }

    // Capture direct API methods routed through POST_CSRF_FWA/service_function.
    for (const needle of [
      'setFWAPassword(',
      'callUBUS(',
      'getSMSList(',
      'deleteSMS(',
      'setSMSState(',
      'getCAInfo(',
      'getCellularNetworkIdentification(',
      'getModemLogMode(',
      'setModemLogMode(',
      'getLifeTimeDataCounter('
    ]) {
      let from = 0;
      while (true) {
        const pos = txt.indexOf(needle, from);
        if (pos < 0) break;
        add(serviceCalls, {
          file,
          needle,
          position: pos,
          context: txt.slice(Math.max(0, pos - 700), Math.min(txt.length, pos + 1200))
        });
        from = pos + needle.length;
      }
    }
  }

  const functionNames = [...new Set(literals.map(x => x.functionName))].sort();

  const report = {
    meta: {
      mode: 'passive-JS-source-only',
      generatedAt: new Date().toISOString(),
      jsFilesScanned: jsUrls.length,
      literalCreateBodyCallCount: literals.length,
      uniqueFunctionNameCount: functionNames.length
    },
    genericServiceEnvelope: {
      version: 1,
      csrf_token: '<from localStorage.token>',
      id: 1,
      interface: 'Nokia.GenericService',
      service: 'OAM',
      function: '<set by createBody()>',
      paralist: '<[] or JSON.parse(second createBody argument)>'
    },
    functionNames,
    literals,
    serviceCalls
  };

  console.log('Beacon 3.1 GenericService function inventory:', report);
  console.table(literals.map(x => ({
    file: x.file,
    functionName: x.functionName,
    hasExtraArgText: x.hasExtraArgText
  })));

  return JSON.stringify(report, null, 2);
})();
