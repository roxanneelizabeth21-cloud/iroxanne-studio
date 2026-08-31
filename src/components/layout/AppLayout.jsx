import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import GlobalAudioPlayer from '@/components/player/GlobalAudioPlayer';
import MobileBottomNav from './MobileBottomNav';
import VisitorCaptureCard from '@/components/VisitorCaptureCard';
import PublicRouteMeta from '@/components/PublicRouteMeta';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

function LayoutInner() {
  const { currentTrack } = useAudioPlayer();
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <PublicRouteMeta />
      <Navbar />
      <main
        className={`flex-1 ${currentTrack ? 'pb-40 lg:pb-20' : 'pb-28 lg:pb-0'}`}
        style={{ paddingTop: 'calc(3rem + env(safe-area-inset-top, 0px))' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <div className="h-24 lg:hidden" aria-hidden="true" />
      <GlobalAudioPlayer />
      <MobileBottomNav />
      <VisitorCaptureCard />
    </div>
  );
}

export default function AppLayout() {
  return <LayoutInner />;
}