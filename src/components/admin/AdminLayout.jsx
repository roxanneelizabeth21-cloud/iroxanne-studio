import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Image, LayoutDashboard, Eye, Mail, MessageSquare, ScrollText, FileText,
  Megaphone, Bot, ArrowLeft, ChevronLeft, Menu, Sun, PenLine, LayoutTemplate, CalendarDays, Library, Clapperboard, BarChart3, UserCircle, ChevronDown, Palette, ToggleLeft, Receipt, FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationBell from './NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import BrandLogo from '@/components/BrandLogo';
import StrategistHeaderButton from './StrategistHeaderButton';
import MarketingBackButton from '@/components/marketing/MarketingBackButton';

// Client work has exactly one front door: Projects. Every project card there
// states its own next step and links through to the page where that step
// happens, so there's never a choice to make about where to start.
const NAV_TOP = [
  { to: '/admin', label: 'Overview', Icon: Home, end: true },
  { to: '/admin/projects', label: 'Projects', Icon: FolderKanban, subtitle: 'Every client, and the one thing to do next' },
  { to: '/admin/homepage', label: 'Homepage', Icon: LayoutDashboard },
  { to: '/admin/portfolio', label: 'Portfolio', Icon: LayoutDashboard },
  { to: '/admin/testimonials', label: 'Testimonials', Icon: MessageSquare },
];

// Reached from a project card in the normal flow. Listed here so they stay
// findable, but they're stage 2 — not places to start a working session.
const NAV_CLIENT_DETAIL = [
  { to: '/admin/proposals', label: 'Quotes & Proposals', Icon: FileText },
  { to: '/admin/contracts', label: 'Contracts', Icon: FileText },
  { to: '/admin/invoices', label: 'Invoices', Icon: Receipt },
  { to: '/admin/call-availability', label: 'Call availability', Icon: CalendarDays },
];

const NAV_REST = [
  { to: '/admin/pages', label: 'Pages', Icon: LayoutDashboard },
  { to: '/admin/banners', label: 'Banners', Icon: Image },
  { to: '/admin/promo-banners', label: 'Promo Banners', Icon: Megaphone },
  { to: '/admin/visitors', label: 'Visitors', Icon: Eye },
  { to: '/admin/subscribers', label: 'Subscribers', Icon: Mail },
  { to: '/admin/messages', label: 'Messages', Icon: MessageSquare },
  { to: '/admin/email-templates', label: 'Email Templates', Icon: Mail },
  { to: '/admin/legal', label: 'Legal', Icon: ScrollText },
];

const MARKETING_ALL = [
  { to: '/marketing', label: 'Marketing', Icon: LayoutDashboard, end: true },
  { to: '/marketing/post', label: 'Create a Post', Icon: PenLine, subtitle: 'Pick a project, add media, create the copy, and decide when to share it.' },
  { to: '/marketing/campaigns', label: 'Campaigns', Icon: Megaphone, subtitle: 'Plan and manage campaigns' },
  { to: '/marketing/calendar', label: 'Content Calendar', Icon: CalendarDays, subtitle: 'Review, schedule and publish your content' },
  { to: '/marketing/library', label: 'All Posts', Icon: Library, subtitle: 'Every post you have created — search, filter and edit' },
  { to: '/marketing/media', label: 'Media Library', Icon: Image, subtitle: 'Reusable graphics and videos' },
  { to: '/marketing/canvas', label: 'Case Study Canvas', Icon: Palette, subtitle: 'Pick a portfolio project, design the card, and save it.' },
  { to: '/marketing/carousel-ads', label: 'Carousel Ads', Icon: Megaphone, subtitle: 'Paid Meta carousel ads for your portfolio projects' },
  { to: '/marketing/meta-ads', label: 'All Meta Ads', Icon: BarChart3, subtitle: 'Every ad in your Meta ad accounts and how it is doing' },
  { to: '/marketing/templates', label: 'Templates', Icon: LayoutTemplate, subtitle: 'Reusable content templates' },
  { to: '/marketing/clips', label: 'Clips', Icon: Clapperboard, subtitle: 'Short videos ready to use in posts' },
  { to: '/marketing/controls', label: 'Automation Controls', Icon: ToggleLeft, subtitle: 'Switch campaigns and project rotation on or off in one place' },
  { to: '/marketing/brand', label: 'Brand', Icon: UserCircle, subtitle: 'Brand profile, voice and connections' },
];

const MARKETING_NAV = MARKETING_ALL.filter(item => ['/marketing', '/marketing/post', '/marketing/media', '/marketing/brand'].includes(item.to));

// Pages kept for existing links and workflows, but no longer primary destinations.
const MARKETING_SECONDARY = [
  ...MARKETING_ALL.filter(item => !MARKETING_NAV.includes(item)),
  { to: '/marketing/strategist', label: 'Strategist', Icon: Bot, subtitle: 'Chat with your marketing agent' },
  { to: '/marketing/today', label: 'Today', Icon: Sun, subtitle: "Today's posts and daily workflow" },
  { to: '/marketing/performance', label: 'Performance', Icon: BarChart3, subtitle: 'Post and campaign analytics' },
];

function useMarketingHeader(pathname) {
  if (!pathname.startsWith('/marketing')) return null;
  const all = [...MARKETING_SECONDARY, ...MARKETING_NAV];
  const match = all.find((m) => (m.end ? pathname === m.to : pathname === m.to || pathname.startsWith(`${m.to}/`)));
  return match || null;
}

function SidebarContent({ onNavigate }) {
  const location = useLocation();
  const onMarketing = location.pathname.startsWith('/marketing');
  const [marketingOpen, setMarketingOpen] = useState(onMarketing);
  useEffect(() => { if (onMarketing) setMarketingOpen(true); }, [onMarketing]);
  return (
    <div className="flex flex-col h-full">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-4 h-16 border-b border-border/40 shrink-0 hover:bg-secondary/40 transition-colors">
        <BrandLogo className="h-9 w-9" />
        <span className="font-display text-lg font-semibold">Admin</span>
      </Link>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Inbox</span>
        <ThemeToggle /><NotificationBell />
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_TOP.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/20 text-foreground font-semibold' : 'text-foreground hover:text-foreground hover:bg-secondary/50'}`}
          >
            <n.Icon className="h-4 w-4 shrink-0" /> {n.label}
          </NavLink>
        ))}

        {/* Client detail pages — grouped and set back, since the normal route in
            is clicking a project card rather than starting here. */}
        <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Client documents
        </p>
        {NAV_CLIENT_DETAIL.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) => `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors ${isActive ? 'bg-primary/20 text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
          >
            <n.Icon className="h-3.5 w-3.5 shrink-0" /> {n.label}
          </NavLink>
        ))}

        <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Site
        </p>
        {NAV_REST.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/20 text-foreground font-semibold' : 'text-foreground hover:text-foreground hover:bg-secondary/50'}`}
          >
            <n.Icon className="h-4 w-4 shrink-0" /> {n.label}
          </NavLink>
        ))}

        <div className="pt-3 relative">
          <button
            onClick={() => setMarketingOpen((v) => !v)}
            className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-xs uppercase tracking-wider text-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-expanded={marketingOpen}
          >
            <Megaphone className="h-4 w-4 shrink-0" /> Marketing
          </button>
          <button
            onClick={() => setMarketingOpen((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label={marketingOpen ? 'Collapse marketing' : 'Expand marketing'}
          >
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', marketingOpen && 'rotate-180')} />
          </button>
          {marketingOpen && (
            <div className="mt-0.5 space-y-0.5">
              {MARKETING_NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  onClick={onNavigate}
                  className={({ isActive }) => `flex items-center gap-2.5 pl-8 pr-3 py-1.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary/20 text-foreground font-semibold' : 'text-foreground hover:text-foreground hover:bg-secondary/50'}`}
                >
                  <n.Icon className="h-3.5 w-3.5 shrink-0" /> {n.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="border-t border-border/40 p-2 space-y-0.5 shrink-0">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <ArrowLeft className="h-4 w-4 shrink-0" /> Back to site
        </Link>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mktHeader = useMarketingHeader(location.pathname);
  const showAdminBack = location.pathname !== '/admin';
  useEffect(() => {
    document.body.classList.toggle('studio-admin-theme', location.pathname.startsWith('/admin'));
    return () => document.body.classList.remove('studio-admin-theme');
  }, [location.pathname]);


  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-border/40 bg-sidebar flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-64 bg-sidebar border-r border-border/40 flex flex-col">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-60 min-w-0 flex flex-col">
        <header
          className="lg:hidden border-b border-border/40 bg-sidebar sticky top-0 z-20"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-1">
            <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-secondary/50 transition-colors no-select" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            {showAdminBack && (
              <button
                onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/admin'))}
                className="p-2 rounded-lg hover:bg-secondary/50 transition-colors no-select"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>
          <span className="font-display font-semibold">Admin</span>
          <div className="flex items-center gap-1">
            <ThemeToggle /><NotificationBell />
          </div>
          </div>
        </header>
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl w-full mx-auto">
          {mktHeader && (
            <div className="relative mb-6 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <MarketingBackButton />
                <div className="min-w-0">
                <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                  <mktHeader.Icon className="h-5 w-5 text-primary" /> {mktHeader.label}
                </h1>
                {mktHeader.subtitle && <p className="text-sm text-muted-foreground mt-1">{mktHeader.subtitle}</p>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <StrategistHeaderButton />
              </div>
            </div>
          )}
          {location.pathname.startsWith('/admin') && <nav aria-label="Client workflow" className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-border">{[['/admin','Overview'],['/admin/proposals','Inquiries & proposals'],['/admin/call-availability','Calls'],['/admin/contracts','Agreements'],['/admin/projects','Projects & intakes'],['/admin/invoices','Payments'],['/marketing','Marketing']].map(([to,label])=><NavLink key={to} to={to} end={to==='/admin'} className={({isActive})=>'whitespace-nowrap rounded-full px-4 py-2 text-sm '+(isActive?'bg-primary text-primary-foreground':'bg-secondary text-foreground hover:bg-accent')}>{label}</NavLink>)}</nav>}
          {location.pathname.startsWith('/marketing') && <nav aria-label="Marketing workflow" className="flex flex-wrap gap-2 mb-5 border-b border-border pb-3">
            {[['/marketing','Planner'],['/marketing/post','Create a post'],['/marketing/media','Media'],['/marketing/performance','Results'],['/marketing/controls','Settings']].map(([to,label]) =>
              <NavLink key={to} to={to} end className={({isActive}) => 'rounded-full px-4 py-2 text-sm ' + (isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-accent')}>{label}</NavLink>)}
          </nav>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}