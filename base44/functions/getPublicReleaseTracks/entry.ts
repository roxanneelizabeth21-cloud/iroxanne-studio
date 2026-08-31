import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Public track list for a MusicRelease.
//
// Status gate: for upcoming releases, audio_file is redacted so no audio URLs
// reach the browser until the release is out (the public player cannot play
// them and the network response carries no audio paths). Released releases
// return full tracks so the public player can use a configured snippet or the
// 30-second auto fallback.
//
// Runs as service role so anonymous visitors can read public tracks without a
// user token (Track + MusicRelease reads are public under RLS).
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);

    let body: any = {};
    try { body = await req.json(); } catch {}
    const releaseId = (body?.releaseId || '').toString();
    if (!releaseId) return Response.json({ error: 'releaseId is required' }, { status: 400 });

    const release: any = await base44.asServiceRole.entities.MusicRelease.get(releaseId).catch(() => null);
    if (!release) return Response.json({ tracks: [], status: null });

    const tracks: any[] = await base44.asServiceRole.entities.Track.filter({ release_id: releaseId });
    const upcoming = release.status === 'upcoming';

    const publicTracks = tracks.map((t) => {
      const base = {
        id: t.id,
        title: t.title,
        track_number: t.track_number,
        duration: t.duration,
        lyrics: t.lyrics,
        snippet_start: t.snippet_start,
        snippet_end: t.snippet_end,
        snippet_duration: t.snippet_duration,
      };
      return upcoming ? { ...base, audio_file: null } : { ...base, audio_file: t.audio_file };
    });

    return Response.json({ tracks: publicTracks, status: release.status });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}