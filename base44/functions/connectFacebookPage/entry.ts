import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getFacebookUser, listPagesFromAccounts, lookupPageById, getStoredPageConnection } from '../../shared/facebookPages.ts';

const CREATE_TASKS = ['CREATE_CONTENT', 'MANAGE'];

// Resolve the Facebook Page for the authenticated Facebook user (from the OAuth
// token itself — never by email, Base44 user, studio name or Page name) and
// store its Page ID + Page access token for the signed-in Base44 admin.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const requestedPageId = String(body?.page_id || '').trim();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');
    if (!accessToken) return Response.json({ ok: false, message: 'Facebook is not connected yet.' }, { status: 200 });

    const fbUser = await getFacebookUser(accessToken);

    // 1. The listing endpoint, using the same token.
    let page = null;
    let resolvedVia = 'me_accounts';
    const listed = await listPagesFromAccounts(accessToken);
    const match = requestedPageId
      ? listed.find((p) => String(p.id) === requestedPageId)
      : listed.find((p) => (p.tasks || []).some((t) => CREATE_TASKS.includes(t)));
    if (match?.access_token) {
      page = { id: match.id, name: match.name, access_token: match.access_token, tasks: match.tasks || [] };
    }

    // 2. Business-portfolio Pages are missing from that listing — look the ID up directly.
    if (!page) {
      const pageId = requestedPageId || (await getStoredPageConnection(base44))?.page_id;
      if (!pageId) {
        return Response.json({
          ok: false,
          reason: 'no_page_returned',
          message: 'Facebook listed no Pages for this account. Provide the Page ID from your Meta Business settings to connect it directly.',
          fb_user_id: fbUser.id,
        });
      }
      page = await lookupPageById(accessToken, pageId);
      resolvedVia = 'page_id_lookup';
    }

    const record = {
      page_id: String(page.id),
      page_name: page.name || '',
      page_token: page.access_token,
      fb_user_id: fbUser.id,
      tasks: page.tasks || [],
      resolved_via: resolvedVia,
      connected_at: new Date().toISOString(),
    };

    const existing = await base44.asServiceRole.entities.FacebookPageConnection.filter({ page_id: record.page_id });
    if (existing?.[0]) {
      await base44.asServiceRole.entities.FacebookPageConnection.update(existing[0].id, record);
    } else {
      await base44.asServiceRole.entities.FacebookPageConnection.create(record);
    }

    return Response.json({
      ok: true,
      message: `Connected ${page.name} for publishing.`,
      page: { id: record.page_id, name: record.page_name },
      fb_user_id: fbUser.id,
      resolved_via: resolvedVia,
    });
  } catch (error) {
    return Response.json({ ok: false, message: error.message }, { status: 200 });
  }
}