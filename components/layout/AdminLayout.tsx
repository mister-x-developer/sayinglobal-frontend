'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  LayoutGrid,
  Flag,
  Megaphone,
  BarChart3,
  ScrollText,
  Settings,
  Menu,
  X,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Activity,
  Bot,
  CreditCard,
} from 'lucide-react';

import { Logo } from '@/components/shared/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useAuthStore } from '@/lib/store/auth';

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'admin.dashboard', exact: true },
  { href: '/admin/users', icon: Users, label: 'admin.users' },
  { href: '/admin/listings', icon: LayoutGrid, label: 'admin.listings' },
  { href: '/admin/moderation', icon: Flag, label: 'admin.complaints' },
  { href: '/admin/ai-moderation', icon: Bot, label: 'admin.aiModeration' },
  { href: '/admin/plans', icon: CreditCard, label: 'admin.plans' },
  { href: '/admin/ratings', icon: Flag, label: 'admin.ratingsModeration' },
  { href: '/admin/broadcasts', icon: Megaphone, label: 'admin.broadcasts' },
  { href: '/admin/analytics', icon: BarChart3, label: 'admin.analytics' },
  { href: '/admin/audit', icon: ScrollText, label: 'admin.auditLogs' },
  { href: '/admin/security', icon: ShieldAlert, label: 'security.title' },
  { href: '/admin/health', icon: Activity, label: 'admin.systemHealth' },
] as const;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && (!isAuthenticated || (!user?.is_staff && !user?.is_admin))) {
      router.replace('/dashboard');
    }
  }, [hydrated, isAuthenticated, user, router]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const Sidebar = () => (
    <nav className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo size="sm" href="/admin" />
        <span className="ml-2 rounded-md bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
          Admin
        </span>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, 'exact' in item ? (item as any).exact : false);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-primary/12 text-brand-primary'
                    : 'text-fg-muted hover:bg-bg-subtle hover:text-fg'
                }`}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.75} />
                <span className="flex-1">{t(item.label as any)}</span>
                {active && (
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" strokeWidth={2.25} />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* User */}
      <div className="border-t border-border p-3">
        <Link
          href="/admin/profile"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-bg-subtle transition-colors"
        >
          <Avatar src={user?.avatar_url ?? user?.avatar ?? null} name={user?.full_name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{user?.full_name}</p>
            <p className="text-xs text-fg-subtle">{t('admin.title')}</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); logout(); router.push('/'); }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle hover:text-danger"
            aria-label={t('nav.logout')}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-bg-elevated lg:flex lg:flex-col">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-bg-elevated lg:hidden"
            >
              <Sidebar />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg hover:bg-bg-subtle lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <ShieldCheck className="h-5 w-5 text-brand-primary" strokeWidth={1.75} />
            <span className="font-display text-sm font-bold text-fg">Admin</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <Link href="/dashboard" className="btn btn-ghost btn-sm text-fg-muted">
              {t('nav.home')}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
