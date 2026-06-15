'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MapPin, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';

const STORAGE_KEY = 'sayin_nearby_btn_hidden';

export function FloatingNearbyButton() {
  const pathname = usePathname();
  const t = useTranslations('nearby');
  const { isAuthenticated } = useAuthStore();
  const hydrated = useAuthHydrated();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [hidden, setHidden] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [overDelete, setOverDelete] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const deleteZoneRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setHidden(true);
  }, []);

  useEffect(() => {
    const update = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const checkOverDelete = useCallback((x: number, y: number) => {
    const zone = deleteZoneRef.current;
    if (!zone) return false;
    const rect = zone.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('a')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    startPos.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const newX = e.clientX - startPos.current.x;
    const newY = e.clientY - startPos.current.y;
    currentPos.current = { x: e.clientX, y: e.clientY };
    setPos({ x: newX, y: newY });
    setOverDelete(checkOverDelete(e.clientX, e.clientY));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    if (checkOverDelete(e.clientX, e.clientY)) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setHidden(true);
    }
    setOverDelete(false);
  };

  // Hide on auth pages, landing, admin, chat detail
  if (
    pathname.startsWith('/auth') ||
    pathname === '/' ||
    pathname.startsWith('/admin') ||
    /^\/chat\/[^/]+$/.test(pathname)
  ) {
    return null;
  }

  if (!hydrated) return null;
  if (!isAuthenticated) return null;
  if (hidden) return null;

  // Clamp position within window (anchored to right)
  const clampedX = Math.max(-(windowSize.width - 80), Math.min(pos.x, 0));
  const clampedY = Math.max(-(windowSize.height - 200), Math.min(pos.y, 0));

  return (
    <>
      {/* Delete zone — only shown while dragging */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            ref={deleteZoneRef}
            initial={{ opacity: 0, y: 30, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.7 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] flex h-14 w-14 items-center justify-center rounded-full border-2 transition-colors duration-150 ${
              overDelete
                ? 'bg-red-500 border-red-400 shadow-[0_0_24px_4px_rgba(239,68,68,0.5)]'
                : 'bg-bg-elevated border-border shadow-lift'
            }`}
          >
            <X className={`h-6 w-6 transition-colors ${overDelete ? 'text-white' : 'text-fg-muted'}`} strokeWidth={2.5} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <div
        ref={btnRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'fixed',
          right: 16 - clampedX,
          bottom: `calc(156px + env(safe-area-inset-bottom, 0px) - ${clampedY}px)`,
          zIndex: 40,
          touchAction: 'none',
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <motion.div
          animate={{
            scale: overDelete ? 1.2 : dragging ? 1.05 : 1,
            rotate: overDelete ? 15 : 0,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
        >
          <Link
            href="/listings/nearby"
            draggable={false}
            onClick={(e) => { if (dragging) e.preventDefault(); }}
            className={`inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_4px_14px_0_rgb(46_140_95/0.45)] transition-all duration-200 ease-out active:scale-95 animate-float ${
              overDelete ? 'bg-red-500' : 'bg-success'
            }`}
            aria-label={t('title')}
          >
            {overDelete ? (
              <X className="h-6 w-6" strokeWidth={2.5} />
            ) : (
              <MapPin className="h-6 w-6" strokeWidth={2.25} />
            )}
          </Link>
        </motion.div>
      </div>
    </>
  );
}
