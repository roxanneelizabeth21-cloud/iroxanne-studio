import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// One adaptive share button for a release. Shares the prerender
// (releaseShareMeta) URL so iMessage / WhatsApp / Facebook previews show the
// release cover art + title instead of the site-default brand logo. Humans
// who open the link are JS-redirected to the real landing page.
//
//   Mobile  (navigator.share) → opens the native share sheet
//   Desktop (no navigator.share) → copies the URL + shows "Link copied"
export default function ReleaseShareButton({ slug, title = 'ROXSAN', theme, className = '' }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const url = (slug && typeof window !== 'undefined')
    ? `${window.location.origin}/functions/releaseShareMeta?slug=${encodeURIComponent(slug)}`
    : (typeof window !== 'undefined' ? window.location.href : '');

  const copyToClipboard = async (text) => {
    // Modern async clipboard API
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy approach
    }
    // Legacy fallback (works when clipboard API is blocked / insecure context)
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const [showLink, setShowLink] = useState(false);

  const doCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast({ description: 'Release link copied — paste it anywhere to share.' });
    } else {
      toast({ description: 'Couldn’t copy automatically. Select the link and copy manually.', variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: `${title} — ROXSAN`, text: `${title} — ROXSAN`, url });
      } catch {
        // user dismissed the sheet
      }
      return;
    }
    // Desktop: try a quick copy, and always reveal the link panel so the
    // click visibly does something even if the clipboard API is blocked.
    await doCopy();
    setShowLink((v) => !v);
  };

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleShare}
        aria-label="Share"
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs sm:text-sm transition-all duration-300 hover:scale-[1.03] ${className}`}
        style={theme ? { borderColor: theme.border, background: theme.cardBg, color: theme.text } : undefined}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 shrink-0" style={{ color: theme?.accent }} />
        ) : (
          <Share2 className="h-3.5 w-3.5 shrink-0" style={{ color: theme?.accent }} />
        )}
        {copied ? 'Link copied' : 'Share'}
      </button>

      {showLink && (
        <div
          className="absolute z-50 right-0 bottom-full mb-2 flex items-center gap-2 p-2 rounded-lg border bg-white shadow-lg"
          style={{ borderColor: theme?.border || '#dcdcdc' }}
        >
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-56 sm:w-64 text-xs px-2 py-1.5 rounded border bg-white text-black outline-none"
            style={{ borderColor: theme?.border || '#dcdcdc' }}
            aria-label="Release share link"
          />
          <button
            onClick={doCopy}
            className="shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-black hover:opacity-90"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}