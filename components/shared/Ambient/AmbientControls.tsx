'use client';

import { useState, useRef, useEffect } from 'react';
import { useAmbientStore, AMBIENT_TRACKS, AmbientTrackId } from '@/lib/store/ambient';
import { Volume2, VolumeX, MonitorPlay, MonitorOff, Play, Pause, Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function AmbientControls() {
  const t = useTranslations();
  const { 
    trackId, 
    volume, 
    isPlaying, 
    showVideo, 
    setTrack, 
    setVolume, 
    setShowVideo, 
    setIsPlaying,
    togglePlay
  } = useAmbientStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tracks = Object.values(AMBIENT_TRACKS);
  const activeTrack = AMBIENT_TRACKS[trackId];

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          isPlaying ? 'bg-brand-accent/10 text-brand-accent' : 'text-fg-subtle hover:bg-bg-subtle hover:text-fg'
        }`}
        title={t('ambient.zenMode' as any) ?? 'Zen Mode (Tabiat tovushlari)'}
      >
        <Headphones className="h-5 w-5" />
        {isPlaying && (
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-accent opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-accent"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-border bg-bg p-4 shadow-xl ring-1 ring-black/5 focus:outline-none z-50"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fg">{t('ambient.title' as any) ?? 'Zen Mode'}</h3>
              {trackId !== 'none' && (
                <button
                  onClick={togglePlay}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-white shadow-sm hover:bg-brand-accent/90"
                >
                  {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
                </button>
              )}
            </div>

            {/* Tracks List */}
            <div className="space-y-1">
              {tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setTrack(track.id as AmbientTrackId);
                    if (track.id !== 'none' && !isPlaying) {
                      setIsPlaying(true);
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                    trackId === track.id
                      ? 'bg-brand-accent/10 font-medium text-brand-accent'
                      : 'text-fg-muted hover:bg-bg-subtle hover:text-fg'
                  }`}
                >
                  <span className="text-lg">{track.icon}</span>
                  <span className="flex-1 text-left">{track.nameUz}</span>
                </button>
              ))}
            </div>

            {/* Controls */}
            {trackId !== 'none' && (
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setVolume(volume === 0 ? 0.5 : 0)} className="text-fg-subtle hover:text-fg">
                    {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-bg-subtle accent-brand-accent"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-fg-muted">{t('ambient.backgroundAnimation' as any) ?? 'Fon animatsiyasi'}</span>
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors ${
                      showVideo 
                        ? 'bg-emerald-500/10 text-emerald-600' 
                        : 'bg-slate-500/10 text-slate-600'
                    }`}
                  >
                    {showVideo ? <MonitorPlay className="h-3.5 w-3.5" /> : <MonitorOff className="h-3.5 w-3.5" />}
                    {showVideo ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
