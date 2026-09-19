import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronLeft } from 'lucide-react';
import ViewSwitcher from './ViewSwitcher';
import MarketingSidebar from './MarketingSidebar';
import BusinessSidebar from './BusinessSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from './NotificationBell';
import StrategistHeaderButton from './StrategistHeaderButton';
import MarketingBackButton from '@/components/marketing/MarketingBackButton';
import { LayoutDashboard, PenLine, Palette, Clapperboard, Megaphone, CalendarDays, Library, Image, BarChart3, LayoutTemplate, ToggleLeft, UserCircle, Bot } from 'lucide-react';
import './admin-views.css';

const MARKETING_HEADERS = [
  { to: '/marketing', label: 'Marketing', Icon: LayoutDashboard, end: true, subtitle: undefined },
  { to: '/marketing/post', label: 'Create a Post', Icon: PenLine, subtitle: 'Pick a project, add media, create the copy, and decide when to share it.' },
  { to: '/marketing/cards', label: 'Card Studio', Icon: Palette, subtitle: 'Ads and cards with Sam. Download a PNG or build a reel.' },
  { to: '/marketing/reel', label: 'Create a Reel', Icon: Clapperboard, subtitle: 'Build a short vertical video from your clips.' },
  { to: '/marketing/campaigns', label: 'Campaigns', Icon: Megaphone, subtitle: 'Plan and manage campaigns' },
  { to: '/marketing/calendar', label: 'Content Calendar', Icon: CalendarDays, subtitle: 'Review, schedule and publish your content' },
  { to: '/marketing/library', label: 'All Posts', Icon: Library, subtitle: 'Every post you have created — search, filter and edit' },
  { to: '/marketing/media', label: 'Media Library', Icon: Image, subtitle: 'Reusable graphics and videos' },
  { to: '/marketing/canvas', label: 'Case Study Canvas', Icon: Palette, subtitle: 'Pick a portfolio project, design the card, and save it.' },
  { to: '/marketing/carousel-ads', label: 'Carousel Ads', Icon: Megaphone, subtitle: 'Paid Meta carousel ads for your portfolio projects' },
  { to: '/marketing/meta-ads', label: 'Meta Ads', Icon: BarChart3, subtitle: 'Every ad in your Meta ad accounts and how it is doing' },
  { to: '/marketing/templates', label: 'Templates', Icon: LayoutTemplate, subtitle: 'Reusable content templates' },
  { to: '/marketing/clips', label: 'Clips', Icon: Clapperboard, subtitle: 'Short videos ready to use in posts' },
  { to: '/marketing/controls', label: 'Automation Controls', Icon: ToggleLeft, subtitle: 'Switch campaigns and project rotation on or off in one place' },
  { to: '/marketing/brand', label: 'Brand', Icon: UserCircle, subtitle: 'Brand profile, voice and connections' },
  { to: '/marketing/strategist', label: 'Strategist', Icon: Bot, subtitle: 'Chat with your marketing agent' },
  { to: '/marketing/performance', label: 'Performance', Icon: BarChart3, subtitle: 'Post and campaign analytics' },
];

function useMarketingHeader(pathname) {
  if (!pathname.startsWith('/marketing')) return null;
  const match = MARKETING_HEADERS.find((m) =>
    m.end ? pathname === m.to : pathname === m.to || pathname.startsWith(`${m.to}/`)
  );
  return match || null;
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMarketing = location.pathname.startsWith('/marketing');
  const mktHeader = useMarketingHeader(location.pathname);
  const showAdminBack = location.pathname !== '/admin' && location.pathname !== '/marketing';

  useEffect(() => {
    document.body.classList.toggle('studio-admin-theme', location.pathname.startsWith('/admin'));
    return () => document.body.classList.remove('studio-admin-theme');
  }, [location.pathname]);

  const Sidebar = isMarketing ? MarketingSidebar : BusinessSidebar;
  const mobileTitle = isMarketing ? 'Marketing Studio' : 'Business Manager';

  return (
    <div className="min-h-screen flex bg-background">
      <ViewSwitcher />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile slide-out */}
      {mobileOpen && (
        <div className="lg:hidden irx-mobile-drawer">
          <div className="irx-backdrop" onClick={() => setMobileOpen(false)} />
          <aside className="irx-panel">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header
          className="lg:hidden border-b border-border/40 bg-sidebar sticky top-11 z-20"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-1">
              <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-secondary/50 transition-colors no-select" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
              {showAdminBack && (
                <button
                  onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(isMarketing ? '/marketing' : '/admin'))}
                  className="p-2 rounded-lg hover:bg-secondary/50 transition-colors no-select"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
            </div>
            <span className="font-display font-semibold text-sm">{mobileTitle}</span>
            <div className="flex items-center gap-1">
              <ThemeToggle /><NotificationBell />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl w-full mx-auto">
          {mktHeader && location.pathname !== '/marketing' && (
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}