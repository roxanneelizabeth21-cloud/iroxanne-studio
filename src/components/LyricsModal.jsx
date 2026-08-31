import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function LyricsModal({ release, open, onClose }) {
  if (!release) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            {release.cover_image && (
              <img
                src={release.cover_image}
                alt={release.title}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            )}
            <div>
              <DialogTitle className="font-display text-lg leading-tight">{release.title}</DialogTitle>
              {release.release_date && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(release.release_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {release.lyrics ? (
            <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-sans leading-relaxed">
              {release.lyrics}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Lyrics not available yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}