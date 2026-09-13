// Facebook Page resolution + connection diagnosis.
// Pages are matched ONLY by the Graph API's own response for the authenticated
// Facebook user (the token's identity) — never by email, Base44 user, studio
// name, or Page name.
// Business-portfolio-owned Pages are often absent from /me/accounts even when
// the user has full access, so a stored Page ID is looked up directly as well.
// Never log or return an access token from here.

const GRAPH = 'https://graph.facebook.com/v25.0';
const REQUIRED_SCOPES = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];
const CREATE_TASKS = ['CREATE_CONTENT', 'MANAGE'];

async function graph(path, accessToken) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${GRAPH}/${path}${sep}access_token=${encodeURIComponent(accessToken)}`);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

// The Facebook user the token belongs to.
export async function getFacebookUser(accessToken) {
  const me = await graph('me?fields=id,name', accessToken);
  if (me.body?.error) throw new Error(`Facebook rejected the token: ${me.body.error.message}`);
  return { id: me.body.id, name: me.body.name };
}

// Pages the Graph API lists for this token, with their Page tokens.
export async function listPagesFromAccounts(accessToken) {
  const accounts = await graph('me/accounts?fields=id,name,access_token,tasks&limit=100', accessToken);
  if (accounts.body?.error) throw new Error(`Facebook could not list your Pages: ${accounts.body.error.message}`);
  return Array.isArray(accounts.body?.data) ? accounts.body.data : [];
}

// Direct lookup of one Page by ID — returns a Page access token when the
// authenticated user has access through a Business portfolio.
export async function lookupPageById(accessToken, pageId) {
  const page = await graph(`${encodeURIComponent(pageId)}?fields=id,name,access_token`, accessToken);
  if (page.body?.error) throw new Error(`Facebook could not return that Page: ${page.body.error.message}`);
  if (!page.body?.access_token) throw new Error('Facebook returned that Page without a Page access token, so publishing is not authorized for it.');
  return { id: page.body.id, name: page.body.name, access_token: page.body.access_token, tasks: [] };
}

// Stored connection for this app (most recent wins).
export async function getStoredPageConnection(base44) {
  const rows = await base44.asServiceRole.entities.FacebookPageConnection.list('-connected_at', 1);
  return rows?.[0] || null;
}

// Full diagnosis, safe to surface in the UI. Returns a precise reason code.
export async function diagnoseFacebook(accessToken, base44) {
  if (!accessToken) {
    return { ok: false, reason: 'not_connected', message: 'Facebook is not connected yet.' };
  }

  const perms = await graph('me/permissions', accessToken);
  if (perms.body?.error) {
    const code = perms.body.error.code;
    const expired = code === 190;
    return {
      ok: false,
      reason: expired ? 'expired_token' : 'permission_error',
      message: expired
        ? 'The Facebook login has expired. Reconnect Facebook to continue.'
        : `Facebook rejected the request: ${perms.body.error.message}`,
      graph_status: perms.status,
    };
  }

  const list = Array.isArray(perms.body?.data) ? perms.body.data : [];
  const granted = list.filter((p) => p.status === 'granted').map((p) => p.permission);
  const declined = list.filter((p) => p.status !== 'granted').map((p) => p.permission);
  const missing = REQUIRED_SCOPES.filter((s) => !granted.includes(s));
  if (missing.length) {
    return {
      ok: false,
      reason: 'missing_permission',
      message: `Facebook is missing permission: ${missing.join(', ')}. Reconnect Facebook and approve all requested items.`,
      granted,
      declined,
      graph_status: perms.status,
    };
  }

  // A stored Page connection is authoritative: verify it still returns a Page token.
  const stored = base44 ? await getStoredPageConnection(base44) : null;
  if (stored?.page_id) {
    try {
      const page = await lookupPageById(accessToken, stored.page_id);
      return {
        ok: true,
        reason: 'connected',
        message: `Ready to publish to ${page.name}.`,
        granted,
        page: { id: page.id, name: page.name },
        resolved_via: 'page_id_lookup',
      };
    } catch (e) {
      return {
        ok: false,
        reason: 'stored_page_unavailable',
        message: `The saved Page can no longer be used: ${e.message}`,
        granted,
      };
    }
  }

  const accounts = await graph('me/accounts?fields=id,name,tasks', accessToken);
  if (accounts.body?.error) {
    return {
      ok: false,
      reason: 'graph_error',
      message: `Facebook could not list your Pages: ${accounts.body.error.message}`,
      granted,
      graph_status: accounts.status,
    };
  }

  const pages = Array.isArray(accounts.body?.data) ? accounts.body.data : [];
  if (pages.length === 0) {
    return {
      ok: false,
      reason: 'no_page_returned',
      message: 'Facebook listed no Pages for the connected profile. If the Page is owned by a Business portfolio, save its Page ID below to connect it directly.',
      granted,
      graph_status: accounts.status,
      pages: [],
    };
  }

  const publishable = pages.find((p) => (p.tasks || []).some((t) => CREATE_TASKS.includes(t)));
  if (!publishable) {
    return {
      ok: false,
      reason: 'insufficient_page_access',
      message: `The connected profile can see ${pages.map((p) => p.name).join(', ')} but has no content-creation access. Give it full Page access, then reconnect.`,
      granted,
      graph_status: accounts.status,
      pages: pages.map((p) => ({ id: p.id, name: p.name, tasks: p.tasks || [] })),
    };
  }

  return {
    ok: true,
    reason: 'connected',
    message: `Ready to publish to ${publishable.name}.`,
    granted,
    graph_status: accounts.status,
    page: { id: publishable.id, name: publishable.name, tasks: publishable.tasks || [] },
    resolved_via: 'me_accounts',
  };
}

// Resolve the Page (id + a fresh Page access token) used for publishing.
// Prefers the stored Page connection, then the /me/accounts listing.
export async function resolveFacebookPage(accessToken, base44) {
  const stored = base44 ? await getStoredPageConnection(base44) : null;
  if (stored?.page_id) {
    const page = await lookupPageById(accessToken, stored.page_id);
    return { id: page.id, name: page.name, pageToken: page.access_token, tasks: stored.tasks || [] };
  }

  const pages = await listPagesFromAccounts(accessToken);
  const page = pages.find((p) => (p.tasks || []).some((t) => CREATE_TASKS.includes(t)) && p.access_token);
  if (!page) {
    const diag = await diagnoseFacebook(accessToken, base44);
    throw new Error(diag.message);
  }
  return { id: page.id, name: page.name, pageToken: page.access_token, tasks: page.tasks || [] };
}