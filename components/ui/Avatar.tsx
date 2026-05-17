/**
 * Avatar — server-friendly with safe fallback (no external services).
 */

'use client';

import { HTMLAttributes, forwardRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  ring?: boolean;
}

const SIZE: Record<AvatarSize, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
  '2xl': 'h-28 w-28 text-2xl',
};

function initials(name?: string) {
  if (!name) return '·';
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', ring = false, ...props }, ref) => {
    const [errored, setErrored] = useState(false);
    const showImage = !!src && !errored;

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden rounded-full',
          'bg-gradient-to-br from-brand-primary to-brand-accent text-white font-semibold',
          ring && 'ring-2 ring-bg-elevated',
          SIZE[size],
          className
        )}
        {...props}
      >
        {showImage ? (
          <Image
            src={src!}
            alt={alt || name || 'Avatar'}
            fill
            sizes="(max-width: 640px) 100px, 200px"
            className="object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <span aria-hidden="true">{initials(name)}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar };
