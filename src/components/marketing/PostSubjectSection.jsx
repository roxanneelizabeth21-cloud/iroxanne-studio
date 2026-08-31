import { Music2, Shirt } from 'lucide-react';
import { FIELD_LABEL as LABEL } from '@/components/marketing/postEditorFields';

// Step 1 of the editor: what this post is actually promoting — a music release
// (album/single/track) or a piece of merchandise.
export default function PostSubjectSection({ form, set, releases = [], allTracks = [], merchProducts = [] }) {
  const state = form.create_post_state || {};
  const subjectType = state.subject_type || (form.song_id ? 'music' : '');

  const setSubject = (type) => {
    set('create_post_state', { ...state, subject_type: type });
    if (type === 'merch') set('song_id', '');
  };
  const setMerch = (id) => set('create_post_state', { ...state, subject_type: 'merch', merch_product_id: id });

  const release = releases.find((r) => r.id === form.song_id);
  const track = allTracks.find((t) => t.id === form.song_id);
  const product = merchProducts.find((p) => p.id === state.merch_product_id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSubject('music')}
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium ${subjectType === 'music' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'}`}
        >
          <Music2 className="h-4 w-4 shrink-0" /> Music release
        </button>
        <button
          type="button"
          onClick={() => setSubject('merch')}
          className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium ${subjectType === 'merch' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'}`}
        >
          <Shirt className="h-4 w-4 shrink-0" /> Merchandise
        </button>
      </div>

      {subjectType === 'merch' ? (
        <div>
          <label className={LABEL}>Product</label>
          <select value={state.merch_product_id || ''} onChange={(e) => setMerch(e.target.value)}>
            <option value="">Select a product…</option>
            {merchProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {product && <p className="mt-1 text-xs text-muted-foreground">Promoting {product.name}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className={LABEL}>Release / album / single</label>
            <select value={release ? form.song_id : ''} onChange={(e) => { set('song_id', e.target.value); set('create_post_state', { ...state, subject_type: 'music' }); }}>
              <option value="">Select a release…</option>
              {releases.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Or a specific song</label>
            <select value={track ? form.song_id : ''} onChange={(e) => { set('song_id', e.target.value); set('create_post_state', { ...state, subject_type: 'music' }); }}>
              <option value="">Select a song…</option>
              {allTracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          {(release || track) && (
            <p className="text-xs text-muted-foreground">Promoting {release?.title || track?.title}</p>
          )}
        </div>
      )}
    </div>
  );
}