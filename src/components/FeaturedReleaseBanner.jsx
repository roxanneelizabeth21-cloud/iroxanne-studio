import { motion } from 'framer-motion';
import { Music, Star, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import ShareButton from '@/components/ShareButton';
import TrackList from '@/components/TrackList';
import PlatformLogo from '@/components/release-landing/PlatformLogo';

export default function FeaturedReleaseBanner({ release, tracks }) {
  const { playTrack, currentTrack, isPlaying } = useAudioPlayer();
  if (!release) return null;

  const isActive = currentTrack?.id === release.id;

  const handlePlay = () => {
    playTrack({
      id: release.id,
      title: release.title,
      cover_image: release.cover_image,
      audio_snippet: release.audio_snippet || release.full_audio_file || null,
      preview_url: release.preview_url || null,
      snippet_start: release.snippet_start || 0,
      snippet_end: release.snippet_end || null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden rounded-2xl glass glow-blue"
    >
      <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
        <div className="w-full max-w-56 mx-auto md:w-48 lg:w-56 md:max-w-none shrink-0">
          <div className="aspect-square rounded-xl overflow-hidden glow-blue-sm relative group cursor-pointer" onClick={handlePlay}>
            {release.cover_image ? (
              <img src={release.cover_image} alt={release.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Music className="h-16 w-16 text-primary/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isActive ? 'bg-primary' : 'bg-black/60'}`}>
                {isActive && isPlaying
                  ? <Pause className="h-7 w-7 text-white fill-white" />
                  : <Play className="h-7 w-7 text-white fill-white ml-1" />
                }
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Star className="h-3 w-3" /> Featured Release
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2">{release.title}</h2>
          {release.description && (
            <p className="text-muted-foreground text-sm mb-5 max-w-lg leading-relaxed">{release.description}</p>
          )}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            <Button
              size="sm"
              variant={isActive && isPlaying ? 'secondary' : 'default'}
              className="gap-2 glow-blue-sm"
              onClick={handlePlay}
            >
              {isActive && isPlaying
                ? <><Pause className="h-4 w-4 fill-current" /> Pause Preview</>
                : <><Play className="h-4 w-4 fill-current ml-0.5" /> Play Preview</>
              }
            </Button>
            {release.spotify_url && (
              <a href={release.spotify_url.startsWith('http') ? release.spotify_url : `https://${release.spotify_url}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="glow-blue-sm gap-2">
                  <PlatformLogo platformType="spotify" className="h-4 w-4" /> Spotify
                </Button>
              </a>
            )}
            {release.apple_music_url && (
              <a href={release.apple_music_url.startsWith('http') ? release.apple_music_url : `https://${release.apple_music_url}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 border-border/50">
                  <PlatformLogo platformType="apple_music" className="h-3.5 w-3.5" /> Apple Music
                </Button>
              </a>
            )}
            {release.youtube_url && (
              <a href={release.youtube_url.startsWith('http') ? release.youtube_url : `https://${release.youtube_url}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2 border-border/50">
                  <PlatformLogo platformType="youtube" className="h-3.5 w-3.5" /> YouTube
                </Button>
              </a>
            )}
            <ShareButton release={release} />
          </div>
          {tracks && tracks.length > 0 && (
            <div className="mt-6 text-left">
              <TrackList tracks={tracks} release={release} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}