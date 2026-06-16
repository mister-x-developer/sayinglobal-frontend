'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { Logo } from '@/components/shared/Logo';

const STORAGE_KEY = 'sayin_ai_btn_hidden';

export function AIAssistantButton() {
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [hidden, setHidden] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [overDelete, setOverDelete] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const deleteZoneRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') setHidden(true);
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
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    didDrag.current = false;
    startPos.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    didDrag.current = true;
    const newX = e.clientX - startPos.current.x;
    const newY = e.clientY - startPos.current.y;
    setPos({ x: newX, y: newY });
    setOverDelete(checkOverDelete(e.clientX, e.clientY));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    if (checkOverDelete(e.clientX, e.clientY)) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setHidden(true);
    } else if (!didDrag.current) {
      // It was a tap, not a drag — navigate
      const isAdmin = user?.is_staff || user?.is_admin;
      router.push(isAdmin ? '/admin/ai-agent' : '/chat-ai');
    }
    setOverDelete(false);
    didDrag.current = false;
  };

  // Hide conditions
  if (!mounted) return null;
  if (!isAuthenticated || !user?.terms_accepted_at) return null;
  if (pathname.startsWith('/chat-ai') || pathname.startsWith('/admin/ai-agent')) return null;
  if (hidden) return null;


  const isAdmin = user?.is_staff || user?.is_admin;

  // Clamp position to keep it on screen
  const clampedX = Math.max(-(windowSize.width - 80), Math.min(pos.x, 0));
  // Allow dragging up (negative pos.y) and down (positive pos.y, up to 64px so it doesn't leave bottom screen)
  const clampedY = Math.max(-(windowSize.height - 200), Math.min(pos.y, 64));

  return (
    <>
      {/* Delete zone — shown only while dragging */}
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'fixed',
          right: 16 - clampedX,
          bottom: `calc(84px + env(safe-area-inset-bottom, 0px) - ${clampedY}px)`,
          zIndex: 40,
          touchAction: 'none',
          userSelect: 'none',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
      >
        <motion.div
          animate={{
            scale: overDelete ? 1.2 : dragging ? 1.05 : 1,
            rotate: overDelete ? -15 : 0,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <button
            type="button"
            className={`group relative inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[0_8px_32px_-4px_rgba(var(--brand-primary-rgb),0.5)] transition-colors duration-150 border border-white/20 overflow-hidden ${
              overDelete ? 'bg-red-500' : 'bg-brand-primary'
            }`}
            aria-label="AI Yordamchi"
          >
            {overDelete ? (
              <X className="h-6 w-6 text-white" strokeWidth={2.5} />
            ) : (
              <div className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-brand-primary/20 bg-brand-primary/5">
                <Logo size="xs" showText={false} href={null} />
              </div>
            )}
          </button>
        </motion.div>
      </div>
    </>
  );
}
