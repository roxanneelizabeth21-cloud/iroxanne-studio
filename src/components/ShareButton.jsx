import { useState } from 'react';
import { Share2, Link, Check, Twitter, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShareButton({ release, className = '' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = window.location.href;
  const title = release?.title ? `${release.title} — Roxsan` : 'Roxsan Music';
  const description = release?.share_description || release?.description || 'Stories that stay. Music that feels real.';
  const image = release?.social_share_image || release?.cover_image || '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({ title, text: description, url });
      setOpen(false);
    }
  };

  const shareTwitter = () => {
    const t = encodeURIComponent(`${title}\n${description}`);
    const u = encodeURIComponent(url);
    window.open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`, '_blank', 'width=600,height=400');
    setOpen(false);
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    setOpen(false);
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all border border-border/40 hover:border-primary/30"
        aria-label="Share"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 right-0 z-50 glass border border-border/60 rounded-xl shadow-xl p-3 min-w-[180px] space-y-1"
            >
              <p className="text-xs text-muted-foreground font-medium px-2 pb-1 border-b border-border/40 mb-2 truncate max-w-[160px]">
                {release?.title || 'Share'}
              </p>

              <button
                onClick={copyLink}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-secondary/60 transition-colors text-left"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Link className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{copied ? 'Copied!' : 'Copy link'}</span>
              </button>

              {hasNativeShare && (
                <button
                  onClick={shareNative}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-secondary/60 transition-colors text-left"
                >
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  <span>Share via…</span>
                </button>
              )}

              <button
                onClick={shareTwitter}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-secondary/60 transition-colors text-left"
              >
                <Twitter className="h-4 w-4 text-muted-foreground" />
                <span>X / Twitter</span>
              </button>

              <button
                onClick={shareFacebook}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-secondary/60 transition-colors text-left"
              >
                <Facebook className="h-4 w-4 text-muted-foreground" />
                <span>Facebook</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}