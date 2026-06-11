'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion, useDragControls } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';

export function FloatingNearbyButton() {
  const pathname = usePathname();
  const t = useTranslations('nearby');
  const { isAuthenticated } = useAuthStore();
  const hydrated = useAuthHydrated();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hide on auth pages, landing, admin, or chat detail
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/admin') ||
    /^\/chat\/[^/]+$/.test(pathname)
  ) {
    return null;
  }

  if (!hydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <>
      <motion.div
        drag
        dragConstraints={{ left: 0, right: windowSize.width - 80, top: -windowSize.height + 140, bottom: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        className="fixed left-4 bottom-32 md:bottom-8 md:left-8 z-50 inline-flex flex-col items-center gap-2 pointer-events-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { type: 'spring', bounce: 0.5 } }}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        style={{ touchAction: 'none' }}
      >
        <Link
          href="/listings/nearby"
          draggable={false}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success text-white shadow-[0_4px_14px_0_rgb(46_140_95/0.45)] transition-all duration-300 ease-out hover:shadow-[0_6px_20px_0_rgb(46_140_95/0.5)] active:scale-95 animate-float"
          aria-label={t('title')}
        >
          <MapPin className="h-6 w-6" strokeWidth={2.25} />
        </Link>
      </motion.div>
    </>
  );
}
