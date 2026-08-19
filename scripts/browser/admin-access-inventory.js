// Nokia Beacon 3.1 - read-only admin access inventory
// Run from DevTools while logged in to the local WebUI.
// No POST/PUT/DELETE requests are made.

await (async () => {
  const caps = await fetch('/capabilities_status_web_app.cgi', {
    credentials: 'include',
    cache: 'no-store'
  }).then(r => r.json());

  const admin = caps?.AdminUserData ?? caps ?? {};
  const product = caps?.ProdCfgData?.ProductParameters ?? {};
  const authorized = Array.isArray(admin?.authorizedcgi)
    ? [...new Set(admin.authorizedcgi.map(String))]
    : [];

  const norm = s => String(s || '')
    .replace(/^https?:\/\/[^/]+\//i, '')
    .replace(/^\//, '')
    .trim();

  const base = s => norm(s).split('?')[0];
  const authorizedExact = new Set(authorized.map(norm));
  const authorizedBase = new Set(authorized.map(base));

  // Collect JS resources already referenced by this WebUI session.
  const jsUrls = [...new Set([
    ...[...document.scripts].map(x => x.src),
    ...performance.getEntriesByType('resource').map(x => x.name)
  ].filter(x => x && /\.js(?:\?|$)/i.test(x)))];

  const discovered = new Set();
  const sourceHits = [];
  const cgiRe = /[A-Za-z0-9_./-]+(?:status_)?web_app\.cgi(?:\?[^"'`\\\s<>{}]*)?/g;

  for (const url of jsUrls) {
    try {
      const txt = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      }).then(r => r.text());

      const matches = txt.match(cgiRe) || [];
      for (const raw of matches) {
        const endpoint = norm(raw)
          .replace(/[),;]+$/, '')
          .replace(/\\u0026/g, '&');
        if (!endpoint.includes('.cgi')) continue;
        discovered.add(endpoint);
      }

      for (const needle of [
        'service_function_web_app.cgi',
        'authorizedcgi',
        'command_web_app.cgi',
        'delta_cfg_web_app.cgi',
        'tr069',
        'tr369',
        'deep_factory',
        'port_mirror',
        'rrm_enable',
        'bandSteering',
        'ofdma'
      ]) {
        if (txt.includes(needle)) {
          sourceHits.push({ file: url.split('/').pop(), needle });
        }
      }
    } catch (e) {
      sourceHits.push({
        file: url.split('/').pop(),
        error: String(e)
      });
    }
  }

  const discoveredList = [...discovered].sort();

  const endpointInventory = discoveredList.map(endpoint => ({
    endpoint,
    exactAuthorized: authorizedExact.has(norm(endpoint)),
    baseAuthorized: authorizedBase.has(base(endpoint)),
    authorizationClass:
      authorizedExact.has(norm(endpoint)) ? 'exact-authorized' :
      authorizedBase.has(base(endpoint)) ? 'base-cgi-authorized' :
      'not-listed-for-current-admin'
  }));

  const frontendNotAuthorized = endpointInventory
    .filter(x => x.authorizationClass === 'not-listed-for-current-admin');

  const authorizedNotSeenInLoadedJs = authorized
    .filter(x => !discoveredList.some(d => norm(d) === norm(x) || base(d) === base(x)))
    .sort();

  // Flatten only capability leaves. Do NOT output credentials or session values.
  const leaves = [];
  const walk = (obj, path = []) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'authorizedcgi') continue;
      const p = [...path, k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        walk(v, p);
      } else if (['number', 'string', 'boolean'].includes(typeof v)) {
        leaves.push({ path: p.join('.'), value: v });
      }
    }
  };
  walk(admin);

  const hidden = leaves.filter(x => String(x.value) === '-1');
  const disabled = leaves.filter(x => String(x.value) === '0');
  const enabled = leaves.filter(x => String(x.value) === '1');

  const webConfig = product?.webConfig ?? {};
  const radios = Array.isArray(product?.Wifi) ? product.Wifi : [];

  const interestingProductSupport = Object.fromEntries(
    Object.entries(webConfig).filter(([k]) => /Support|WifiVersion|DeviceType|UplinkType/i.test(k))
  );

  const highValueHidden = hidden.filter(x =>
    /wifi|wan|lan|dns|tr069|tr369|route|bridge|firewall|diagnostic|statistics|schedule|rrm|steer|ofdma|mesh|portMirror|deepFactory|container/i.test(x.path)
  );

  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      mode: 'read-only',
      currentOrigin: location.origin,
      authorizedCgiCount: authorized.length,
      discoveredFrontendCgiCount: discoveredList.length,
      frontendNotAuthorizedCount: frontendNotAuthorized.length,
      hiddenCapabilityCount: hidden.length,
      disabledCapabilityCount: disabled.length
    },

    product: {
      webConfig: interestingProductSupport,
      radios: radios.map(r => ({
        OperatingFrequencyBand: r?.OperatingFrequencyBand,
        ChipsetVendor: r?.ChipsetVendor,
        SupportedOperatingChannelBandwidths: r?.SupportedOperatingChannelBandwidths
      }))
    },

    authorizedcgi: authorized.sort(),

    highValueHiddenCapabilities: highValueHidden,

    frontendEndpointsNotListedForCurrentAdmin: frontendNotAuthorized,

    authorizedEndpointsNotSeenInLoadedJs: authorizedNotSeenInLoadedJs,

    serviceFunction: {
      authorizedExact: authorizedExact.has('service_function_web_app.cgi'),
      authorizedBase: authorizedBase.has('service_function_web_app.cgi'),
      referencedByFrontend: discoveredList.some(x => base(x) === 'service_function_web_app.cgi')
    },

    commandCgi: {
      authorizedEntries: authorized.filter(x => base(x) === 'command_web_app.cgi'),
      referencedByFrontend: discoveredList.some(x => base(x) === 'command_web_app.cgi')
    },

    sourceHits: [...new Map(sourceHits.map(x => [JSON.stringify(x), x])).values()]
  };

  console.log('Beacon 3.1 admin-access inventory:', report);
  console.table(frontendNotAuthorized);
  console.table(highValueHidden);

  return JSON.stringify(report, null, 2);
})();
