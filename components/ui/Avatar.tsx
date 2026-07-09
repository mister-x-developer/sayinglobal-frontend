/**
 * Avatar — server-friendly with safe fallback (no external services).
 */

'use client';

import { HTMLAttributes, forwardRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  ring?: boolean;
  enlargeable?: boolean;
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
  ({ className, src, alt, name, size = 'md', ring = false, enlargeable = false, onClick, ...props }, ref) => {
    const [errored, setErrored] = useState(false);
    const [isEnlarged, setIsEnlarged] = useState(false);
    const showImage = !!src && !errored;

    useEffect(() => {
      if (isEnlarged) document.body.style.overflow = 'hidden';
      else document.body.style.overflow = '';
      return () => { document.body.style.overflow = ''; };
    }, [isEnlarged]);

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && isEnlarged) setIsEnlarged(false); };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [isEnlarged]);

    const handleAvatarClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (enlargeable && showImage) {
        setIsEnlarged(true);
      }
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <>
        <div
          ref={ref}
          onClick={handleAvatarClick}
          className={cn(
            'relative inline-flex items-center justify-center overflow-hidden rounded-full',
            'bg-gradient-to-br from-brand-primary to-brand-accent text-white font-semibold',
            ring && 'ring-2 ring-bg-elevated',
            enlargeable && showImage && 'cursor-pointer hover:opacity-90 transition-opacity',
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

        {typeof window !== 'undefined' && createPortal(
          <AnimatePresence>
            {isEnlarged && showImage && (
              <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsEnlarged(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-zoom-out"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="relative z-[1501] max-w-[90vw] max-h-[90vh]"
                >
                  <button
                    onClick={() => setIsEnlarged(false)}
                    className="absolute -top-12 right-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                  <img
                    src={src!}
                    alt={alt || name || 'Avatar Enlarge'}
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar };
