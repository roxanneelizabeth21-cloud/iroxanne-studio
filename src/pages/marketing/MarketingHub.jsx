import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { resolveMedia, publishTargets, platformResult, platformError } from '@/lib/postValidation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  PenLine, CalendarDays, Image, Bot, Megaphone,
  BarChart3, ToggleLeft, UserCircle, Library, AlertTriangle
} from 'lucide-react';

export default function MarketingHub() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('review');
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ['marketing-posts'],
    queryFn: () => base44.entities.MarketingPost.list('-created_date', 1000),
  });
  const { data: clips = [] } = useQuery({
    queryKey: ['clip-assets'],
    queryFn: () => base44.entities.ClipAsset.list('-created_date', 1000),
  });

  const active = posts.filter(p => !['Cancelled', 'Skipped'].includes(p.status));

  const attention = (p) =>
    ['Failed', 'Partially Published'].includes(p.status) ||
    publishTargets(p).some(t =>
      ['Failed', 'Connection Required', 'Permission Required'].includes(platformResult(p, t))
    );

  const ready = (p) =>
    resolveMedia(p, clips) &&
    publishTargets(p).length &&
    publishTargets(p).every(t =>
      String(p.create_post_state?.platformCaptions?.[t.toLowerCase()] ?? p.caption ?? '').trim()
    );

  const groups = {
    review: active.filter(
      p =>
        !attention(p) &&
        !['Posted', 'Publishing'].includes(p.status) &&
        p.publishing_status !== 'Publishing' &&
        !(p.status === 'Scheduled' && p.approval_status === 'Approved' && p.publish_mode === 'auto') &&
        ready(p)
    ),
    scheduled: active.filter(
      p =>
        !attention(p) &&
        ((p.status === 'Scheduled' && p.approval_status === 'Approved' && p.publish_mode === 'auto') ||
          p.status === 'Publishing' ||
          p.publishing_status === 'Publishing')
    ),
    results: active.filter(p => p.status === 'Posted' || attention(p)),
  };

  const incomplete = active.filter(
    p => !ready(p) && !attention(p) && !['Posted', 'Publishing', 'Scheduled'].includes(p.status)
  );

  const saveFeedback = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    setError('');
    try {
      const current = await base44.entities.MarketingPost.get(action.post.id);
      if (
        ['Posted', 'Publishing', 'Partially Published'].includes(current.status) ||
        current.publishing_status === 'Publishing'
      ) {
        throw new Error('This post has already started publishing. Refresh to see its delivery status.');
      }
      await base44.entities.MarketingPost.update(current.id, {
        status: action.kind === 'reject' ? 'Skipped' : 'Pending Review',
        approval_status: 'Pending Review',
        publish_mode: 'manual',
        admin_notes: (
          (current.admin_notes || '') +
          '\n' +
          new Date().toISOString() +
          ' ' +
          (action.kind === 'reject' ? 'REJECTED: ' : 'CHANGES REQUESTED: ') +
          reason.trim()
        ).slice(-1000),
      });
      await qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      setAction(null);
      setReason('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { key: 'review', label: 'Needs Approval' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'results', label: 'Published' },
  ];

  const quickLinks = [
    { to: '/marketing/post', label: 'Create a Post', desc: 'Write, attach media, and schedule', Icon: PenLine },
    { to: '/marketing/strategist', label: 'Ask the Strategist', desc: 'Get AI content suggestions', Icon: Bot },
    { to: '/marketing/calendar', label: 'Content Calendar', desc: 'Plan and manage your backlog', Icon: CalendarDays },
    { to: '/marketing/media', label: 'Media Library', desc: 'All your graphics and videos', Icon: Image },
    { to: '/marketing/controls', label: 'Automation', desc: 'Auto-publish rules and settings', Icon: ToggleLeft },
    { to: '/marketing/performance', label: 'Performance', desc: 'Track reach and engagement', Icon: BarChart3 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page header */}
      <div className="irx-page-header">
        <div className="irx-eyebrow">Marketing Studio</div>
        <h1>Your Marketing</h1>
        <p>Review finished content below. Nothing goes out without your approval.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
        <Link to="/marketing/library" className="irx-stat">
          <div className="irx-stat-icon irx-accent-teal"><Megaphone style={{ width: 18, height: 18 }} /></div>
          <div className="irx-stat-number">{groups.review.length}</div>
          <div className="irx-stat-label">Needs approval</div>
        </Link>
        <Link to="/marketing/calendar" className="irx-stat">
          <div className="irx-stat-icon irx-accent-violet"><CalendarDays style={{ width: 18, height: 18 }} /></div>
          <div className="irx-stat-number">{groups.scheduled.length}</div>
          <div className="irx-stat-label">Scheduled</div>
        </Link>
        <Link to="/marketing/library" className="irx-stat">
          <div className="irx-stat-icon irx-accent-green"><BarChart3 style={{ width: 18, height: 18 }} /></div>
          <div className="irx-stat-number">{groups.results.length}</div>
          <div className="irx-stat-label">Published</div>
        </Link>
        {incomplete.length > 0 && (
          <Link to="/marketing/library" className="irx-stat">
            <div className="irx-stat-icon irx-accent-gold"><AlertTriangle style={{ width: 18, height: 18 }} /></div>
            <div className="irx-stat-number">{incomplete.length}</div>
            <div className="irx-stat-label">Unfinished drafts</div>
          </Link>
        )}
      </div>

      {/* Post approval queue */}
      <div>
        <div className="irx-section-head">
          <h2>Content Queue</h2>
          <Link to="/marketing/library">All posts</Link>
        </div>

        {/* Tab pills */}
        <nav aria-label="Post status" className="irx-filters" style={{ marginBottom: '20px' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`irx-pill${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
            >
              {t.label} ({groups[t.key].length})
            </button>
          ))}
        </nav>

        {/* Loading / error / empty */}
        {isLoading ? (
          <div className="irx-card"><p style={{ color: 'var(--text-secondary, #63716c)' }}>Loading your posts…</p></div>
        ) : isError ? (
          <div className="irx-card" role="alert">
            <p style={{ color: '#a77769' }}>Posts could not be loaded. Please refresh.</p>
          </div>
        ) : groups[tab].length === 0 ? (
          <div className="irx-empty" style={{ border: '1px solid var(--border-default, #e1e2d7)', borderRadius: '16px' }}>
            <Megaphone />
            <p>
              {tab === 'review'
                ? 'No finished posts are waiting for approval.'
                : tab === 'scheduled'
                  ? 'Nothing is scheduled yet.'
                  : 'No published posts or delivery problems yet.'}
            </p>
          </div>
        ) : (
          /* Post cards grid */
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
            {groups[tab].map(p => {
              const media = resolveMedia(p, clips);
              return (
                <article key={p.id} className="irx-post-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3>{p.hook || 'Your next story'}</h3>

                  {media && (
                    media.type === 'video' ? (
                      <video controls preload="metadata" src={media.url}
                        style={{ width: '100%', maxHeight: '320px', borderRadius: '10px' }} />
                    ) : (
                      <img src={media.url} alt="Post graphic"
                        style={{ width: '100%', maxHeight: '320px', objectFit: 'contain', borderRadius: '10px' }} />
                    )
                  )}

                  {publishTargets(p).map(t => (
                    <section key={t} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary, #213b45)', margin: 0 }}>{t}</h4>
                      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px', color: 'var(--text-secondary, #596a68)', margin: 0 }}>
                        {p.create_post_state?.platformCaptions?.[t.toLowerCase()] ?? p.caption}
                      </p>
                      {p.hashtags && <p style={{ fontSize: '13px', color: 'var(--text-tertiary, #697773)', margin: 0 }}>{p.hashtags}</p>}
                      {tab !== 'review' && (
                        <p className="irx-post-meta">{platformResult(p, t)}</p>
                      )}
                      {platformError(p, t) && (
                        <p style={{ fontSize: '13px', color: '#a77769', margin: 0 }}>{platformError(p, t)}</p>
                      )}
                    </section>
                  ))}

                  {p.scheduled_date && (
                    <p className="irx-post-meta">
                      {tab === 'review' ? 'Suggested date' : 'Scheduled'}:{' '}
                      {p.scheduled_date} {p.scheduled_time} ({p.scheduled_timezone || 'America/New_York'})
                    </p>
                  )}

                  {p.admin_notes && (
                    <details style={{ fontSize: '13px' }}>
                      <summary style={{ cursor: 'pointer', color: 'var(--text-secondary, #596a68)' }}>Your feedback</summary>
                      <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary, #596a68)', marginTop: '6px' }}>{p.admin_notes}</p>
                    </details>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                    <Button asChild size="sm">
                      <Link to={'/marketing/post/' + p.id}>
                        {tab === 'review' ? 'Review & approve' : tab === 'scheduled' ? 'View schedule' : 'View details'}
                      </Link>
                    </Button>
                    {tab === 'review' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => { setAction({ post: p, kind: 'changes' }); setReason(''); setError(''); }}>
                          Request changes
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setAction({ post: p, kind: 'reject' }); setReason(''); setError(''); }}>
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <div className="irx-section-head">
          <h2>Create & Tools</h2>
          <Link to="/marketing/brand">Brand settings</Link>
        </div>
        <div className="irx-actions-grid">
          {quickLinks.map(q => (
            <Link key={q.to} to={q.to} className="irx-action-tile">
              <q.Icon />
              <strong>{q.label}</strong>
              <small>{q.desc}</small>
            </Link>
          ))}
        </div>
        {incomplete.length > 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary, #697773)', marginTop: '12px' }}>
            {incomplete.length} unfinished draft{incomplete.length !== 1 ? 's' : ''} need a graphic, video, or caption before they appear for approval.
          </p>
        )}
      </div>

      {/* Feedback dialog — unchanged logic */}
      <Dialog open={!!action} onOpenChange={open => { if (!open && !busy) setAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.kind === 'reject' ? 'Reject this post' : 'What should change?'}</DialogTitle>
            <DialogDescription>
              Your feedback is saved with the post. It will not be published or deleted.
              Revisions still need to be made before you review it again.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label="Feedback"
            value={reason}
            maxLength={700}
            onChange={e => setReason(e.target.value)}
            placeholder="Tell the strategist what missed the mark."
          />
          {error && <p role="alert" style={{ color: '#a77769', fontSize: '14px' }}>{error}</p>}
          <Button disabled={busy || !reason.trim()} onClick={saveFeedback}>
            {busy ? 'Saving…' : 'Save feedback'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
