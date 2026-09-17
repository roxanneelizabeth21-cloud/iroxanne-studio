import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const clips = await base44.asServiceRole.entities.ClipAsset.list('-created_date', 50);
    const videoExt = /\.(mp4|mov|webm|m4v|avi)(\?|$)/i;
    const videos = (clips || [])
      .filter((c) => c && c.file && videoExt.test(c.file))
      .map((c) => ({
        id: c.id,
        title: c.title || 'Untitled',
        file: c.file,
        thumbnail: null,
        description: c.notes || '',
        orientation: c.orientation || '',
      }));
    return Response.json({ videos });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}