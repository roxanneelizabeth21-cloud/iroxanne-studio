import MediaTile from '@/components/marketing/MediaTile';

// Groups the library into collections — each project, then Unfiled —
// so browsing feels like folders instead of one endless wall of images.
export default function MediaCollectionGroups({ assets, portfolioItems, onSelect }) {
  const byId = new Map(portfolioItems.map((r) => [r.id, r]));
  const groups = new Map();
  assets.forEach((a) => {
    const key = byId.has(a.project_id) ? a.project_id : '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(a);
  });
  const ordered = [...groups.entries()].sort((a, b) => {
    if (!a[0]) return 1;
    if (!b[0]) return -1;
    return String(byId.get(a[0])?.title || '').localeCompare(String(byId.get(b[0])?.title || ''));
  });

  return (
    <div className="space-y-6">
      {ordered.map(([releaseId, items]) => (
        <section key={releaseId || 'unfiled'}>
          <h3 className="text-sm font-medium mb-2">
            {byId.get(releaseId)?.title || 'Unfiled'}
            <span className="ml-2 text-xs text-muted-foreground">{items.length}</span>
          </h3>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 list-none p-0">
            {items.map((a) => <MediaTile key={a.id} asset={a} onSelect={onSelect} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}