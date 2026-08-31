import { useMemo, useState } from 'react';
import { Search, Disc3, Music2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { POST_GOALS, effectiveGoal } from '@/lib/createPost';
import { formatDate } from '@/lib/marketing';
import AudioPreviewButton from '@/components/marketing/AudioPreviewButton';

const FL = 'text-xs font-medium text-muted-foreground uppercase tracking-wide';

function Card({ selected, onClick, image, title, lines, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-w-0 items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
        selected ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'border-border bg-card/60 hover:border-primary/40'
      }`}
    >
      {image ? (
        <img src={image} alt="" className="h-14 w-14 rounded-lg object-cover bg-muted shrink-0" loading="lazy" />
      ) : (
        <span className="h-14 w-14 rounded-lg bg-muted grid place-items-center shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-medium truncate">{title}</span>
        {lines.filter(Boolean).map((l, i) => (
          <span key={i} className="block text-[11px] text-muted-foreground truncate">{l}</span>
        ))}
      </span>
    </button>
  );
}

// Step 1 — what the owner is promoting, from the saved Roxsan catalog.
export default function StepMusic({ draft, patch, releases, tracks, campaigns, songProfiles }) {
  const [mode, setMode] = useState(draft.trackId ? 'song' : 'album');
  const [q, setQ] = useState('');

  const campaignFor = (releaseId) => campaigns.filter((c) => c.song_id === releaseId);
  const releaseById = useMemo(() => new Map(releases.map((r) => [r.id, r])), [releases]);

  const term = q.trim().toLowerCase();
  const matches = (text) => !term || String(text || '').toLowerCase().includes(term);

  const albumRows = releases.filter((r) => {
    const camp = campaignFor(r.id).map((c) => c.name).join(' ');
    return matches(r.title) || matches(camp);
  });

  const songRows = tracks.filter((t) => {
    const rel = releaseById.get(t.release_id);
    const camp = rel ? campaignFor(rel.id).map((c) => c.name).join(' ') : '';
    return matches(t.title) || matches(rel?.title) || matches(camp);
  });

  const selectedRelease = releaseById.get(draft.releaseId) || null;
  const albumTracks = tracks.filter((t) => t.release_id === draft.releaseId);
  const relevantCampaigns = draft.releaseId ? campaignFor(draft.releaseId) : [];
  const profile = songProfiles.find((s) => s.title === selectedRelease?.title) || null;

  const chooseAlbum = (r) => {
    const camps = campaignFor(r.id);
    const active = camps.find((c) => c.status === 'Active') || (camps.length === 1 ? camps[0] : null);
    patch({ releaseId: r.id, trackId: '', campaignId: active ? active.id : '' });
  };

  const chooseSong = (t) => {
    const rel = releaseById.get(t.release_id);
    const camps = rel ? campaignFor(rel.id) : [];
    const active = camps.find((c) => c.status === 'Active') || (camps.length === 1 ? camps[0] : null);
    patch({ releaseId: t.release_id || '', trackId: t.id, campaignId: active ? active.id : '' });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">What are you promoting?</h2>
        <p className="text-sm text-muted-foreground mt-1">Pick from your saved music. Everything already stored about it is used automatically.</p>
      </div>

      <div className="flex gap-2" role="radiogroup" aria-label="Promote an album or a song">
        {[['album', 'Album'], ['song', 'Song']].map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={mode === v}
            onClick={() => setMode(v)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${mode === v ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/60 hover:border-primary/40'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={mode === 'album' ? 'Search albums or campaigns' : 'Search songs, albums or campaigns'}
          aria-label="Search your music"
          className="pl-8"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {mode === 'album'
          ? albumRows.map((r) => (
            <Card
              key={r.id}
              icon={Disc3}
              selected={draft.releaseId === r.id && !draft.trackId}
              onClick={() => chooseAlbum(r)}
              image={r.cover_image_url}
              title={r.title}
              lines={[
                [r.release_type, r.status === 'upcoming' ? 'Upcoming' : 'Released'].filter(Boolean).join(' · '),
                r.release_date ? formatDate(r.release_date) : '',
                campaignFor(r.id).map((c) => c.name).join(', '),
              ]}
            />
          ))
          : songRows.map((t) => {
            const rel = releaseById.get(t.release_id);
            return (
              <div key={t.id} className="min-w-0 space-y-1.5">
                <Card
                  icon={Music2}
                  selected={draft.trackId === t.id}
                  onClick={() => chooseSong(t)}
                  image={rel?.cover_image_url}
                  title={t.title}
                  lines={[
                    rel?.title,
                    rel ? (rel.status === 'upcoming' ? 'Upcoming' : 'Released') : '',
                    campaignFor(t.release_id).map((c) => c.name).join(', '),
                  ]}
                />
                {t.audio_file && <AudioPreviewButton src={t.audio_file} label="Hear it" />}
              </div>
            );
          })}
        {!(mode === 'album' ? albumRows.length : songRows.length) && (
          <p className="text-sm text-muted-foreground sm:col-span-2">Nothing matches that search.</p>
        )}
      </div>

      {selectedRelease && mode === 'album' && !!albumTracks.length && (
        <div className="space-y-1.5">
          <label className={FL} htmlFor="cp-track">Specific track (optional)</label>
          <select id="cp-track" value={draft.trackId} onChange={(e) => patch({ trackId: e.target.value })}>
            <option value="">Promote the whole album</option>
            {albumTracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          {(() => {
            const sel = albumTracks.find((t) => t.id === draft.trackId);
            return sel?.audio_file ? <AudioPreviewButton src={sel.audio_file} label="Hear it" /> : null;
          })()}
        </div>
      )}

      {relevantCampaigns.length > 1 && (
        <div className="space-y-1.5">
          <label className={FL} htmlFor="cp-campaign">Campaign</label>
          <select id="cp-campaign" value={draft.campaignId} onChange={(e) => patch({ campaignId: e.target.value })}>
            <option value="">No campaign</option>
            {relevantCampaigns.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.status}</option>)}
          </select>
        </div>
      )}
      {relevantCampaigns.length === 1 && draft.campaignId && (
        <p className="text-xs text-muted-foreground">Campaign: {relevantCampaigns[0].name}</p>
      )}

      {selectedRelease && (
        <p className="text-xs text-muted-foreground">
          Using your saved details for {draft.trackId ? albumTracks.find((t) => t.id === draft.trackId)?.title || selectedRelease.title : selectedRelease.title}
          {profile ? ' — lyrics, story and themes included.' : '.'}
        </p>
      )}

      <div className="space-y-2">
        <span className={FL} id="cp-goal-label">What should this post accomplish?</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="cp-goal-label">
          {POST_GOALS.map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={draft.goal === g}
              onClick={() => patch({ goal: g })}
              className={`rounded-lg border px-3 py-2 text-sm ${draft.goal === g ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/60 hover:border-primary/40'}`}
            >
              {g}
            </button>
          ))}
        </div>
        {draft.goal === 'Custom goal' && (
          <Input
            value={draft.customGoal}
            onChange={(e) => patch({ customGoal: e.target.value })}
            placeholder="Describe the goal in a few words"
            aria-label="Custom goal"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label className={FL} htmlFor="cp-instruction">Anything to keep in mind? (optional)</label>
        <Textarea
          id="cp-instruction"
          value={draft.instruction}
          onChange={(e) => patch({ instruction: e.target.value })}
          rows={2}
          placeholder='e.g. "Make this more personal", "Focus on the second verse", "Do not use a person"'
        />
      </div>

      {!effectiveGoal(draft) && (
        <p className="text-xs text-muted-foreground">Choose a goal to continue.</p>
      )}
    </div>
  );
}