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
  CreditCard,
  Star,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
} from 'lucide-react';

import { Logo } from '@/components/shared/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';
import { useNotificationsStore } from '@/lib/store/notifications';

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
    ],
  },
  {
    labelKey: 'admin.systemHealth',
    items: [
      { href: '/admin/audit', icon: ScrollText, label: 'admin.auditLogs' },
      { href: '/admin/health', icon: Activity, label: 'admin.systemHealth' },
    ],
  },
  {
    labelKey: 'admin.guide',
    items: [
      { href: '/admin/guide', icon: ScrollText, label: 'Qo\'llanma' },
    ],
  },
] as const;

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

export function AdminLayout({ children, noPadding = false }: { children: React.ReactNode, noPadding?: boolean }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const hydrated = useAuthHydrated();
  const { unreadCount, setUnreadCount } = useNotificationsStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Load unread count on mount when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    import('@/lib/api/notifications').then(({ notificationsApi }) => {
      notificationsApi.unreadCount().then((count) => setUnreadCount(count));
    });
  }, [isAuthenticated, setUnreadCount]);

  useEffect(() => {
    // Restore sidebar collapse preference
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === 'true') setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (hydrated) {
      if (!isAuthenticated) {
        router.replace('/');
      } else if (!user?.is_staff && !user?.is_admin) {
        router.replace('/dashboard');
      }
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

  const roleBadge = user?.is_staff ? t('admin.superAdmin') : t('admin.adminRole');

  const Sidebar = ({ isDrawer = false }: { isDrawer?: boolean }) => (
    <nav className="flex h-full flex-col bg-bg-elevated border-r border-border relative">
      {/* Logo + collapse toggle — desktop */}
      {!isDrawer && (
        <div className={`flex h-16 items-center border-b border-border ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <Logo size="sm" href="/admin" />
              <div className="rounded-md bg-brand-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-[0.5px] text-brand-primary">
                {t('admin.admin').toUpperCase()}
              </div>
            </div>
          )}
          {collapsed && <ShieldCheck className="h-6 w-6 text-brand-primary" strokeWidth={2} />}

          <button
            type="button"
            onClick={toggleCollapsed}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle hover:bg-bg-subtle hover:text-fg transition-colors ${collapsed ? '' : 'ml-auto'}`}
            aria-label={collapsed ? t('common.showAll') : t('common.less')}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" strokeWidth={2} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={2} />}
          </button>
        </div>
      )}

      {/* User profile header */}
      <div className="border-b border-border p-4">
        {collapsed && !isDrawer ? (
          <Link href="/admin/profile" className="flex justify-center">
            <Avatar src={user?.avatar_url ?? user?.avatar ?? null} name={user?.full_name} size="sm" />
          </Link>
        ) : (
          <Link
            href="/admin/profile"
            className="group flex items-center gap-3 rounded-lg p-2 hover:bg-bg-subtle transition-colors"
          >
            <Avatar src={user?.avatar_url ?? user?.avatar ?? null} name={user?.full_name} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-fg group-hover:text-brand-primary transition-colors">{user?.full_name}</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.5px] text-brand-primary/80">{roleBadge}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation — calm and clear */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar">
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            {(!collapsed || isDrawer) && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-fg-subtle">
                {t(group.labelKey as any)}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, 'exact' in item ? (item as any).exact : false);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-all duration-200 ${
                      collapsed && !isDrawer ? 'justify-center' : ''
                    } ${
                      active
                        ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                        : 'text-fg-muted hover:bg-bg-subtle hover:text-fg'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={active ? 2 : 1.75} />
                    {(!collapsed || isDrawer) && (
                      <span className="flex-1">{t(item.label as any)}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar — logout & Go to main site */}
      <div className="border-t border-border p-3 space-y-2">
        <Link
          href="/listings"
          className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:bg-brand-primary/10 hover:text-brand-primary transition-colors ${
            collapsed && !isDrawer ? 'justify-center' : 'w-full'
          }`}
          title={t('admin.visitSite')}
        >
          <LayoutDashboard className="h-4.5 w-4.5 flex-shrink-0" strokeWidth={2} />
          {(!collapsed || isDrawer) && <span>{t('admin.visitSite')}</span>}
        </Link>
        <button
          onClick={() => {
            logout();
            router.push('/');
          }}
          className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:bg-danger/10 hover:text-danger transition-colors ${
            collapsed && !isDrawer ? 'justify-center mx-auto w-9 h-9' : 'w-full'
          }`}
          title={t('admin.logout')}
        >
          <LogOut className="h-4.5 w-4.5 flex-shrink-0" strokeWidth={2} />
          {(!collapsed || isDrawer) && <span>{t('admin.logout')}</span>}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="text-fg flex min-h-screen relative bg-bg">

      {/* Desktop sidebar — collapsible */}
      <aside
        className={`hidden fixed inset-y-0 left-0 z-40 flex-shrink-0 border-r border-border bg-bg-elevated/80 backdrop-blur-xl lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
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
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-bg-elevated lg:hidden flex flex-col pt-safe pb-safe"
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

      {/* Main content area */}
      <div className={`flex min-w-0 flex-1 flex-col h-[100dvh] overflow-hidden transition-all duration-300 ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Calm top bar */}
        <header className="flex min-h-[3.5rem] flex-shrink-0 items-center gap-3 border-b border-border bg-bg px-4 sm:px-6 pt-safe pb-2 sm:pb-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted hover:bg-bg-subtle lg:hidden"
            aria-label={t('nav.menu')}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <ShieldCheck className="h-5 w-5 text-brand-primary" />
            <span className="text-sm font-semibold">{t('Admin.admin')}</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
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
            <LanguageSwitcher />
            <ThemeSwitcher />
            <Link href="/dashboard" className="btn btn-ghost btn-sm text-fg-muted hidden sm:inline-flex">
              {t('nav.home')}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-bg">
          <div className={`mx-auto w-full max-w-[1400px] ${noPadding ? '' : 'p-5 sm:p-7'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
