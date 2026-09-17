import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const videos = await base44.asServiceRole.entities.Video.filter({ featured: true });
    const formatted = (videos || [])
      .map((v) => ({
        id: v.id,
        title: v.title || 'Untitled',
        youtube_url: v.youtube_url || null,
        file: v.optional_video_file || null,
        thumbnail: v.thumbnail || null,
        description: v.description || '',
        type: v.type || '',
      }))
      .filter((v) => v.youtube_url || v.file);
    return Response.json({ videos: formatted });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}