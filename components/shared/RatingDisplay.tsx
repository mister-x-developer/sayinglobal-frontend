'use client';

import { Star } from 'lucide-react';

interface Props {
  /** Average score from the backend (0–5). */
  score: number | string | null | undefined;
  /** Total number of ratings received. */
  count: number | null | undefined;
  /** Visual size of the star. */
  size?: 'sm' | 'md' | 'lg';
  /** Apply text-warning color tone for the score number. Default true. */
  warning?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const textMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Trust display: shows an empty star + (0) for new accounts, and a
 * filled warning-colored star + score + (count) for rated users.
 *
 * A new account is NOT trust; it is a neutral baseline. Showing a full
 * yellow star on day-one would let bad actors fake reputation by simply
 * creating new accounts.
 */
export function RatingDisplay({
  score,
  count,
  size = 'sm',
  warning = true,
  className = '',
}: Props) {
  const numeric = typeof score === 'number' ? score : Number(score ?? 0);
  const total = typeof count === 'number' ? count : Number(count ?? 0);
  const hasRatings = total > 0 && numeric > 0;

  const starClass = sizeMap[size];
  const textClass = textMap[size];
  const tone = hasRatings && warning ? 'text-warning' : 'text-fg-subtle';

  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${tone} ${textClass} ${className}`}>
      <Star
        className={starClass}
        strokeWidth={hasRatings ? 0 : 1.75}
        fill={hasRatings ? 'currentColor' : 'transparent'}
      />
      {hasRatings ? <span>{numeric.toFixed(1)}</span> : null}
      <span className="text-fg-subtle font-normal">({total})</span>
    </span>
  );
}
