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
    const [mounted, setMounted] = useState(false);
    const showImage = !!src && !errored;

    useEffect(() => {
      setMounted(true);
    }, []);

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

        {mounted && createPortal(
          <AnimatePresence>
            {isEnlarged && showImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsEnlarged(false)}
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm cursor-zoom-out"
              >
                <div className="absolute right-4 top-4 md:right-8 md:top-8 z-10">
                  <button className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative h-full w-full max-h-[85vh] max-w-4xl overflow-hidden rounded-2xl shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Image
                    src={src!}
                    alt={alt || name || 'Avatar Enalrged'}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </motion.div>
              </motion.div>
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
