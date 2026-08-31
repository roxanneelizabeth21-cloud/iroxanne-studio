import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseUTMParams, isValidEmail } from '@/lib/analytics';
import { subscribeFan } from '@/hooks/useFanSubscribe';

const LOGO_URL = 'https://media.base44.com/images/public/6a048221a7f23eb1bf35a88e/8b4ec3f38_ChatGPTImageAug11202604_13_00PM.png';

const DISMISS_KEY = 'roxsan_popup_dismissed_until';
const SUBSCRIBED_KEY = 'roxsan_popup_subscribed';
const SESSION_SUB_KEY = 'roxsan_session_subscribed';

const TRIGGER_DELAY_MS = 15000;
const SCROLL_RATIO = 0.4;
const DISMISS_DAYS = 30;
const EXCLUDED_PATHS = new Set(['/privacy', '/terms']);

// Best-effort OneSignal slidedown detection — the prompt lives in shadow DOM,
// so we check for its known container element being visible.
function isOneSignalSlidedownVisible() {
  try {
    const ids = ['onesignal-slidedown-container', 'onesignal-popover-container'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function isSuppressed() {
  try {
    const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (until && Date.now() < until) return true;
    if (localStorage.getItem(SUBSCRIBED_KEY) === '1') return true;
    if (sessionStorage.getItem(SESSION_SUB_KEY) === '1') return true;
    return false;
  } catch {
    return false;
  }
}

function dismissFor(days) {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 86400000));
  } catch { /* ignore */ }
}

// Compact slide-in email capture card for new visitors on public pages.
export default function VisitorCaptureCard() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const armedRef = useRef(false);
  const excludedRef = useRef(false);

  // Update excluded flag on route change; hide the card if we land on a legal page.
  useEffect(() => {
    const excluded = EXCLUDED_PATHS.has(pathname);
    excludedRef.current = excluded;
    if (excluded) setVisible(false);
  }, [pathname]);

  // Arm triggers once on first eligible mount.
  useEffect(() => {
    if (armedRef.current) return;
    if (EXCLUDED_PATHS.has(pathname) || isSuppressed()) return;
    armedRef.current = true;

    const trigger = (retries = 0) => {
      if (excludedRef.current) return;
      if (isOneSignalSlidedownVisible()) {
        if (retries < 10) setTimeout(() => trigger(retries + 1), 3000);
        return;
      }
      window.removeEventListener('scroll', onScroll, { passive: true });
      setVisible(true);
    };

    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0 && window.scrollY / h >= SCROLL_RATIO) trigger();
    };

    const timer = setTimeout(() => trigger(), TRIGGER_DELAY_MS);
    window.addEventListener('scroll', onScroll, { passive: true });
    // In case the visitor is already scrolled past the threshold before the listener attaches.
    onScroll();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll, { passive: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) return;
    setSubmitting(true);
    try {
      const { utm_source, utm_medium, utm_campaign } = parseUTMParams(window.location.search);
      await subscribeFan({
        email: email.trim().toLowerCase(),
        source_slug: 'popup',
        utm_source,
        utm_medium,
        utm_campaign,
      });
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('track', 'Lead');
      }
      try {
        localStorage.setItem(SUBSCRIBED_KEY, '1');
        sessionStorage.setItem(SESSION_SUB_KEY, '1');
      } catch { /* ignore */ }
      setDone(true);
      setTimeout(() => setVisible(false), 3000);
    } catch {
      // leave suppressed false so they can retry later; don't nag now
    } finally {
      setSubmitting(false);
    }
  };

  const dismiss = () => {
    setVisible(false);
    dismissFor(DISMISS_DAYS);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed z-[70] left-4 right-4 sm:left-auto sm:right-5 sm:w-80 glass rounded-2xl border border-primary/20 shadow-2xl overflow-hidden"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}
          role="dialog"
          aria-label="Subscribe to Roxsan updates"
        >
          <button
            onClick={dismiss}
            className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors z-10"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          {done ? (
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3">
                <Check className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="font-display text-lg font-semibold">You're in 💙</p>
              <p className="text-xs text-muted-foreground mt-1">We'll be in touch.</p>
            </div>
          ) : (
            <div className="p-5 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <img src={LOGO_URL} alt="Roxsan" className="h-5 object-contain mix-blend-screen" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Roxsan</span>
              </div>
              <h3 className="font-display text-lg font-semibold leading-tight">Never miss a release</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3 leading-relaxed">
                Be the first to hear new music and behind-the-scenes stories.
              </p>
              <form onSubmit={handleSubmit} className="space-y-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 h-10"
                  aria-label="Email address"
                />
                <Button type="submit" disabled={submitting} className="w-full h-10 glow-blue-sm">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                  Subscribe
                </Button>
              </form>
              <p className="text-[10px] mt-2 text-muted-foreground leading-relaxed">
                By signing up you agree to receive email updates. See our{' '}
                <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}