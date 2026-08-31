import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { CANVA_API, getCanvaAccessToken } from '../../shared/canva.ts';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Exports one Canva design as a PNG, stores the file, and files it in the
// media library as a GalleryImage so every post can reuse it.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { design_id: designId, title, replace_image_id: replaceImageId, format } = await req.json();
    if (!designId) return Response.json({ error: 'A design is required' }, { status: 400 });
    const isVideo = format === 'mp4';

    const token = await getCanvaAccessToken(base44, secrets.get('CANVA_CLIENT_ID'), secrets.get('CANVA_CLIENT_SECRET'));
    const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const startRes = await fetch(`${CANVA_API}/exports`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        design_id: designId,
        format: isVideo ? { type: 'mp4', quality: 'horizontal_1080p' } : { type: 'png' },
      }),
    });
    const start = await startRes.json();
    if (!startRes.ok || !start.job?.id) {
      return Response.json({ error: start?.message || `Canva could not export this design (${startRes.status})` }, { status: 400 });
    }

    let job = start.job;
    for (let i = 0; i < 20 && job.status === 'in_progress'; i++) {
      await sleep(1500);
      const pollRes = await fetch(`${CANVA_API}/exports/${start.job.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const poll = await pollRes.json();
      job = poll.job || job;
    }
    if (job.status !== 'success' || !job.urls?.length) {
      return Response.json({ error: job.error?.message || 'Canva did not finish exporting this design. Try again in a moment.' }, { status: 400 });
    }

    const created = [];
    const assets = [];
    for (let page = 0; page < job.urls.length; page++) {
      const fileRes = await fetch(job.urls[page]);
      const blob = await fileRes.blob();
      const ext = isVideo ? 'mp4' : 'png';
      const name = `${(title || 'canva-design').replace(/[^a-z0-9-_]+/gi, '-')}${job.urls.length > 1 ? `-${page + 1}` : ''}.${ext}`;
      const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
        file: new File([blob], name, { type: isVideo ? 'video/mp4' : 'image/png' }),
      });
      // A Canva video (the owner's audio added over the canvas) belongs in the
      // clips library, where posts pick their ready-to-post media from.
      if (isVideo) {
        const clip = await base44.asServiceRole.entities.ClipAsset.create({
          title: title || 'Canva video',
          file: file_url,
          source_type: 'Canva Export',
          media_category: 'Promo',
          notes: 'Imported from Canva',
        });
        created.push(clip.id);
        assets.push({ id: clip.id, url: file_url, type: 'video' });
        continue;
      }
      // Pulling edits back into the image the design came from: replace that
      // image's file so every post using it shows the edited version.
      if (replaceImageId && page === 0) {
        await base44.asServiceRole.entities.GalleryImage.update(replaceImageId, { image_url: file_url });
        created.push(replaceImageId);
        assets.push({ id: replaceImageId, url: file_url, type: 'image' });
        continue;
      }
      const record = await base44.asServiceRole.entities.GalleryImage.create({
        title: job.urls.length > 1 ? `${title || 'Canva design'} (${page + 1})` : title || 'Canva design',
        image_url: file_url,
        category: 'promo',
        source: 'upload',
        description: 'Imported from Canva',
      });
      created.push(record.id);
      assets.push({ id: record.id, url: file_url, type: 'image' });
    }

    return Response.json({ ok: true, imported: created.length, assets });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}