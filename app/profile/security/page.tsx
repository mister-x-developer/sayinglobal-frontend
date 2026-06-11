'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Monitor,
  Smartphone,
  ShieldCheck,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { AppNav } from '@/components/layout/AppNav';
import { useAuthStore } from '@/lib/store/auth';
import { sessionsApi, UserSession, SecurityEvent } from '@/lib/api/sessions';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRefreshJti(refreshToken: string | null): string {
  if (!refreshToken) return '';
  try {
    return JSON.parse(atob(refreshToken.split('.')[1])).jti ?? '';
  } catch {
    return '';
  }
}

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

// ── Toast ────────────────────────────────────────────────────────────────────

interface ToastState {
  message: string;
  variant: 'success' | 'info' | 'error';
}

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 4000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  const colours = {
    success: 'border-success/30 bg-success/10 text-success',
    info: 'border-info/30 bg-info/10 text-info',
    error: 'border-danger/30 bg-danger/10 text-danger',
  };
  const Icon = toast.variant === 'success' ? CheckCircle2 : toast.variant === 'info' ? Info : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className={`fixed right-4 top-20 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${colours[toast.variant]}`}
      role="alert"
    >
      <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={2.25} />
      {toast.message}
    </motion.div>
  );
}

// ── Platform icon ─────────────────────────────────────────────────────────────

function PlatformIcon({ platform }: { platform: UserSession['platform'] }) {
  if (platform === 'web') {
    return <Monitor className="h-5 w-5 text-fg-muted" strokeWidth={1.75} />;
  }
  return <Smartphone className="h-5 w-5 text-fg-muted" strokeWidth={1.75} />;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const t = useTranslations();
  const ts = useTranslations('security');
  const router = useRouter();
  const { isAuthenticated, refreshToken } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const jti = getRefreshJti(refreshToken);

  useEffect(() => setHydrated(true), []);

  /* auth gating handled by middleware */

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await sessionsApi.list(jti);
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [jti]);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const data = await sessionsApi.securityEvents();
      setEvents(data.slice(0, 10));
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSessions();
    fetchEvents();
  }, [isAuthenticated, fetchSessions, fetchEvents]);

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      await sessionsApi.revoke(sessionId, jti);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      setToast({ message: t('errors.somethingWrong'), variant: 'error' });
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      const result = await sessionsApi.revokeAllOthers(jti);
      await fetchSessions();
      if (result.revoked_count > 0) {
        setToast({ message: ts('allOthersRevoked'), variant: 'success' });
      } else {
        setToast({ message: ts('noOtherSessions'), variant: 'info' });
      }
    } catch {
      setToast({ message: t('errors.somethingWrong'), variant: 'error' });
    } finally {
      setRevokingAll(false);
    }
  };

  const translateEventType = (eventType: string): string => {
    try {
      return t(`security.eventTypes.${eventType}` as Parameters<typeof t>[0]);
    } catch {
      return eventType;
    }
  };

  if (!hydrated) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <AnimatePresence>
        {toast && (
          <Toast key="toast" toast={toast} onDismiss={() => setToast(null)} />
        )}
      </AnimatePresence>

      <main className="flex-1">
        <div className="container-page py-8 sm:py-10">

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex items-center gap-3"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="display-md">{ts('title')}</h1>
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

            {/* Active sessions */}
            <div className="space-y-4">
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="surface-elevated p-6"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="display-sm">{ts('activeSessions')}</h2>
                  <button
                    type="button"
                    onClick={handleRevokeAll}
                    disabled={revokingAll || loadingSessions}
                    className="btn btn-secondary btn-sm"
                  >
                    {revokingAll ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                    {ts('signOutAllOthers')}
                  </button>
                </div>

                {loadingSessions ? (
                  <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 rounded-xl bg-bg-subtle p-4">
                        <div className="skeleton h-9 w-9 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-4 w-1/2" />
                          <div className="skeleton h-3 w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-fg-muted">{ts('noOtherSessions')}</p>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {sessions.map((session) => (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-4 rounded-xl bg-bg-subtle p-4"
                        >
                          <div className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-bg-elevated">
                            <PlatformIcon platform={session.platform} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-fg truncate">
                                {session.device_name}
                              </span>
                              {session.is_current && (
                                <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold text-brand-primary">
                                  {ts('currentDevice')}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-fg-muted">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" strokeWidth={1.75} />
                                {ts('lastActivity')}: {relativeTime(session.last_activity)}
                              </span>
                              {session.ip_address && (
                                <span>{session.ip_address}</span>
                              )}
                            </div>
                          </div>

                          {!session.is_current && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(session.id)}
                              disabled={revoking === session.id}
                              className="btn btn-ghost btn-sm flex-shrink-0 text-danger hover:bg-danger/10"
                            >
                              {revoking === session.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
                              ) : (
                                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
                              )}
                              {ts('revokeSession')}
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.section>
            </div>

            {/* Recent security events */}
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="surface-elevated p-6 self-start"
            >
              <h2 className="display-sm mb-5">{ts('recentEvents')}</h2>

              {loadingEvents ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="skeleton h-3.5 w-3/4" />
                      <div className="skeleton h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <p className="text-sm text-fg-muted">{t('empty.noActivity')}</p>
              ) : (
                <div className="space-y-3">
                  {events.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      className="border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <p className="text-sm font-semibold text-fg">
                        {translateEventType(event.event_type)}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-fg-muted">
                        <span>{relativeTime(event.created_at)}</span>
                        {event.ip_address && <span>{event.ip_address}</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>

          </div>
        </div>
      </main>
    </div>
  );
}
