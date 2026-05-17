/**
 * Category Icons — clean outline style, no cartoon.
 * Inspired by livestock silhouettes, simplified to stroke marks.
 */
import type React from 'react';

interface CategoryIconProps {
  name: 'cattle' | 'sheep' | 'goats' | 'horses' | 'camels' | 'poultry';
  className?: string;
}

export function CategoryIcon({ name, className = 'h-10 w-10' }: CategoryIconProps) {
  const common = {
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    // Explicit width/height so SVG never expands beyond its container
    style: { display: 'block', flexShrink: 0 } as React.CSSProperties,
    className,
  };

  switch (name) {
    case 'cattle':
      return (
        <svg {...common}>
          <path d="M16 28c-1.5-3 0-7 4-8 1-3 4-5 7-5 4 0 6 2 7 5h2c4 0 6 3 6 7v9c0 5-4 9-9 9h-8c-5 0-9-4-9-9v-3a3 3 0 0 0 0-5z" />
          <path d="M22 22v-3M30 21v-2M38 22v-3" />
          <path d="M26 38v6M36 38v6" />
          <circle cx="22" cy="28" r="0.8" fill="currentColor" />
          <circle cx="30" cy="28" r="0.8" fill="currentColor" />
        </svg>
      );

    case 'sheep':
      return (
        <svg {...common}>
          <path d="M14 30a6 6 0 0 1 5-6 6 6 0 0 1 6-6 6 6 0 0 1 6-3 6 6 0 0 1 6 3 6 6 0 0 1 6 6 6 6 0 0 1 5 6 5 5 0 0 1-3 5l-1 4c0 4-3 6-6 6h-13c-3 0-6-2-6-6l-1-4a5 5 0 0 1-3-5z" />
          <path d="M22 38v6M28 39v5M34 39v5M42 38v6" />
          <circle cx="26" cy="22" r="0.8" fill="currentColor" />
          <circle cx="32" cy="22" r="0.8" fill="currentColor" />
        </svg>
      );

    case 'goats':
      return (
        <svg {...common}>
          <path d="M18 30c0-4 3-7 6-8l-2-6 5 4h6l5-4-2 6c3 1 6 4 6 8v9c0 4-3 7-7 7h-10c-4 0-7-3-7-7z" />
          <path d="M22 18l-3-4M42 18l3-4" />
          <path d="M24 38v6M40 38v6" />
          <circle cx="26" cy="26" r="0.8" fill="currentColor" />
          <circle cx="34" cy="26" r="0.8" fill="currentColor" />
          <path d="M30 30c0 2 2 3 4 0" />
        </svg>
      );

    case 'horses':
      return (
        <svg {...common}>
          <path d="M14 44V32c0-6 5-11 11-11h6l8-8v8c4 1 6 4 6 8v15" />
          <path d="M14 44h6v-8M45 44h-6v-8M28 44h6v-8" />
          <path d="M40 21l3-2 1-4-4 2" />
          <circle cx="38" cy="20" r="0.8" fill="currentColor" />
          <path d="M22 28h-4M22 24c-2 0-4 1-5 3" />
        </svg>
      );

    case 'camels':
      return (
        <svg {...common}>
          <path d="M12 44V36c0-3 2-5 5-5l3-6 4 6h2l3-9 4 9c4 0 7 3 7 7l5 6" />
          <path d="M14 44h4v-6M44 44l-2-6M30 44h4v-6" />
          <path d="M50 22c2 0 3 1 3 3l-1 4-3-2v-3z" />
          <circle cx="50" cy="24" r="0.8" fill="currentColor" />
        </svg>
      );

    case 'poultry':
      return (
        <svg {...common}>
          <path d="M22 42c0-7 4-13 11-13 5 0 9 4 9 9v0c0 6-5 10-11 10h-3c-3 0-6-2-6-6z" />
          <path d="M33 29l-2-6 4-3 1 4 3-3v6" />
          <path d="M22 42c-3 1-6 0-7-3M40 42v6M34 48v4M28 48v3" />
          <path d="M28 24l-3-3 4-1 2 4" />
          <circle cx="38" cy="35" r="0.8" fill="currentColor" />
        </svg>
      );

    default:
      return null;
  }
}
