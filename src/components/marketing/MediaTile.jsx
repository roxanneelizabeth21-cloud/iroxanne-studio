// One media thumbnail in the library grid.
export default function MediaTile({ asset, onSelect }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(asset)}
        className="w-full text-left rounded-xl overflow-hidden border-[0.5px] border-border bg-card/60 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      >
        <div className="aspect-square bg-muted">
          {asset.kind === 'video' ? (
            <video src={asset.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
          ) : (
            <img src={asset.url} alt={asset.title} loading="lazy" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="p-2">
          <p className="text-xs font-medium truncate">{asset.title}</p>
          <p className="text-[11px] text-muted-foreground truncate">{asset.media_category || asset.source}</p>
        </div>
      </button>
    </li>
  );
}