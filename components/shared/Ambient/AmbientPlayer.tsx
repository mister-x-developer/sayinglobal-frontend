'use client';

import { useEffect, useRef } from 'react';
import { useAmbientStore, AMBIENT_TRACKS } from '@/lib/store/ambient';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers/ThemeProvider';

export function AmbientPlayer() {
  const { trackId, volume, isPlaying, showVideo } = useAmbientStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const track = AMBIENT_TRACKS[trackId];

  // Handle audio playback and volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying && track.audioUrl) {
        audioRef.current.play().catch(() => {
          // Autoplay policy might block it initially, handle gracefully
          console.warn('Audio autoplay blocked by browser');
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, track, volume]);

  // Theme hook
  const { mode } = useTheme();
  // Evaluate the actual theme
  const isDark = mode === 'night';

  if (trackId === 'none') return null;

  const currentVideoUrl = isDark && track.videoUrlNight ? track.videoUrlNight : (track.videoUrlDay || track.videoUrlNight);

  return (
    <>
      <audio
        ref={audioRef}
        src={track.audioUrl}
        loop
        playsInline
      />
      
      {/* Background Animated Video Overlay */}
      <AnimatePresence>
        {showVideo && currentVideoUrl && (
          <motion.div
            key={`${trackId}-${isDark ? 'night' : 'day'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: isDark ? 0.35 : 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 pointer-events-none z-[-10] overflow-hidden bg-black"
          >
            <video
              src={currentVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              style={{ filter: 'blur(2px) contrast(1.1) brightness(0.9)' }}
            />
            
            {/* Subtle overlay to blend it with the UI */}
            <div className={`absolute inset-0 ${isDark ? 'bg-bg/60' : 'bg-bg/40'}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
