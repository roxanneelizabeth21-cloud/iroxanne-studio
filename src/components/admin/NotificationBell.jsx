import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// In-admin notification bell. Polls recent subscribers + contact messages and
// shows an unread badge against a "last seen" timestamp stored in localStorage.
// Opening the dropdown marks everything read.
const SEEN_KEY = 'roxsan_admin_notif_seen';

function getSeen() {
  try { return localStorage.getItem(SEEN_KEY) || null; } catch { return null; }
}
function setSeen(ts) {
  try { localStorage.setItem(SEEN_KEY, ts); } catch {}
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: subs = [] } = useQuery({
    queryKey: ['fan-subscribers-recent'],
    queryFn: () => base44.entities.FanSubscriber.list('-created_date', 20),
    refetchInterval: 30000,
    staleTime: 15000,
  });
  const { data: msgs = [] } = useQuery({
    queryKey: ['contact-messages-recent'],
    queryFn: () => base44.entities.ContactMessage.list('-created_date', 20),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const seenTs = (() => { const s = getSeen(); return s ? new Date(s).getTime() : 0; })();
  const unread = subs.filter((s) => new Date(s.created_date).getTime() > seenTs).length
    + msgs.filter((m) => new Date(m.created_date).getTime() > seenTs).length;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = () => {
    setSeen(new Date().toISOString());
    qc.invalidateQueries({ queryKey: ['fan-subscribers-recent'] });
    qc.invalidateQueries({ queryKey: ['contact-messages-recent'] });
  };

  const recent = [
    ...subs.slice(0, 8).map((s) => ({ type: 'sub', id: s.id, title: s.email, sub: s.source_slug || 'newsletter', date: s.created_date, Icon: Mail, to: '/admin/subscribers' })),
    ...msgs.slice(0, 8).map((m) => ({ type: 'msg', id: m.id, title: m.subject || m.name || 'Message', sub: m.name || '', date: m.created_date, Icon: MessageSquare, to: '/admin/messages' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { if (!open) markRead(); setOpen((o) => !o); }}
        className="relative p-2 rounded-lg hover:bg-secondary/60 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 glass rounded-xl border border-border/50 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <span className="font-medium text-sm">Notifications</span>
            {unread > 0 ? <span className="text-xs text-primary">{unread} new</span> : <span className="text-xs text-muted-foreground">All caught up</span>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {recent.length === 0 && <div className="px-4 py-8 text-center text-sm text-muted-foreground">No activity yet.</div>}
            {recent.map((n) => (
              <button
                key={n.type + n.id}
                onClick={() => { setOpen(false); navigate(n.to); }}
                className="w-full text-left px-4 py-3 hover:bg-secondary/40 border-b border-border/20 flex gap-3 items-start"
              >
                <n.Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}