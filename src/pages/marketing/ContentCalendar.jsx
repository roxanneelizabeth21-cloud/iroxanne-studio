import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, LayoutGrid, CalendarDays, Columns, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import HowThisWorks from '@/components/marketing/HowThisWorks';
import PostChip from '@/components/marketing/PostChip';
import VisualGridCard from '@/components/marketing/VisualGridCard';
import UnscheduledQueue from '@/components/marketing/UnscheduledQueue';
import VisualCardGrid from '@/components/marketing/VisualCardGrid';
import CalendarFiltersPanel from '@/components/marketing/CalendarFiltersPanel';
import CalendarToolbar from '@/components/marketing/CalendarToolbar';
import CalendarDropRail from '@/components/marketing/CalendarDropRail';
import useCalendarDrag from '@/lib/useCalendarDrag';
import MovePostDialog from '@/components/marketing/MovePostDialog';
import FinalReviewDialog from '@/components/marketing/FinalReviewDialog';
import PostShareDialog from '@/components/marketing/PostShareDialog';
import ManualShareDialog from '@/components/marketing/ManualShareDialog';
import MarkPostedManuallyDialog from '@/components/marketing/MarkPostedManuallyDialog';
import DeletePostDialog from '@/components/marketing/DeletePostDialog';
import {
  hasValidMedia, isLocked, QUEUE_EXCLUDED_STATUSES, schedulingTimezone, shortTimezone, publishTargets,
} from '@/lib/postValidation';
import {
  monthMatrix, weekRange, dateKey, postsByDate, STATUS_STYLES, formatDate, POST_STATUSES,
} from '@/lib/marketing';
import { pageUrl, defaultLinkTarget, consultBookingUrl } from '@/lib/postLink';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VIEW_KEY = 'iroxanne-cal-view';
const EMPTY_FILTERS = {
  campaign: '', platform: '', status: '', project: '', media: '', approval: '', flag: '', from: '', to: '', q: '',
};

const VIEWS = [
  { key: 'grid', label: 'Visual Grid', Icon: LayoutGrid },
  { key: 'month', label: 'Month', Icon: CalendarDays },
  { key: 'week', label: 'Week', Icon: Columns },
  { key: 'day', label: 'Day', Icon: Sun },
];

export default function ContentCalendar({ planner = false }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [view, setView] = useState(() => {
    try { return planner ? 'week' : localStorage.getItem(VIEW_KEY) || 'week'; } catch { return 'week'; }
  });
  const [cursor, setCursor] = useState(new Date());
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const navigate = useNavigate();
  // Posts are opened on their own full page — no cramped side drawers.
  const openPost = (p) => p?.id && navigate(`/marketing/post/${p.id}`);
  const [review, setReview] = useState(null); // { post, platforms }
  const [sharing, setSharing] = useState(null);
  const [manual, setManual] = useState(null); // { post, platformId } — TikTok / YouTube prep
  const [markPosted, setMarkPosted] = useState(null); // { post, platformId }
  const [movingPost, setMovingPost] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [moving, setMoving] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [showQueue, setShowQueue] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [announce, setAnnounce] = useState('');
  const revertRef = useRef(null);
  const dropRef = useRef(null);
  // Pointer-based drag (works with mouse AND touch); native HTML5 drag stays
  // wired for desktop mouse users and writes to the same state.
  const { dragId, overKey, setDragId, setOverKey, handleProps } = useCalendarDrag(
    (id, key) => dropRef.current && dropRef.current(id, key),
  );

  useEffect(() => { try { localStorage.setItem(VIEW_KEY, view); } catch {} }, [view]);

  const { data: posts = [] } = useQuery({ queryKey: ['marketing-posts'], queryFn: () => base44.entities.MarketingPost.list('-created_date') });
  const { data: campaigns = [] } = useQuery({ queryKey: ['marketing-campaigns'], queryFn: () => base44.entities.Campaign.list() });
  const { data: clips = [] } = useQuery({ queryKey: ['clip-assets'], queryFn: () => base44.entities.ClipAsset.list('-created_date') });
  const { data: projects = [] } = useQuery({ queryKey: ['portfolio-items'], queryFn: () => base44.entities.PortfolioItem.list() });
  const { data: brandProfiles = [] } = useQuery({ queryKey: ['brand-profile'], queryFn: () => base44.entities.BrandProfile.list() });

  const brandProfile = brandProfiles[0];
  const timezone = schedulingTimezone(brandProfile);
  const postShareUrl = (p) => {
    const item = p && projects.find((r) => r.id === p.portfolio_item_id);
    const target = p?.link_target || defaultLinkTarget(item);
    return pageUrl(item, target) || consultBookingUrl();
  };
  const campaignName = (p) => campaigns.find((c) => c.id === p?.campaign_id)?.name || '';
  const projectTitle = (p) => projects.find((r) => r.id === p?.portfolio_item_id)?.title || '';

  // Reminder links (?post=<id>) open that post's page directly.
  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get('post');
    if (pid) navigate(`/marketing/post/${pid}`, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the open review dialog pointing at fresh data after any update.
  useEffect(() => {
    if (review) { const f = posts.find((p) => p.id === review.post.id); if (f && f !== review.post) setReview({ ...review, post: f }); }
  }, [posts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reschedule with revert-on-failure. Published posts are locked.
  const reschedule = async (post, patch, label) => {
    if (!post) return;
    if (isLocked(post)) {
      toast({ title: 'Published posts can’t be moved', description: 'Its calendar position is historical and stays fixed.', variant: 'destructive' });
      return;
    }
    const prior = { scheduled_date: post.scheduled_date || '', scheduled_time: post.scheduled_time || '' };
    if (patch.scheduled_date === prior.scheduled_date && (patch.scheduled_time ?? prior.scheduled_time) === prior.scheduled_time) return;
    revertRef.current = { id: post.id, prior };
    setMoving(post.id);
    try {
      await base44.entities.MarketingPost.update(post.id, {
        ...patch,
        scheduled_timezone: patch.scheduled_date ? (post.scheduled_timezone || timezone) : post.scheduled_timezone || '',
      });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      const msg = patch.scheduled_date ? `Moved to ${label || formatDate(patch.scheduled_date)}` : 'Returned to the Unscheduled queue';
      toast({ title: msg });
      setAnnounce(msg);
      const sameDay = posts.filter((p) => p.id !== post.id && p.scheduled_date === patch.scheduled_date && !isLocked(p));
      if (sameDay.length) setAnnounce(`${msg}. ${sameDay.length} other post${sameDay.length > 1 ? 's' : ''} already scheduled that day.`);
    } catch (e) {
      // Restore the prior position — the UI re-reads from the server copy.
      try { await base44.entities.MarketingPost.update(post.id, prior); } catch {}
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      toast({ title: 'Move failed', description: e.message, variant: 'destructive', duration: 6000 });
      setAnnounce(`Move failed: ${e.message}`);
    } finally {
      setMoving(null);
      setDragId(null);
      setOverKey(null);
    }
  };

  const addSlot = async (key) => {
    try {
      const created = await base44.entities.MarketingPost.create({
        platform: 'Facebook', publish_targets: ['Facebook', 'Instagram'], format: 'Feed Post', scheduled_date: key, scheduled_timezone: timezone, status: 'Draft', caption: '',
      });
      qc.invalidateQueries({ queryKey: ['marketing-posts'] });
      openPost(created);
    } catch (e) {
      toast({ title: 'Create failed', description: e.message, variant: 'destructive' });
    }
  };

  const filtered = useMemo(() => posts.filter((p) => {
    if (filters.campaign && p.campaign_id !== filters.campaign) return false;
    if (filters.platform && !publishTargets(p).includes(filters.platform) && p.platform !== filters.platform) return false;
    if (filters.status && p.status !== filters.status) return false;
    if (filters.project && p.portfolio_item_id !== filters.project) return false;
    if (filters.media === 'has' && !hasValidMedia(p, clips)) return false;
    if (filters.media === 'none' && hasValidMedia(p, clips)) return false;
    if (filters.approval && (p.approval_status || 'Not Reviewed') !== filters.approval) return false;
    if (filters.flag === 'media_missing' && hasValidMedia(p, clips)) return false;
    if (filters.flag === 'needs_crop' && !(p.needs_crop || p.crop_status === 'needs_crop')) return false;
    if (filters.flag === 'published' && p.status !== 'Posted') return false;
    if (filters.flag === 'failed' && !['Failed', 'Partially Published'].includes(p.status)) return false;
    if (filters.from && (!p.scheduled_date || p.scheduled_date < filters.from)) return false;
    if (filters.to && (!p.scheduled_date || p.scheduled_date > filters.to)) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay = [p.caption, p.hook, p.cta, campaignName(p), projectTitle(p)].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [posts, filters, clips, campaigns, projects]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduled = useMemo(
    () => filtered.filter((p) => p.scheduled_date).sort((a, b) => (
      a.scheduled_date === b.scheduled_date
        ? String(a.scheduled_time || '99:99').localeCompare(String(b.scheduled_time || '99:99'))
        : a.scheduled_date.localeCompare(b.scheduled_date)
    )),
    [filtered],
  );
  const unscheduled = useMemo(
    () => filtered.filter((p) => !p.scheduled_date && !QUEUE_EXCLUDED_STATUSES.includes(p.status)),
    [filtered],
  );
  const byDate = useMemo(() => postsByDate(scheduled), [scheduled]);

  const days = useMemo(() => {
    if (view === 'month') return monthMatrix(cursor.getFullYear(), cursor.getMonth());
    if (view === 'week') {
      const [s] = weekRange(cursor);
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(d.getDate() + i); return d; });
    }
    return [new Date(cursor)];
  }, [view, cursor]);

  const label = useMemo(() => {
    if (view === 'month') return cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (view === 'day') return cursor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (view === 'week') {
      const [s, e] = weekRange(cursor);
      return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return 'All scheduled content';
  }, [view, cursor]);

  const move = (dir) => {
    // Month steps are built from year/month directly — adding a month to a
    // 29th–31st used to overflow into the following month, so the view could
    // skip a month and appear stuck.
    if (view === 'month') {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
      return;
    }
    const d = new Date(cursor);
    d.setDate(d.getDate() + dir * (view === 'week' ? 7 : 1));
    setCursor(d);
  };

  const todayKey = dateKey(new Date());

  // Advanced filters only — the search box lives in the header row.
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'q' && v).length;

  const dropHandlers = (key) => ({
    onDragOver: (e) => { if (dragId) { e.preventDefault(); setOverKey(key); } },
    onDragLeave: (e) => { if (e.currentTarget.contains(e.relatedTarget)) return; if (overKey === key) setOverKey(null); },
    onDrop: (e) => {
      e.preventDefault();
      const id = dragId || (e.dataTransfer && e.dataTransfer.getData('text/plain'));
      const post = posts.find((p) => p.id === id);
      if (post && !isLocked(post)) setMovingPost({ ...post, scheduled_date: key });
    },
  });

  // Drop target for both pointer drags and native drops.
  dropRef.current = (id, key) => {
    const post = posts.find((p) => p.id === id);
    if (post) if (post && !isLocked(post)) setMovingPost({ ...post, scheduled_date: key });
  };

  const startDrag = (p, e) => {
    setDragId(p.id);
    if (e?.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', p.id); }
  };
  const endDrag = () => { setDragId(null); setOverKey(null); };

  const cardProps = (p) => ({
    post: p,
    clips,
    campaignName: campaignName(p),
    projectTitle: projectTitle(p),
    timezone,
    brandProfile,
    onOpen: () => openPost(p),
    onShare: () => setSharing(p),
    onPublish: (platforms) => setReview({ post: p, platforms }),
    onManual: (platformId) => setManual({ post: p, platformId }),
    onMore: () => openPost(p),
    onDelete: () => setDeleting(p),
    playing: playingId === p.id,
    onPlay: () => setPlayingId(p.id),
    onDragStart: (e) => startDrag(p, e),
    onDragEnd: endDrag,
    dragHandleProps: handleProps(p),
    dragging: dragId === p.id,
    moving: moving === p.id,
  });

  // Visual Grid: chronological day groups, each a drop target.
  const gridGroups = useMemo(() => {
    const keys = Object.keys(byDate).sort();
    return keys.map((k) => ({ key: k, date: new Date(`${k}T00:00:00`), items: byDate[k] }));
  }, [byDate]);

  return (
    <div className="space-y-4">
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>

      <HowThisWorks
        steps={[
          'Switch between Visual Grid, Month, Week and Day with the view buttons, and use the arrows to move through time.',
          'Tap any card to open that post on its own page.',
          'Press and hold a card’s grip handle, then drag it onto another day to reschedule it.',
          'Use the plus on a day to start a new post already set to that date.',
        ]}
        note="Published posts stay fixed where they are, and every post needs a real graphic or video before it can be approved, scheduled, shared or published."
      />

      <div className="space-y-2">
        <CalendarToolbar
          views={VIEWS}
          view={view}
          setView={setView}
          label={label}
          onMove={move}
          onToday={() => setCursor(new Date())}
          cursorDate={dateKey(cursor)}
          onJumpToDate={(k) => k && setCursor(new Date(`${k}T00:00:00`))}
          filters={filters}
          setFilters={setFilters}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeFilterCount={activeFilterCount}
          unscheduledCount={unscheduled.length}
          showQueue={showQueue}
          setShowQueue={setShowQueue}
          posts={filtered}
          timezone={timezone}
          timezoneShort={shortTimezone(timezone)}
        />
        {showFilters && (
          <CalendarFiltersPanel
            filters={filters}
            setFilters={setFilters}
            campaigns={campaigns}
            projects={projects}
            activeCount={activeFilterCount}
            onClear={() => setFilters({ ...EMPTY_FILTERS, q: filters.q })}
          />
        )}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          {/* Visual Grid */}
          {view === 'grid' && (
            <div className="space-y-5">
              {dragId && <CalendarDropRail overKey={overKey} dropHandlers={dropHandlers} />}
              {gridGroups.map((g) => {
                const isOver = overKey === g.key && dragId;
                return (
                  <section
                    key={g.key}
                    data-date={g.key}
                    {...dropHandlers(g.key)}
                    className={`rounded-2xl p-2 sm:p-3 transition-colors ${isOver ? 'bg-primary/10 ring-1 ring-primary/50' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-semibold">
                        {g.date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        {g.key === todayKey && <span className="ml-2 text-xs text-primary">today</span>}
                      </h2>
                      <Button variant="ghost" size="sm" onClick={() => addSlot(g.key)} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
                    </div>
                    <VisualCardGrid>
                      {g.items.map((p) => <VisualGridCard key={p.id} {...cardProps(p)} />)}
                    </VisualCardGrid>
                  </section>
                );
              })}
              {!gridGroups.length && (
                <p className="text-sm text-muted-foreground text-center py-10">No scheduled posts match these filters.</p>
              )}
            </div>
          )}

          {/* Month */}
          {view === 'month' && (
            <div className="glass rounded-2xl p-2 sm:p-3 overflow-x-auto">
              <div className="grid grid-cols-7 gap-1 min-w-[640px]">
                {DOW.map((d) => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
                {days.map((d) => {
                  const key = dateKey(d);
                  const inMonth = d.getMonth() === cursor.getMonth();
                  const dayPosts = byDate[key] || [];
                  const isOver = overKey === key && dragId;
                  return (
                    <div
                      key={key}
                      data-date={key}
                      {...dropHandlers(key)}
                      className={`group min-h-[88px] rounded-lg border p-1 transition-colors ${inMonth ? 'border-border/40 bg-card/40' : 'border-transparent bg-muted/20 opacity-50'} ${key === todayKey ? 'ring-1 ring-primary' : ''} ${isOver ? 'border-primary bg-primary/10 ring-1 ring-primary/50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground px-1">{d.getDate()}</span>
                        <button type="button" onClick={() => addSlot(key)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary" title="Add post" aria-label={`Add a post on ${key}`}>
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1 mt-1">
                        {dayPosts.slice(0, 4).map((p) => (
                           <PostChip
                             key={p.id}
                             post={p}
                             clips={clips}
                             view="month"
                             dragging={dragId === p.id}
                             moving={moving === p.id}
                             draggable={!isLocked(p)}
                             onDragStart={(e) => startDrag(p, e)}
                             onDragEnd={endDrag}
                             dragHandleProps={handleProps(p)}
                             onClick={() => openPost(p)}
                             onDelete={() => setDeleting(p)}
                             onMove={(post) => setMovingPost(post)}
                           />
                         ))}
                        {dayPosts.length > 4 && <p className="text-[10px] text-muted-foreground px-1">+{dayPosts.length - 4} more</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week */}
          {view === 'week' && (
            <div className="glass rounded-2xl p-2 sm:p-3 overflow-x-auto">
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                {days.map((d, i) => {
                  const key = dateKey(d);
                  const dayPosts = byDate[key] || [];
                  const isOver = overKey === key && dragId;
                  return (
                    <div
                      key={key}
                      data-date={key}
                      {...dropHandlers(key)}
                      className={`group min-w-0 rounded-lg border p-2 transition-colors border-border/40 bg-card/40 ${key === todayKey ? 'ring-1 ring-primary' : ''} ${isOver ? 'border-primary bg-primary/10 ring-1 ring-primary/50' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{DOW[i]}</div>
                          <div className="text-sm font-semibold">{d.getDate()}</div>
                        </div>
                        <button type="button" onClick={() => addSlot(key)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary" title="Add post" aria-label={`Add a post on ${key}`}>
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {dayPosts.map((p) => (
                          <PostChip
                            key={p.id}
                            post={p}
                            clips={clips}
                            view="week"
                            dragging={dragId === p.id}
                            moving={moving === p.id}
                            draggable={!isLocked(p)}
                            onDragStart={(e) => startDrag(p, e)}
                            onDragEnd={endDrag}
                            dragHandleProps={handleProps(p)}
                            onClick={() => openPost(p)}
                            onDelete={() => setDeleting(p)}
                            onMove={(post) => setMovingPost(post)}
                          />
                        ))}
                        {dayPosts.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">No posts</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day */}
          {view === 'day' && (() => {
            const key = dateKey(cursor);
            const dayPosts = byDate[key] || [];
            const isOver = overKey === key && dragId;
            return (
              <div
                data-date={key}
                {...dropHandlers(key)}
                className={`glass rounded-2xl p-3 space-y-3 ${isOver ? 'ring-1 ring-primary/50 bg-primary/5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{dayPosts.length} post{dayPosts.length === 1 ? '' : 's'} scheduled</h2>
                  <Button variant="ghost" size="sm" onClick={() => addSlot(key)} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
                </div>
                <VisualCardGrid>
                  {dayPosts.map((p) => <VisualGridCard key={p.id} {...cardProps(p)} />)}
                </VisualCardGrid>
                {!dayPosts.length && <p className="text-sm text-muted-foreground text-center py-8">Nothing scheduled for this day.</p>}
              </div>
            );
          })()}

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {POST_STATUSES.map((s) => <span key={s} className={`px-2 py-0.5 rounded-full ${STATUS_STYLES[s] || 'bg-muted'}`}>{s}</span>)}
          </div>
        </div>

        {/* Unscheduled queue: sidebar on desktop, toggled panel on mobile */}
        <div className={`${showQueue ? 'block' : 'hidden'} xl:block`}>
          <UnscheduledQueue
            posts={unscheduled}
            clips={clips}
            campaignName={campaignName}
            projectTitle={projectTitle}
            onOpen={(p) => openPost(p)}
            onMove={(p) => setMovingPost(p)}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            dragHandleProps={handleProps}
            dragId={dragId}
          />
        </div>
      </div>

      <MovePostDialog
        post={movingPost}
        open={!!movingPost}
        onOpenChange={(o) => !o && setMovingPost(null)}
        timezone={timezone}
        onMove={(patch) => reschedule(movingPost, patch)}
      />
      {review && (
        <FinalReviewDialog
          post={review.post}
          clips={clips}
          platforms={review.platforms}
          open={!!review}
          onOpenChange={(o) => !o && setReview(null)}
          onEdit={(p) => openPost(p)}
          campaignName={campaignName(review.post)}
          projectTitle={projectTitle(review.post)}
          timezone={timezone}
        />
      )}
      <PostShareDialog
        post={sharing}
        clips={clips}
        open={!!sharing}
        onOpenChange={(o) => !o && setSharing(null)}
        brandProfile={brandProfile}
        shareUrl={postShareUrl(sharing)}
        onManual={(p, platformId) => { setSharing(null); setManual({ post: p, platformId }); }}
      />
      <ManualShareDialog
        post={manual?.post}
        clips={clips}
        brandProfile={brandProfile}
        platformId={manual?.platformId}
        open={!!manual}
        onOpenChange={(o) => !o && setManual(null)}
        shareUrl={postShareUrl(manual?.post)}
        onMarkPosted={(platformId) => { const p = manual?.post; setManual(null); setMarkPosted({ post: p, platformId }); }}
      />
      <DeletePostDialog
        post={deleting}
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      />
      <MarkPostedManuallyDialog
        post={markPosted?.post}
        defaultPlatformId={markPosted?.platformId}
        open={!!markPosted}
        onOpenChange={(o) => !o && setMarkPosted(null)}
      />
    </div>
  );
}