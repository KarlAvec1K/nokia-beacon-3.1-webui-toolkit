// Nokia Beacon 3.1 - passive command_web_app.cgi source inventory
// Reads loaded JavaScript bundles only.
// Sends NO request to command_web_app.cgi and executes NO command.

await (async () => {
  const jsUrls = [...new Set([
    ...[...document.scripts].map(x => x.src),
    ...performance.getEntriesByType('resource').map(x => x.name)
  ].filter(x => x && /\.js(?:\?|$)/i.test(x)))];

  const hits = [];
  const literalArgs = [];

  const addUnique = (arr, item) => {
    const key = JSON.stringify(item);
    if (!arr.some(x => JSON.stringify(x) === key)) arr.push(item);
  };

  const needles = [
    'invokeShellExistCommand(',
    'invokeShellCatCommand(',
    'invokeShellCatCommandFWA(',
    'invoke_shell_exist_command',
    'invoke_shell_cat_command',
    'invoke_shell_cat_commandFWA'
  ];

  for (const url of jsUrls) {
    let txt;
    try {
      txt = await fetch(url, {
        credentials: 'include',
        cache: 'no-store'
      }).then(r => r.text());
    } catch (_) {
      continue;
    }

    const file = url.split('/').pop();

    for (const needle of needles) {
      let from = 0;
      while (true) {
        const pos = txt.indexOf(needle, from);
        if (pos < 0) break;

        addUnique(hits, {
          file,
          needle,
          position: pos,
          context: txt.slice(Math.max(0, pos - 900), Math.min(txt.length, pos + 1500))
        });

        from = pos + needle.length;
      }
    }

    // Literal frontend call sites only. This intentionally does not try to
    // evaluate variables or reconstruct dynamic arguments.
    const callPatterns = [
      { method: 'invokeShellExistCommand', re: /invokeShellExistCommand\(\s*["']([^"']+)["']\s*\)/g },
      { method: 'invokeShellCatCommand', re: /invokeShellCatCommand\(\s*["']([^"']+)["']\s*\)/g },
      { method: 'invokeShellCatCommandFWA', re: /invokeShellCatCommandFWA\(\s*["']([^"']+)["']\s*\)/g }
    ];

    for (const { method, re } of callPatterns) {
      let m;
      while ((m = re.exec(txt))) {
        addUnique(literalArgs, {
          file,
          method,
          argument: m[1],
          position: m.index,
          context: txt.slice(Math.max(0, m.index - 700), Math.min(txt.length, m.index + 1200))
        });
      }
    }
  }

  const report = {
    meta: {
      mode: 'passive-JS-source-only',
      generatedAt: new Date().toISOString(),
      jsFilesScanned: jsUrls.length,
      hitCount: hits.length,
      literalArgumentCount: literalArgs.length
    },
    knownFrontendDefinitions: {
      pexist: {
        pathPrefix: 'command_web_app.cgi?pexist+',
        methodClass: 'POST_CSRF'
      },
      cat: {
        pathPrefix: 'command_web_app.cgi?cat+',
        suffix: '.cmd',
        methodClass: 'POST_CSRF_TEXT'
      },
      catFWA: {
        pathPrefix: 'command_web_app.cgi?catFWA+',
        suffix: '.cmd',
        methodClass: 'POST_CSRF_TEXT'
      }
    },
    literalArgs,
    hits
  };

  console.log('Beacon 3.1 command CGI source inventory:', report);
  console.table(literalArgs.map(x => ({
    file: x.file,
    method: x.method,
    argument: x.argument
  })));

  return JSON.stringify(report, null, 2);
})();
