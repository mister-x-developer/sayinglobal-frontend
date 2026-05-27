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
  Menu,
  X,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Activity,
  Bot,
  CreditCard,
  Star,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import { Logo } from '@/components/shared/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useAuthStore } from '@/lib/store/auth';

const NAV_GROUPS = [
  {
    labelKey: 'admin.dashboard',
    items: [
      { href: '/admin', icon: LayoutDashboard, label: 'admin.dashboard', exact: true },
      { href: '/admin/analytics', icon: BarChart3, label: 'admin.analytics' },
    ],
  },
  {
    labelKey: 'admin.moderation',
    items: [
      { href: '/admin/listings', icon: LayoutGrid, label: 'admin.listings' },
      { href: '/admin/moderation', icon: Flag, label: 'admin.complaints' },
      { href: '/admin/ai-moderation', icon: Bot, label: 'admin.aiModeration' },
      { href: '/admin/ratings', icon: Star, label: 'admin.ratingsModeration' },
    ],
  },
  {
    labelKey: 'admin.users',
    items: [
      { href: '/admin/users', icon: Users, label: 'admin.users' },
      { href: '/admin/security', icon: ShieldAlert, label: 'security.title' },
    ],
  },
  {
    labelKey: 'admin.broadcasts',
    items: [
      { href: '/admin/broadcasts', icon: Megaphone, label: 'admin.broadcasts' },
      { href: '/admin/plans', icon: CreditCard, label: 'admin.plans' },
    ],
  },
  {
    labelKey: 'admin.systemHealth',
    items: [
      { href: '/admin/audit', icon: ScrollText, label: 'admin.auditLogs' },
      { href: '/admin/health', icon: Activity, label: 'admin.systemHealth' },
    ],
  },
] as const;

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    // Restore sidebar collapse preference
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === 'true') setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (hydrated && (!isAuthenticated || (!user?.is_staff && !user?.is_admin))) {
      router.replace('/dashboard');
    }
  }, [hydrated, isAuthenticated, user, router]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const roleBadge = user?.is_staff ? 'Super Admin' : 'Admin';

  const Sidebar = ({ isDrawer = false }: { isDrawer?: boolean }) => (
    <nav className="flex h-full flex-col">
      {/* Logo + collapse toggle — only on desktop sidebar */}
      {!isDrawer && (
      <div className={`flex h-16 items-center border-b border-border ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        {!collapsed && (
          <>
            <Logo size="sm" href="/admin" />
            <span className="ml-2 rounded-md bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
              Admin
            </span>
          </>
        )}
        {collapsed && (
          <ShieldCheck className="h-6 w-6 text-brand-primary" strokeWidth={1.75} />
        )}
        {/* Collapse toggle — desktop only */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle hover:text-fg transition-colors ${collapsed ? '' : 'ml-auto'}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
      )}

      {/* User profile — TOP position */}
      <div className="border-b border-border p-3">
        {collapsed && !isDrawer ? (
          <div className="flex flex-col items-center gap-2">
            <Link href="/admin/profile">
              <Avatar src={user?.avatar_url ?? user?.avatar ?? null} name={user?.full_name} size="sm" ring />
            </Link>
          </div>
        ) : (
          <Link
            href="/admin/profile"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-bg-subtle transition-colors"
          >
            <Avatar src={user?.avatar_url ?? user?.avatar ?? null} name={user?.full_name} size="sm" ring />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg">{user?.full_name}</p>
              <p className="text-xs text-fg-subtle">{roleBadge}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            {(!collapsed || isDrawer) && (
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-fg-subtle/60">
                {t(group.labelKey as any)}
              </p>
            )}
            {(collapsed && !isDrawer) && <div className="my-1 border-t border-border/40" />}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, 'exact' in item ? (item as any).exact : false);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed && !isDrawer ? t(item.label as any) : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      collapsed && !isDrawer ? 'justify-center px-2' : ''
                    } ${
                      active
                        ? 'bg-brand-primary/12 text-brand-primary'
                        : 'text-fg-muted hover:bg-bg-subtle hover:text-fg'
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.75} />
                    {(!collapsed || isDrawer) && (
                      <>
                        <span className="flex-1">{t(item.label as any)}</span>
                        {active && (
                          <ChevronRight className="h-3.5 w-3.5 opacity-60" strokeWidth={2.25} />
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Logout — bottom */}
      <div className="border-t border-border p-3">
        {collapsed && !isDrawer ? (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => { logout(); router.push('/'); }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle hover:text-danger"
              aria-label={t('nav.logout')}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { logout(); router.push('/'); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-fg-muted hover:bg-bg-subtle hover:text-danger transition-colors"
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.75} />
            <span>{t('nav.logout')}</span>
          </button>
        )}
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — collapsible */}
      <aside
        className={`hidden flex-shrink-0 border-r border-border bg-bg-elevated lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <Sidebar />
      </aside>

      {/* Mobile sidebar drawer */}
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
              <div className="flex h-16 items-center justify-between border-b border-border px-5">
                <div className="flex items-center gap-2">
                  <Logo size="sm" href="/admin" />
                  <span className="rounded-md bg-brand-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                    Admin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-fg-subtle hover:bg-bg-subtle"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
              <Sidebar isDrawer />
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
            {/* Notification bell */}
            <Link
              href="/notifications"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-fg-muted hover:bg-bg-subtle hover:text-fg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.75} />
            </Link>
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
