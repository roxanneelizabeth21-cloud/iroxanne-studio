import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import MetaPixelTracker from '@/components/MetaPixelTracker';
import PageVisitTracker from '@/components/PageVisitTracker';
import RouteHistoryTracker from '@/components/RouteHistoryTracker';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import { AudioPlayerProvider } from '@/context/AudioPlayerContext';
import Home from '@/pages/Home';
import Music from '@/pages/Music';
import Videos from '@/pages/Videos';
import About from '@/pages/About';
import Gallery from '@/pages/Gallery';
import Store from '@/pages/Store';
import Shop from '@/pages/Shop';
import Contact from '@/pages/Contact';
import PressKit from '@/pages/PressKit';
import AdminGuard from '@/components/AdminGuard';
import AdminMusicLinks from '@/pages/AdminMusicLinks';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import HomepageAdminPage from '@/pages/admin/HomepageAdminPage';
import MusicAdminPage from '@/pages/admin/MusicAdminPage';
import VideosAdminPage from '@/pages/admin/VideosAdminPage';
import GalleryAdminPage from '@/pages/admin/GalleryAdminPage';
import BioAdminPage from '@/pages/admin/BioAdminPage';
import SitePageVisibility from '@/pages/admin/SitePageVisibility';
import BannersAdminPage from '@/pages/admin/BannersAdminPage';
import VisitorsAdminPage from '@/pages/admin/VisitorsAdminPage';
import SubscribersAdminPage from '@/pages/admin/SubscribersAdminPage';
import MessagesAdminPage from '@/pages/admin/MessagesAdminPage';
import LegalAdminPage from '@/pages/admin/LegalAdminPage';
import EmailTemplatesAdminPage from '@/pages/admin/EmailTemplatesAdminPage';
import PromoBannersAdminPage from '@/pages/admin/PromoBannersAdminPage';
import SongsAdminPage from '@/pages/admin/SongsAdminPage';
import LyricsExportPage from '@/pages/admin/LyricsExportPage';
import ArtistLinksAdminPage from '@/pages/admin/ArtistLinksAdminPage';
import ReleaseLanding from '@/pages/ReleaseLanding';
import CapturePage from '@/pages/CapturePage';
import LegalPage from '@/pages/LegalPage';
import Unsubscribe from '@/pages/Unsubscribe';
import MarketingHub from '@/pages/marketing/MarketingHub';
import CampaignBuilder from '@/pages/marketing/CampaignBuilder';
import ContentCalendar from '@/pages/marketing/ContentCalendar';
import ContentLibrary from '@/pages/marketing/ContentLibrary';
import MarketingPerformance from '@/pages/marketing/MarketingPerformance';
import BrandProfile from '@/pages/marketing/BrandProfile';
import Templates from '@/pages/marketing/Templates';
import ClipLibrary from '@/pages/marketing/ClipLibrary';
import Today from '@/pages/marketing/Today';
import MediaLibrary from '@/pages/marketing/MediaLibrary';
import AlbumCanvasStudio from '@/pages/marketing/AlbumCanvasStudio';
import CarouselAds from '@/pages/marketing/CarouselAds';
import MetaAds from '@/pages/marketing/MetaAds';
import CreatePost from '@/pages/marketing/CreatePost';
import CreateReel from '@/pages/marketing/CreateReel';
import PostEditor from '@/pages/marketing/PostEditor';
import SongProfiles from '@/pages/marketing/SongProfiles';
import AutomationControls from '@/pages/marketing/AutomationControls';
import SocialMarketer from '@/pages/marketing/SocialMarketer';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Trigger the login redirect as an effect (not during render) and throttle
  // it so an installed PWA whose auth roundtrip doesn't deliver a token can't
  // get stuck in a redirect loop.
  useEffect(() => {
    if (authError?.type !== 'auth_required') return;
    const key = 'roxsan_login_redirect_ts';
    const now = Date.now();
    const last = Number(sessionStorage.getItem(key) || 0);
    if (now - last < 10000) return; // within 10s = loop; stop hammering
    sessionStorage.setItem(key, String(now));
    navigateToLogin();
  }, [authError, navigateToLogin]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      );
    }
  }

  return (
    <>
      <MetaPixelTracker />
      <PageVisitTracker />
      <RouteHistoryTracker />
      <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/music" element={<Music />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/about" element={<About />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/store" element={<Store />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/press" element={<PressKit />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/terms" element={<LegalPage />} />
        <Route path="/MusicAdmin" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/homepage" element={<HomepageAdminPage />} />
        <Route path="/admin/music" element={<MusicAdminPage />} />
        <Route path="/admin/songs" element={<SongsAdminPage />} />
        <Route path="/admin/artist-links" element={<ArtistLinksAdminPage />} />
        <Route path="/admin/music-links" element={<AdminMusicLinks />} />
        <Route path="/admin/videos" element={<VideosAdminPage />} />
        <Route path="/admin/gallery" element={<GalleryAdminPage />} />
        <Route path="/admin/bio" element={<BioAdminPage />} />
        <Route path="/admin/pages" element={<SitePageVisibility />} />
        <Route path="/admin/banners" element={<BannersAdminPage />} />
        <Route path="/admin/visitors" element={<VisitorsAdminPage />} />
        <Route path="/admin/subscribers" element={<SubscribersAdminPage />} />
        <Route path="/admin/messages" element={<MessagesAdminPage />} />
        <Route path="/admin/legal" element={<LegalAdminPage />} />
        <Route path="/admin/email-templates" element={<EmailTemplatesAdminPage />} />
        <Route path="/admin/promo-banners" element={<PromoBannersAdminPage />} />
        <Route path="/admin/lyrics-export" element={<LyricsExportPage />} />
        <Route path="/AdminMusicLinks" element={<Navigate to="/admin/music-links" replace />} />
        <Route path="/marketing" element={<MarketingHub />} />
        <Route path="/marketing/today" element={<Today />} />
        <Route path="/marketing/controls" element={<AutomationControls />} />
        <Route path="/marketing/media" element={<MediaLibrary />} />
        <Route path="/marketing/canvas" element={<AlbumCanvasStudio />} />
        <Route path="/marketing/carousel-ads" element={<CarouselAds />} />
        <Route path="/marketing/meta-ads" element={<MetaAds />} />
        <Route path="/marketing/hub" element={<Navigate to="/marketing" replace />} />
        <Route path="/marketing/post" element={<CreatePost />} />
        <Route path="/marketing/reel" element={<CreateReel />} />
        <Route path="/marketing/quick" element={<Navigate to="/marketing/post" replace />} />
        <Route path="/marketing/campaigns" element={<CampaignBuilder />} />
        <Route path="/marketing/campaigns/:id" element={<CampaignBuilder />} />
        <Route path="/marketing/calendar" element={<ContentCalendar />} />
        <Route path="/marketing/post/:id" element={<PostEditor />} />
        <Route path="/marketing/library" element={<ContentLibrary />} />
        <Route path="/marketing/performance" element={<MarketingPerformance />} />
        <Route path="/marketing/brand" element={<BrandProfile />} />
        <Route path="/marketing/templates" element={<Templates />} />
        <Route path="/marketing/clips" element={<ClipLibrary />} />
        <Route path="/marketing/strategist" element={<SocialMarketer />} />
        <Route path="/marketing/SocialMarketer" element={<Navigate to="/marketing/strategist" replace />} />
        <Route path="/marketing/songs" element={<Navigate to="/admin/songs" replace />} />
        <Route path="/marketing/Today" element={<Navigate to="/marketing/today" replace />} />
        <Route path="/marketing/MarketingHub" element={<Navigate to="/marketing" replace />} />
        <Route path="/marketing/QuickCreate" element={<Navigate to="/marketing/quick" replace />} />
        <Route path="/marketing/CampaignBuilder" element={<Navigate to="/marketing/campaigns" replace />} />
        <Route path="/marketing/ContentCalendar" element={<Navigate to="/marketing/calendar" replace />} />
        <Route path="/marketing/ContentLibrary" element={<Navigate to="/marketing/library" replace />} />
        <Route path="/marketing/MarketingPerformance" element={<Navigate to="/marketing/performance" replace />} />
        <Route path="/marketing/BrandProfile" element={<Navigate to="/marketing/brand" replace />} />
        <Route path="/marketing/Templates" element={<Navigate to="/marketing/templates" replace />} />
        <Route path="/marketing/ClipLibrary" element={<Navigate to="/marketing/clips" replace />} />
      </Route>
      <Route path="/release/:slug" element={<ReleaseLanding />} />
      <Route path="/go/:slug" element={<CapturePage />} />
      <Route path="/unsubscribe" element={<Unsubscribe />} />
      <Route path="/CountrySpiceAlbum" element={<Navigate to="/release/island-soul-country-heart" replace />} />
      <Route path="/DontGetItTwistedAlbum" element={<Navigate to="/release/dont-get-it-twisted" replace />} />
      <Route path="/YouDontKnowRoxanneSingle" element={<Navigate to="/release/you-dont-know-roxanne" replace />} />
      <Route path="/SomeDayOneDayMaybe" element={<Navigate to="/release/some-day-one-day-maybe" replace />} />
      <Route path="/ThoseOldHymns" element={<Navigate to="/release/those-old-hymns" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AudioPlayerProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </AudioPlayerProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App