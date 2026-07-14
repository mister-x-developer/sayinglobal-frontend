import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AmbientTrackId = 'none' | 'rain' | 'thunder' | 'ocean' | 'night' | 'forest';

export interface AmbientTrack {
  id: AmbientTrackId;
  name: string;
  nameUz: string;
  nameRu: string;
  icon: string;
  audioUrl: string;
  videoUrlDay: string;
  videoUrlNight: string;
  cssGradient: string;
}

export const AMBIENT_TRACKS: Record<AmbientTrackId, AmbientTrack> = {
  none: {
    id: 'none',
    name: 'None',
    nameUz: "Oʻchirilgan",
    nameRu: 'Выключено',
    icon: '🔇',
    audioUrl: '',
    videoUrlDay: '',
    videoUrlNight: '',
    cssGradient: '',
  },
  rain: {
    id: 'rain',
    name: 'Rain',
    nameUz: 'Yomg\'ir',
    nameRu: 'Дождь',
    icon: '🌧️',
    audioUrl: 'https://cdn.pixabay.com/audio/2021/08/04/audio_3d1ec5eb87.mp3',
    videoUrlDay: 'https://cdn.pixabay.com/video/2021/08/04/83906-585141071_tiny.mp4',
    videoUrlNight: 'https://cdn.pixabay.com/video/2023/10/22/185966-876722304_tiny.mp4',
    cssGradient: 'from-slate-600 via-slate-800 to-zinc-900',
  },
  thunder: {
    id: 'thunder',
    name: 'Thunder',
    nameUz: 'Momaqaldiroq',
    nameRu: 'Гроза',
    icon: '⛈️',
    audioUrl: 'https://cdn.pixabay.com/audio/2021/08/09/audio_d14fdf9bc5.mp3',
    videoUrlDay: 'https://cdn.pixabay.com/video/2020/05/25/40141-424102875_tiny.mp4',
    videoUrlNight: 'https://cdn.pixabay.com/video/2021/08/19/85540-590059523_tiny.mp4',
    cssGradient: 'from-zinc-800 via-stone-900 to-black',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    nameUz: 'Dengiz',
    nameRu: 'Океан',
    icon: '🌊',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/02/07/audio_338a9bcdd3.mp3',
    videoUrlDay: 'https://cdn.pixabay.com/video/2019/11/02/28555-370162545_tiny.mp4',
    videoUrlNight: 'https://cdn.pixabay.com/video/2017/04/09/8672-210741498_tiny.mp4',
    cssGradient: 'from-cyan-900 via-blue-900 to-teal-950',
  },
  night: {
    id: 'night',
    name: 'Night',
    nameUz: 'Tungi tabiat',
    nameRu: 'Ночная природа',
    icon: '🌃',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_249df9cbb1.mp3',
    videoUrlDay: 'https://cdn.pixabay.com/video/2020/03/09/33285-397750893_tiny.mp4',
    videoUrlNight: 'https://cdn.pixabay.com/video/2018/06/17/16781-274880537_tiny.mp4',
    cssGradient: 'from-indigo-950 via-slate-900 to-black',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    nameUz: 'O\'rmon',
    nameRu: 'Лес',
    icon: '☀️',
    audioUrl: 'https://cdn.pixabay.com/audio/2022/01/18/audio_27ed14b0df.mp3',
    videoUrlDay: 'https://cdn.pixabay.com/video/2020/04/10/35794-409160534_tiny.mp4',
    videoUrlNight: 'https://cdn.pixabay.com/video/2021/11/17/98436-649065604_tiny.mp4',
    cssGradient: 'from-green-800 via-emerald-900 to-green-950',
  },
};

interface AmbientState {
  trackId: AmbientTrackId;
  volume: number; // 0.0 to 1.0
  showVideo: boolean;
  isPlaying: boolean;
  setTrack: (id: AmbientTrackId) => void;
  setVolume: (v: number) => void;
  setShowVideo: (show: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
}

export const useAmbientStore = create<AmbientState>()(
  persist(
    (set) => ({
      trackId: 'none',
      volume: 0.5,
      showVideo: true,
      isPlaying: false,
      setTrack: (id) => set({ trackId: id, isPlaying: id !== 'none' }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      setShowVideo: (show) => set({ showVideo: show }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying && state.trackId !== 'none' })),
    }),
    {
      name: 'sayin-ambient-storage',
      partialize: (state) => ({
        trackId: state.trackId,
        volume: state.volume,
        showVideo: state.showVideo,
      }), // Don't persist `isPlaying' to prevent unexpected sound on refresh/startup
    }
  )
);
