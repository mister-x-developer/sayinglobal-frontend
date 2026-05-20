'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  LayoutGrid,
  Heart,
  MessageSquareText,
  Bell,
  Plus,
  Search,
  Menu,
  X,
  LogOut,
  Settings,
  User as UserIcon,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

import { Logo } from '@/components/shared/Logo';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/lib/store/auth';
import { useNotificationsStore } from '@/lib/store/notifications';

// ── Mobile drawer rendered via portal so it escapes the sticky header stacking context ──
function MobileDrawer({
  open,
  onClose,
  links,
  isActive,
  unreadCount,
  t,
}: {
  open: boolean;
  onClose: () => void;
  links: { href: string; icon: any; label: string }[];
  isActive: (href: string) => boolean;
  unreadCount: number;
  t: (key: any) => string;
}) {
  // Lock body scroll while drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — full screen, blocks interaction with underlying content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden"
            style={{ zIndex: 9998 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-y-0 left-0 w-72 bg-bg-elevated border-r border-border shadow-lift overflow-y-auto md:hidden"
            style={{ zIndex: 9999 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo size="sm" href={null} />
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg hover:bg-bg-subtle"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <nav className="p-2">
              {links.map((l) => {
                const Icon = l.icon;
                const active = isActive(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                      active ? 'bg-brand-primary/10 text-brand-primary' : 'text-fg hover:bg-bg-subtle'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    {l.label}
                  </Link>
                );
              })}

              <div className="my-2 h-px bg-border" />

              <Link
                href="/listings/new"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-brand-primary hover:bg-brand-primary/10 transition-colors"
              >
                <Plus className="h-[18px] w-[18px]" strokeWidth={2} />
                {t('nav.createListing')}
              </Link>

              <Link
                href="/profile/favorites"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-fg hover:bg-bg-subtle transition-colors"
              >
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {t('nav.favorites')}
              </Link>
              <Link
                href="/search"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-fg hover:bg-bg-subtle transition-colors"
              >
                <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {t('nav.search')}
              </Link>
              <Link
                href="/notifications"
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-fg hover:bg-bg-subtle transition-colors"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {t('nav.notifications')}
                {unreadCount > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function AppNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationsStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [profileOpen]);

  const links = [
    { href: '/dashboard', icon: Home, label: t('nav.home') },
    { href: '/listings', icon: LayoutGrid, label: t('nav.listings') },
    { href: '/listings/nearby', icon: MapPin, label: t('nav.nearby' as any) ?? 'Nearby' },
    { href: '/sellers', icon: ShieldCheck, label: t('nav.sellers') },
    { href: '/chat', icon: MessageSquareText, label: t('nav.chat') },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {/* ── Sticky header bar ── */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-xl backdrop-saturate-150 transition-shadow duration-300">
        <div className="container-page">
          <div className="flex h-16 items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg hover:bg-bg-subtle md:hidden"
              aria-label={t('nav.menu')}
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>

            <Logo size="sm" />

            {/* Desktop links */}
            <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main navigation">
              {links.map((l) => {
                const active = isActive(l.href);
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? 'page' : undefined}
                    className={`group inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-fg-muted hover:bg-bg-subtle hover:text-fg'
                    }`}
                  >
                    <Icon className="h-[16px] w-[16px]" strokeWidth={1.75} />
                    <span>{l.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex-1" />

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/listings/new"
                className="hidden md:inline-flex btn btn-primary btn-sm"
              >
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                <span>{t('nav.createListing')}</span>
              </Link>

              <Link
                href="/notifications"
                aria-label={t('nav.notifications')}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-fg hover:bg-bg-subtle"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="flex items-center gap-1.5">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>

              {isAuthenticated && user ? (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    type="button"
                    aria-label={t('nav.profile')}
                    className="flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Avatar
                      src={user.avatar_url ?? user.avatar ?? null}
                      name={user.full_name}
                      size="sm"
                      ring
                    />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lift"
                      >
                        <div className="border-b border-border p-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={user.avatar_url ?? user.avatar ?? null} name={user.full_name} size="md" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-fg">{user.full_name}</p>
                              <p className="truncate text-xs text-fg-subtle">{user.phone}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-1.5">
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-fg hover:bg-bg-subtle"
                          >
                            <UserIcon className="h-4 w-4" strokeWidth={1.75} />
                            {t('nav.profile')}
                          </Link>
                          <Link
                            href="/profile/settings"
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-fg hover:bg-bg-subtle"
                          >
                            <Settings className="h-4 w-4" strokeWidth={1.75} />
                            {t('nav.settings')}
                          </Link>
                          {(user.is_staff || user.is_admin) && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-fg hover:bg-bg-subtle"
                            >
                              <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
                              {t('nav.admin')}
                            </Link>
                          )}
                          <div className="my-1 h-px bg-border" />
                          <button
                            onClick={handleLogout}
                            type="button"
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger/10"
                          >
                            <LogOut className="h-4 w-4" strokeWidth={1.75} />
                            {t('nav.logout')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/auth" className="btn btn-primary btn-sm">
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer — rendered into document.body via portal ── */}
      {mounted && (
        <MobileDrawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          links={links}
          isActive={isActive}
          unreadCount={unreadCount}
          t={t}
        />
      )}
    </>
  );
}
