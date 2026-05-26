'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, LayoutGrid, Plus, MessageSquareText, User } from 'lucide-react';
import { useNotificationsStore } from '@/lib/store/notifications';

/**
 * Mobile bottom navigation bar.
 * Shows unread notification badge on the profile tab.
 */
export function MobileBottomNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const links = [
    { href: '/dashboard', icon: Home, label: t('nav.home') },
    { href: '/listings', icon: LayoutGrid, label: t('nav.listings') },
    { href: '/listings/new', icon: Plus, label: t('nav.createListing'), primary: true },
    { href: '/chat', icon: MessageSquareText, label: t('nav.chat') },
    { href: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-bg-elevated/92 backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-1 pb-safe pt-1" role="list">
        {links.map((l) => {
          const Icon = l.icon;
          const active = isActive(l.href);

          if (l.primary) {
            return (
              <Link
                key={l.href}
                href={l.href}
                role="listitem"
                aria-label={l.label}
                className="flex flex-col items-center justify-center py-1"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-[0_4px_14px_0_rgb(31_122_82/0.45)] transition-transform active:scale-95">
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
              </Link>
            );
          }

          // Profile tab: show unread notification badge
          const showBadge = l.href === '/profile' && unreadCount > 0;

          return (
            <Link
              key={l.href}
              href={l.href}
              role="listitem"
              aria-label={l.label}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-w-[56px] flex-col items-center justify-center gap-1 py-2 px-2 transition-colors ${
                active ? 'text-brand-primary' : 'text-fg-subtle'
              }`}
            >
              <Icon
                className={`h-[22px] w-[22px] transition-transform active:scale-90 ${
                  active ? 'scale-110' : ''
                }`}
                strokeWidth={active ? 2.25 : 1.75}
              />
              {showBadge && (
                <span className="absolute -top-0.5 right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <span className="text-[10px] font-semibold leading-none">{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
