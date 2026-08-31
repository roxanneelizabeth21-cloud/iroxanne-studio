import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronLeft, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import BrandLogo from '@/components/BrandLogo';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const ALL_LINKS = [
{ to: '/', label: 'Home', settingKey: null },
{ to: '/music', label: 'Music', settingKey: 'page_music_enabled' },
{ to: '/videos', label: 'Videos', settingKey: 'page_videos_enabled' },
{ to: '/about', label: 'About', settingKey: 'page_about_enabled' },
{ to: '/gallery', label: 'Gallery', settingKey: 'page_gallery_enabled' },
{ to: '/store', label: 'Store', settingKey: 'page_store_enabled' },
{ to: '/shop', label: 'Shop', settingKey: null, Icon: ShoppingBag },
{ to: '/contact', label: 'Contact', settingKey: 'page_contact_enabled' },
{ to: '/press', label: 'Press Kit', settingKey: 'page_press_enabled' },
{ to: '/admin', label: 'Admin', settingKey: null }];


const TOP_PATHS = new Set(['/', '/music', '/videos', '/about', '/gallery', '/store', '/shop', '/contact', '/press', '/admin']);

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const showBack = !TOP_PATHS.has(location.pathname);
  const onMusicPage = location.pathname === '/music' || location.pathname.startsWith('/release/');
  const [musicOpen, setMusicOpen] = useState(onMusicPage);
  useEffect(() => { if (onMusicPage) setMusicOpen(true); }, [onMusicPage]);

  const { data: siteSettingsRecords = [] } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => base44.entities.SiteSettings.list(),
    staleTime: 60_000
  });

  // Dynamic Music dropdown: release landing pages where show_in_nav is true,
  // ordered by nav_sort_order then title. Single source for the mobile nav menu.
  const { data: navReleases = [] } = useQuery({
    queryKey: ['music-releases-nav'],
    queryFn: () => base44.entities.MusicRelease.list('-created_date', 100),
    staleTime: 60_000
  });

  const settings = siteSettingsRecords[0] || {};

  const musicChildren = navReleases
    .filter((r) => r.is_active !== false && r.show_in_nav !== false)
    .sort((a, b) => (a.nav_sort_order ?? 0) - (b.nav_sort_order ?? 0) || a.title.localeCompare(b.title))
    .map((r) => ({ to: `/release/${r.slug}`, label: r.title }));

  const links = ALL_LINKS.filter((l) => {
    if (l.to === '/admin') return user?.role === 'admin';
    if (!l.settingKey) return true;
    return settings[l.settingKey] !== false;
  }).map((l) => (l.to === '/music' ? { ...l, children: musicChildren } : l));

  // Sign Out lives in the menu list (right under Contact) instead of the drawer
  // header, where it could be hidden behind the notch on installed PWAs. There is
  // no public Sign In entry: visitors never need an account, and the owner reaches
  // login by opening /admin directly.
  const contactIdx = links.findIndex((l) => l.to === '/contact');
  if (user && contactIdx >= 0) links.splice(contactIdx + 1, 0, { to: '__auth__', label: 'Sign Out' });

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-3 items-center h-12">
            {/* Left column: logo + back button */}
            <div className="flex items-center justify-start gap-1">
              <Link to="/" className="flex items-center">
                <BrandLogo className="h-10 w-10" />
              </Link>
              {showBack &&
              <button
                onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')}
                className="lg:hidden p-2 rounded-lg text-foreground hover:bg-secondary/50 transition-colors no-select"
                aria-label="Back">
                
                  <ChevronLeft className="h-5 w-5" />
                </button>
              }
            </div>

            {/* Center column: empty */}
            <div className="flex items-center justify-center" />

            {/* Right column: theme toggle + hamburger */}
            <div className="flex items-center justify-end gap-1">
              <ThemeToggle />
              <button
                onClick={() => setOpen(!open)}
                className="p-2 rounded-lg text-foreground hover:bg-secondary/50 transition-colors"
                aria-label="Toggle menu">
                
                {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60]">
          
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="dark absolute right-0 top-0 h-[100dvh] max-h-[100dvh] w-72 glass border-l border-border/40 flex flex-col overflow-hidden shadow-2xl"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
            
              <div className="flex items-center justify-end px-4 h-14 border-b border-border/40 shrink-0">
                <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-foreground hover:bg-secondary/50 transition-colors"
                aria-label="Close menu">
                
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-4 py-3 space-y-1 overflow-y-auto overscroll-contain flex-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                {links.map((l) => {
              const isAuth = l.to === '__auth__';
              return (
                <div key={l.to}>
                  {isAuth ? (
                    <button
                      onClick={() => { logout(false); setOpen(false); }}
                      className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                    >
                      {l.label}
                    </button>
                  ) : (
                    <div className="relative">
                      <Link
                        to={l.to}
                        onClick={() => setOpen(false)}
                        className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === l.to ?
                        'bg-primary/20 text-foreground font-semibold' :
                        'text-foreground/70 hover:text-foreground hover:bg-secondary/50'}`
                        }>
                        {l.label}
                      </Link>
                      {l.children && (
                        <button
                          onClick={() => setMusicOpen((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-secondary/50 transition-colors"
                          aria-label={musicOpen ? 'Collapse music' : 'Expand music'}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${musicOpen ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  )}
                  {l.children && musicOpen &&
                <div className="ml-4 pl-3 border-l border-border/40 space-y-0.5 mb-1">
                        {l.children.map((c) =>
                  <Link
                    key={c.to}
                    to={c.to}
                    onClick={() => setOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    location.pathname === c.to ?
                    'bg-primary/20 text-foreground font-semibold' :
                    'text-foreground/70 hover:text-foreground hover:bg-secondary/50'}`
                    }>
                    
                            {c.label}
                          </Link>
                  )}
                      </div>
                }
                </div>
              );
                })}
              </div>

            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </>);

}