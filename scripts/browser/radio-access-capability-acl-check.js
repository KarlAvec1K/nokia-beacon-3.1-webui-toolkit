// Nokia Beacon 3.1 - minimal read-only radio-access capability/ACL check
// Sends one GET to the already-known read-only capabilities endpoint.
// Does not print capability bodies, authorizedcgi contents, or any secrets.

await (async () => {
  let response;
  let text = '';

  try {
    response = await fetch('/capabilities_status_web_app.cgi', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store'
    });
    text = await response.text();
  } catch (e) {
    return JSON.stringify({
      success: false,
      transportError: String(e)
    }, null, 2);
  }

  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch (_) {}

  const admin = parsed?.AdminUserData ?? null;
  const authorized = Array.isArray(admin?.authorizedcgi)
    ? admin.authorizedcgi.map(String)
    : [];

  const capabilityRoot =
    admin?.device_capability ??
    admin?.DeviceCapability ??
    admin?.capability ??
    null;

  const radioAccess =
    capabilityRoot?.overview?.radioAccess ??
    admin?.overview?.radioAccess ??
    null;

  const scalarShape = value => {
    if (value == null) return null;
    if (typeof value !== 'object') return { type: typeof value };
    return {
      type: Array.isArray(value) ? 'array' : 'object',
      keys: Object.keys(value).sort()
    };
  };

  const exactOrPrefix = target => authorized.some(item =>
    item === target ||
    item.startsWith(target + '?') ||
    target.startsWith(item + '?')
  );

  return JSON.stringify({
    meta: {
      mode: 'single-read-only-radio-access-capability-acl-check',
      generatedAt: new Date().toISOString()
    },
    safety: {
      requestsSent: 1,
      method: 'GET',
      endpoint: 'capabilities_status_web_app.cgi',
      responseBodyIncluded: false,
      authorizedCgiListIncluded: false,
      capabilityValuesIncluded: false
    },
    response: {
      status: response.status,
      ok: response.ok,
      redirected: response.redirected,
      jsonValid: parsed !== null
    },
    capability: {
      radioAccessNodePresent: radioAccess != null,
      radioAccessNodeShape: scalarShape(radioAccess),
      visibilityNodePresent: radioAccess?.visibility != null,
      visibilityNodeShape: scalarShape(radioAccess?.visibility)
    },
    authorizationMetadata: {
      authorizedCgiCount: authorized.length,
      radioReceiverStatusListed: exactOrPrefix('radio_receiver_status_web_app.cgi'),
      fwaOverviewStatusListed: exactOrPrefix('overview_get_web_app.cgi')
    }
  }, null, 2);
})();
