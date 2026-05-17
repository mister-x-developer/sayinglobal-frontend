'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CategoryIcon } from '@/components/shared/CategoryIcon';

type CategoryKey = 'cattle' | 'sheep' | 'goats' | 'horses' | 'camels' | 'poultry';

interface ListingImageProps {
  src?: string | null;
  alt: string;
  category?: string;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Premium listing image with editorial placeholder.
 * Placeholder uses a subtle gradient + category silhouette.
 * No cartoon, no broken image icon, no random stock.
 */

// Subtle per-category gradient palettes — earthy, natural, premium
const CATEGORY_GRADIENTS: Record<CategoryKey, string> = {
  cattle: 'from-amber-950/20 via-stone-800/30 to-green-950/20',
  sheep: 'from-slate-800/20 via-stone-700/25 to-slate-900/20',
  goats: 'from-stone-800/20 via-amber-900/20 to-stone-900/20',
  horses: 'from-amber-900/25 via-stone-800/20 to-amber-950/20',
  camels: 'from-amber-800/20 via-stone-700/25 to-amber-900/20',
  poultry: 'from-stone-700/20 via-amber-800/20 to-stone-800/20',
};

const VALID_CATS: CategoryKey[] = ['cattle', 'sheep', 'goats', 'horses', 'camels', 'poultry'];

export function ListingImage({
  src,
  alt,
  category,
  fill = true,
  className = '',
  priority,
  sizes,
}: ListingImageProps) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;

  if (showImage) {
    return (
      <Image
        src={src!}
        alt={alt}
        fill={fill}
        sizes={sizes ?? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
        priority={priority}
        className={`object-cover transition-opacity duration-500 ${className}`}
        onError={() => setErrored(true)}
        loading={priority ? 'eager' : 'lazy'}
      />
    );
  }

  const cat = VALID_CATS.includes(category as CategoryKey)
    ? (category as CategoryKey)
    : 'cattle';

  const gradient = CATEGORY_GRADIENTS[cat];

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center ${className}`}
      aria-label={alt}
      role="img"
    >
      {/* Base surface */}
      <div className="absolute inset-0 bg-bg-subtle" />

      {/* Atmospheric gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />

      {/* Subtle texture lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            rgb(var(--fg)) 4px,
            rgb(var(--fg)) 5px
          )`,
        }}
      />

      {/* Category silhouette */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <span className="text-fg-subtle opacity-30">
          <CategoryIcon name={cat} className="h-16 w-16 sm:h-20 sm:w-20" />
        </span>
      </div>
    </div>
  );
}
