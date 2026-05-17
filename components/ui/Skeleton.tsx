/**
 * Skeleton — uses new design tokens.
 */

import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'rectangular', width, height, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton',
        variant === 'text' && 'h-4 rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-xl',
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="surface-elevated overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="space-y-3 p-4">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="40%" height={20} />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    </div>
  );
}
