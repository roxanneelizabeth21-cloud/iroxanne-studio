import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { CANVA_API, getCanvaAccessToken } from '../../shared/canva.ts';

// Lists the owner's Canva designs so they can be imported into the media library.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const token = await getCanvaAccessToken(base44, secrets.get('CANVA_CLIENT_ID'), secrets.get('CANVA_CLIENT_SECRET'));
    const res = await fetch(`${CANVA_API}/designs?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.json();
    if (!res.ok) {
      return Response.json({ error: body?.message || `Canva returned ${res.status}` }, { status: 400 });
    }

    const designs = (body.items || []).map((d) => ({
      id: d.id,
      title: d.title || 'Untitled design',
      thumbnail: d.thumbnail?.url || '',
      updated_at: d.updated_at || null,
    }));
    return Response.json({ designs });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}