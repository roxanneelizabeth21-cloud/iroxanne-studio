import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';
import { CANVA_API, getCanvaAccessToken } from '../../shared/canva.ts';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function nameBase64(title) {
  // Canva caps an asset name at 50 unencoded characters and rejects the whole
  // metadata header when it's longer.
  const name = String(title || 'Roxsan media').trim().slice(0, 50) || 'Roxsan media';
  const bytes = new TextEncoder().encode(name);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

// Sends one library image into Canva as a new editable design and returns the
// Canva edit URL. Canva cannot edit the app's file in place, so this always
// creates a fresh design the owner re-imports when finished.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { image_url: imageUrl, title, gallery_image_id: galleryImageId } = await req.json();
    if (!imageUrl) return Response.json({ error: 'An image is required' }, { status: 400 });

    const token = await getCanvaAccessToken(base44, secrets.get('CANVA_CLIENT_ID'), secrets.get('CANVA_CLIENT_SECRET'));

    const fileRes = await fetch(imageUrl);
    if (!fileRes.ok) return Response.json({ error: 'Could not read this media file' }, { status: 400 });
    const bytes = new Uint8Array(await fileRes.arrayBuffer());

    const uploadRes = await fetch(`${CANVA_API}/asset-uploads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Asset-Upload-Metadata': JSON.stringify({ name_base64: nameBase64(title) }),
      },
      body: bytes,
    });
    const upload = await uploadRes.json();
    if (!uploadRes.ok || !upload.job?.id) {
      return Response.json({ error: upload?.message || `Canva rejected the upload (${uploadRes.status})` }, { status: 400 });
    }

    let job = upload.job;
    for (let i = 0; i < 20 && job.status === 'in_progress'; i++) {
      await sleep(1500);
      const pollRes = await fetch(`${CANVA_API}/asset-uploads/${upload.job.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const poll = await pollRes.json();
      job = poll.job || job;
    }
    if (job.status !== 'success' || !job.asset?.id) {
      return Response.json({ error: job.error?.message || 'Canva did not finish receiving this image. Try again in a moment.' }, { status: 400 });
    }

    const designRes = await fetch(`${CANVA_API}/designs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: job.asset.id, title: title || 'Roxsan media' }),
    });
    const design = await designRes.json();
    if (!designRes.ok || !design.design?.urls?.edit_url) {
      return Response.json({ error: design?.message || `Canva could not create a design (${designRes.status})` }, { status: 400 });
    }

    // Remember which Canva design belongs to this library image so the edited
    // version can replace it instead of piling up duplicates.
    if (galleryImageId) {
      await base44.asServiceRole.entities.GalleryImage.update(galleryImageId, { canva_design_id: design.design.id });
    }

    return Response.json({ edit_url: design.design.urls.edit_url, design_id: design.design.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}