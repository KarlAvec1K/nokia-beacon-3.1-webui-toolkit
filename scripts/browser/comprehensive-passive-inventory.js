// Nokia Beacon 3.1 - comprehensive passive WebUI source inventory
// ONE paste, ONE report. Downloads same-origin HTML/JavaScript source only.
// It does not execute discovered scripts, call CGI endpoints, read router
// response bodies, inspect storage, or change configuration.

await (async () => {
  const LIMITS = {
    maxJsFiles: 250,
    maxHitsPerCategory: 60,
    contextRadius: 260,
    maxMethodLength: 24000,
    maxEndpointMappings: 500,
    maxRouteStrings: 300
  };

  const categories = {
    rolesAndGuards: [
      'superadmin', 'is_ctc_admin', 'userMode', 'isAdmin',
      'canActivate', 'adminGuard', 'authGuard', 'authorizedcgi'
    ],
    genericService: [
      'service_function_web_app.cgi', 'Nokia.GenericService',
      'GetWebDBFlag', 'callUBUS', 'GetAPN'
    ],
    commandCgi: [
      'command_web_app.cgi', 'invokeShellExistCommand',
      'invokeShellCatCommand', 'invokeShellCatCommandFWA', '.cmd'
    ],
    radioAccess: [
      'get_radio_access_status', 'radio_receiver_status_web_app.cgi',
      'getRadioAccessStatus', 'radioAccess', 'receiverButton'
    ],
    containerManagement: [
      'container_management_status_web_app.cgi', 'get_container_info',
      'SupportContainerManagement', 'supportContainerManagmnt',
      'showContainerPage', 'showcontainermenuLink', 'isFsecureAppActive'
    ],
    rrmAndOptimization: [
      'rrm_enable', 'set_rrm', 'SupportRRM', 'supportRRM',
      'set_ntw_optimize', 'OptimizeNetwork', 'optimizeNetwork'
    ],
    staInformation: [
      'sta_info_web_app.cgi', 'sta_info2_web_app.cgi', 'get_sta_info',
      'get_sta_info2', 'getStaInfo2Data', 'WLAN_CLIENT', 'supportSTAinfo'
    ],
    meshAndTopology: [
      'mesh_status_web_app.cgi', 'get_mesh_info', 'beacon_detail',
      'root_info', 'wifipoint_list', 'getNetworkTplStatus'
    ],
    hiddenReadModels: [
      'whw_beacon_mode_app_status_web_app.cgi',
      'lan_ipv4_status_web_app.cgi', 'lan_ipv6_status_web_app.cgi',
      'capabilities_status_web_app.cgi', 'main_web_app.cgi'
    ],
    frontendRoutes: [
      'container-management', 'wifiStatistics', 'advancedSettings',
      'networkMap', 'maintenance', 'overview', 'path:', 'loadChildren'
    ]
  };

  const targetMethods = [
    'onRRMToggleClick', 'setEnhancedRoaming', 'syncMeshData',
    'optimizeNetwork', 'checkAllowNetworkOptimize', 'setRRM',
    'setNetworkOptimize', 'getStaInfo', 'getStaInfo2',
    'getStaInfo2Data', 'getStaDetails', 'loadRouterInfo',
    'sideMenuCapabilityCheck', 'showcontainermenuLink',
    'isFsecureAppActive', 'getUbusRequest',
    'getRadioAccessStatus', 'getRadioAccessStatusFWAGW'
  ];

  const normalize = (value, base = location.href) => {
    try {
      const url = new URL(value, base);
      return url.origin === location.origin ? url.href : null;
    } catch (_) {
      return null;
    }
  };

  const fileName = url => {
    try {
      return new URL(url).pathname.split('/').pop() || '(unnamed)';
    } catch (_) {
      return '(invalid)';
    }
  };

  const discoverJs = (source, base) => {
    const found = new Set();
    for (const pattern of [
      /(?:src|href)\s*=\s*["']([^"']+\.js(?:\?[^"']*)?)["']/gi,
      /["']([^"'\s]+\.js(?:\?[^"'\s]*)?)["']/gi
    ]) {
      let match;
      while ((match = pattern.exec(source))) {
        const url = normalize(match[1], base);
        if (url) found.add(url);
      }
    }
    return [...found];
  };

  const extractBalanced = (source, openBrace) => {
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let i = openBrace; i < source.length; i++) {
      const ch = source[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) {
        return source.slice(openBrace, i + 1);
      }
    }
    return null;
  };

  const fnv64 = text => {
    let hash = 0xcbf29ce484222325n;
    for (let i = 0; i < text.length; i++) {
      hash ^= BigInt(text.charCodeAt(i));
      hash = BigInt.asUintN(64, hash * 0x100000001b3n);
    }
    return hash.toString(16).padStart(16, '0');
  };

  const queue = [];
  const known = new Set();
  const fetched = new Set();
  const sources = [];
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
    // Fetch the WebUI entry document, never a CGI.
    const entryUrl = new URL(location.pathname, location.origin).href;
    const response = await fetch(entryUrl, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    const html = await response.text();
    discoverJs(html, entryUrl).forEach(enqueue);
  } catch (e) {
    errors.push({ file: '(entry-document)', error: String(e) });
  }

  while (queue.length && fetched.size < LIMITS.maxJsFiles) {
    const url = queue.shift();
    if (fetched.has(url)) continue;
    fetched.add(url);

    let source;
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      });
      if (!response.ok) {
        errors.push({ file: fileName(url), status: response.status });
        continue;
      }
      source = await response.text();
    } catch (e) {
      errors.push({ file: fileName(url), error: String(e) });
      continue;
    }

    sources.push({ file: fileName(url), url, source });
    discoverJs(source, url).forEach(enqueue);
  }

  const categoryReport = {};
  for (const [category, terms] of Object.entries(categories)) {
    const hits = [];
    let totalHits = 0;
    const termCounts = {};

    for (const item of sources) {
      const lower = item.source.toLowerCase();
      for (const term of terms) {
        const needle = term.toLowerCase();
        let position = -1;
        while ((position = lower.indexOf(needle, position + 1)) >= 0) {
          totalHits++;
          termCounts[term] = (termCounts[term] || 0) + 1;
          if (hits.length < LIMITS.maxHitsPerCategory) {
            hits.push({
              file: item.file,
              term,
              position,
              context: item.source.slice(
                Math.max(0, position - LIMITS.contextRadius),
                Math.min(
                  item.source.length,
                  position + term.length + LIMITS.contextRadius
                )
              )
            });
          }
        }
      }
    }

    categoryReport[category] = {
      totalHits,
      returnedHits: hits.length,
      truncated: totalHits > hits.length,
      termCounts,
      hits
    };
  }

  const methods = [];
  for (const item of sources) {
    for (const name of targetMethods) {
      const patterns = [
        new RegExp('(?:^|[};])' + name + '\\s*\\(([^)]*)\\)\\s*\\{', 'g'),
        new RegExp(name + '\\s*=\\s*\\(([^)]*)\\)\\s*=>\\s*\\{', 'g')
      ];
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(item.source))) {
          const brace = item.source.indexOf(
            '{',
            match.index + match[0].length - 1
          );
          const body = extractBalanced(item.source, brace);
          methods.push({
            file: item.file,
            method: name,
            parameters: match[1],
            position: match.index,
            bodyExtracted: Boolean(body),
            body:
              body && body.length <= LIMITS.maxMethodLength
                ? body
                : null,
            bodyLength: body?.length || 0
          });
        }
      }
    }
  }

  // Static action-to-CGI mappings only. These are literals from JS source,
  // not requests. Query values are code constants, never runtime values.
  const endpointMappings = [];
  const mappingPattern =
    /([A-Za-z_$][\w$]*)\s*:\s*["']([^"'\r\n]*_web_app\.cgi[^"'\r\n]*)["']/g;
  for (const item of sources) {
    let match;
    while (
      endpointMappings.length < LIMITS.maxEndpointMappings &&
      (match = mappingPattern.exec(item.source))
    ) {
      endpointMappings.push({
        file: item.file,
        action: match[1],
        endpointTemplate: match[2]
      });
    }
  }

  const routeStrings = [];
  const routePattern =
    /(?:path|redirectTo)\s*:\s*["']([^"'\r\n]{1,160})["']/g;
  for (const item of sources) {
    let match;
    while (
      routeStrings.length < LIMITS.maxRouteStrings &&
      (match = routePattern.exec(item.source))
    ) {
      routeStrings.push({
        file: item.file,
        kind: item.source.slice(match.index, match.index + 10)
          .startsWith('redirectTo') ? 'redirect' : 'path',
        value: match[1]
      });
    }
  }

  const uniqueMappings = [...new Map(
    endpointMappings.map(x => [x.action + '\n' + x.endpointTemplate, x])
  ).values()];
  const uniqueRoutes = [...new Map(
    routeStrings.map(x => [x.kind + '\n' + x.value, x])
  ).values()];

  const sourceManifest = sources.map(x => ({
    file: x.file,
    bytes: x.source.length,
    fingerprint64: fnv64(x.source)
  }));

  return JSON.stringify({
    meta: {
      mode: 'comprehensive-passive-webui-source-inventory',
      generatedAt: new Date().toISOString(),
      maxJsFiles: LIMITS.maxJsFiles,
      jsFilesFetched: sources.length,
      discoveredJsUrls: known.size,
      remainingQueue: queue.length,
      sourceBytes: sources.reduce((sum, x) => sum + x.source.length, 0),
      categoryCount: Object.keys(categories).length,
      methodCount: methods.length,
      endpointMappingCount: uniqueMappings.length,
      routeStringCount: uniqueRoutes.length,
      errorCount: errors.length
    },
    safety: {
      sourceOnly: true,
      sameOriginOnly: true,
      discoveredScriptsExecuted: false,
      storageRead: false,
      runtimeApiCacheRead: false,
      cgiRequestsSent: 0,
      responseBodiesRead: 0,
      routerValuesIncluded: false,
      clientIdentifiersIncluded: false,
      credentialsIncluded: false,
      configurationChanges: 0
    },
    limits: LIMITS,
    sourceManifest,
    categories: categoryReport,
    methods,
    endpointMappings: uniqueMappings,
    routeStrings: uniqueRoutes,
    errors
  }, null, 2);
})();
