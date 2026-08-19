// Nokia Beacon 3.1 - minimal read-only GenericService runtime probe
// Sends ONE POST to service_function_web_app.cgi using the exact frontend envelope.
// Function tested: GetWebDBFlag
// Does NOT print FunctionResult or response body contents.

await (async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return JSON.stringify({
      success: false,
      error: 'No localStorage.token found. Log in to the WebUI first.'
    }, null, 2);
  }

  const requestBody = {
    version: 1,
    csrf_token: token,
    id: 1,
    interface: 'Nokia.GenericService',
    service: 'OAM',
    function: 'GetWebDBFlag',
    paralist: []
  };

  let response;
  let text = '';

  try {
    response = await fetch('/service_function_web_app.cgi', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    text = await response.text();
  } catch (e) {
    return JSON.stringify({
      success: false,
      transportError: String(e)
    }, null, 2);
  }

  let parsed = null;
  let jsonValid = false;

  if (text) {
    try {
      parsed = JSON.parse(text);
      jsonValid = true;
    } catch (_) {}
  }

  const functionResult = parsed?.FunctionResult;

  const resultShape = functionResult == null
    ? null
    : Array.isArray(functionResult)
      ? {
          type: 'array',
          length: functionResult.length
        }
      : typeof functionResult === 'object'
        ? {
            type: 'object',
            keys: Object.keys(functionResult).sort()
          }
        : {
            type: typeof functionResult
          };

  const report = {
    meta: {
      mode: 'single-read-only-GenericService-POST',
      generatedAt: new Date().toISOString(),
      origin: location.origin,
      function: 'GetWebDBFlag'
    },

    request: {
      endpoint: '/service_function_web_app.cgi',
      method: 'POST',
      contentType: 'application/json',
      credentials: 'include',
      tokenPresent: true,
      function: 'GetWebDBFlag',
      paralistLength: 0
    },

    response: {
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      contentType: response.headers.get('content-type'),
      bodyLength: text.length,
      jsonValid,
      topLevelKeys: jsonValid && parsed && typeof parsed === 'object'
        ? Object.keys(parsed).sort()
        : [],
      genericServiceResult: jsonValid ? parsed?.result ?? null : null,
      genericServiceReasonPresent: Boolean(jsonValid && parsed && 'reason' in parsed),
      functionResultShape: resultShape
    },

    classification:
      response.status === 403
        ? 'http-role-denied'
        : response.status === 404
          ? 'http-not-found-or-method-handler-unavailable'
          : response.ok && jsonValid && parsed?.result === 0
            ? 'genericservice-call-success'
            : response.ok && jsonValid
              ? 'genericservice-replied-function-not-successful'
              : response.ok
                ? 'http-success-nonjson'
                : 'http-error'
  };

  console.log('Beacon 3.1 GenericService GetWebDBFlag probe:', report);
  return JSON.stringify(report, null, 2);
})();
