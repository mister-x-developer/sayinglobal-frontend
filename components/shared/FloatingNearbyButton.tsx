'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';

export function FloatingNearbyButton() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const hydrated = useAuthHydrated();

  // Hide on auth pages, landing, admin, or chat detail
  if (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/admin') ||
    /^\/chat\/[^/]+$/.test(pathname)
  ) {
    return null;
  }

  if (!hydrated) return null;
  if (!isAuthenticated) return null;

  return (
    <Link
      href="/listings/nearby"
      className="fixed right-4 bottom-20 z-40 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-success text-white shadow-[0_4px_14px_0_rgb(46_140_95/0.45)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_20px_0_rgb(46_140_95/0.5)] active:scale-95"
      aria-label="Yaqin atrofdagi e'lonlar"
    >
      <MapPin className="h-5 w-5" strokeWidth={2.25} />
    </Link>
  );
}
