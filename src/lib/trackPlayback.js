// Resolve public playback for a track given its parent MusicRelease.
//
// Status gate: upcoming releases expose no audio publicly — returns not playable.
// Configured snippets (snippet_start / snippet_end set on the track) always win,
// in both auto and manual_only modes.
// In auto mode, a track with audio_file but no configured snippet plays a
// 30-second fallback preview (start at 45s, or 25% of duration if < 75s), with a
// 2-second fade on the tail.
// In manual_only mode, unconfigured tracks are not playable.
//
// Returns { playable: false } or
// { playable: true, src, snippetStart, snippetEnd, fade }.
// A release exposes playable previews only when previews_enabled is not
// explicitly false (default true for pre-existing records) and the release is
// not upcoming. Single gate for both release-level audio_snippet playback and
// per-track previews.
export function releaseIsPlayable(release) {
  return !!release && release.previews_enabled !== false && release.status !== 'upcoming';
}

export function resolveTrackPlayback(track, release) {
  if (!releaseIsPlayable(release)) return { playable: false };
  if (!track || !track.audio_file) return { playable: false };

  const hasConfiguredSnippet = track.snippet_start != null || track.snippet_end != null;
  if (hasConfiguredSnippet) {
    return {
      playable: true,
      src: track.audio_file,
      snippetStart: track.snippet_start || 0,
      snippetEnd: track.snippet_end != null ? track.snippet_end : null,
      fade: false,
    };
  }

  const mode = release.snippet_mode || 'auto';
  if (mode !== 'auto') return { playable: false };

  const duration = Number(track.duration) || 0;
  const start = duration > 0 && duration < 75 ? duration * 0.25 : 45;
  return {
    playable: true,
    src: track.audio_file,
    snippetStart: start,
    snippetEnd: start + 30,
    fade: true,
  };
}