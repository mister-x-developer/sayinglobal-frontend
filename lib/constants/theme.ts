/**
 * SAYIN GLOBAL Theme System
 * Day/Night atmospheric modes
 * Premium color palette
 */

export const theme = {
  // Brand Colors
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#1F7A52', // Brand green
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    amber: {
      500: '#F2B100', // Brand amber
    },
    teal: {
      500: '#00B89F', // Brand teal
    },
  },

  // Day Mode Atmosphere
  day: {
    sky: 'from-sky-400 via-blue-300 to-blue-200',
    grass: 'from-green-600 via-green-500 to-green-400',
    sun: 'bg-amber-400',
    clouds: 'bg-white/80',
    overlay: 'bg-white/95',
    text: 'text-gray-900',
    textMuted: 'text-gray-600',
    border: 'border-gray-200',
    card: 'bg-white',
    cardHover: 'hover:bg-gray-50',
  },

  // Night Mode Atmosphere
  night: {
    sky: 'from-slate-900 via-slate-800 to-slate-700',
    valley: 'from-slate-800 via-slate-700 to-slate-600',
    moon: 'bg-slate-200',
    stars: 'bg-white',
    overlay: 'bg-slate-900/95',
    text: 'text-gray-100',
    textMuted: 'text-gray-400',
    border: 'border-slate-700',
    card: 'bg-slate-800/50 backdrop-blur-xl',
    cardHover: 'hover:bg-slate-800/70',
  },

  // Animation Timings
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    cinematic: '800ms',
  },

  // Easing Functions
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    premium: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Spacing Scale
  spacing: {
    section: '6rem',
    container: '1280px',
    gutter: '1.5rem',
  },

  // Typography Scale
  typography: {
    hero: 'text-5xl md:text-6xl lg:text-7xl',
    h1: 'text-4xl md:text-5xl',
    h2: 'text-3xl md:text-4xl',
    h3: 'text-2xl md:text-3xl',
    h4: 'text-xl md:text-2xl',
    body: 'text-base',
    small: 'text-sm',
    tiny: 'text-xs',
  },
} as const;

export type Theme = typeof theme;
