import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Music, Film, Mail, MessageSquare, Megaphone, ArrowRight } from 'lucide-react';

export default function AdminOverview() {
  const { data: releases = [] } = useQuery({ queryKey: ['releases-admin'], queryFn: () => base44.entities.MusicRelease.list('-created_date') });
  const { data: videos = [] } = useQuery({ queryKey: ['videos-admin'], queryFn: () => base44.entities.Video.list('-created_date') });
  const { data: subs = [] } = useQuery({ queryKey: ['fan-subscribers-recent'], queryFn: () => base44.entities.FanSubscriber.list('-created_date', 50) });
  const { data: msgs = [] } = useQuery({ queryKey: ['contact-messages-recent'], queryFn: () => base44.entities.ContactMessage.list('-created_date', 50) });

  const cards = [
    { to: '/admin/music', label: 'Releases', count: releases.length, Icon: Music },
    { to: '/admin/videos', label: 'Videos', count: videos.length, Icon: Film },
    { to: '/admin/subscribers', label: 'Subscribers', count: subs.length, Icon: Mail },
    { to: '/admin/messages', label: 'Messages', count: msgs.length, Icon: MessageSquare },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage your media, subscribers, and site content.</p>
      </div>

      <Link to="/marketing" className="block glass rounded-2xl p-5 hover:border-primary/40 transition-colors group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Megaphone className="h-6 w-6 text-primary" /></div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-semibold">Marketing Content Suite</h2>
            <p className="text-sm text-muted-foreground">Plan campaigns, generate posts with AI, and schedule content.</p>
          </div>
          <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-0.5 transition-transform shrink-0" />
        </div>
      </Link>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="glass rounded-xl px-3 py-2 flex items-center gap-2 hover:border-primary/40 transition-colors">
            <c.Icon className="h-4 w-4 text-primary shrink-0" />
            <span className="text-base font-semibold font-display">{c.count}</span>
            <span className="text-xs text-muted-foreground truncate">{c.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> Recent Subscribers</h3>
            <Link to="/admin/subscribers" className="text-xs text-primary">View all</Link>
          </div>
          {subs.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No subscribers yet.</p> : (
            <ul className="space-y-2">
              {subs.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="truncate">{s.email}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{s.source_slug || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Recent Messages</h3>
            <Link to="/admin/messages" className="text-xs text-primary">View all</Link>
          </div>
          {msgs.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No messages yet.</p> : (
            <ul className="space-y-2">
              {msgs.slice(0, 5).map((m) => (
                <li key={m.id} className="flex items-center justify-between text-sm gap-2">
                  <span className="truncate">{m.subject || m.name || 'Message'}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{m.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}