import { FIELD_LABEL as LABEL } from '@/components/marketing/postEditorFields';

// Step 1 of the editor: what this post is actually promoting — a portfolio project
// (or a general post with no project attached).
export default function PostSubjectSection({ form, set, portfolioItems = [] }) {
  const state = form.create_post_state || {};
  const value = form.portfolio_item_id || state.portfolio_item_id || '';
  const item = portfolioItems.find((p) => p.id === value);

  const choose = (id) => {
    set('portfolio_item_id', id);
    set('create_post_state', { ...state, subject_type: id ? 'portfolio' : '', portfolio_item_id: id });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>Portfolio project</label>
        <select value={value} onChange={(e) => choose(e.target.value)}>
          <option value="">General post (no project)</option>
          {portfolioItems.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        {item && (
          <p className="mt-1 text-xs text-muted-foreground">
            Promoting {item.title}{item.category ? ` · ${item.category}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}