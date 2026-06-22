'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ShieldAlert, Lock, AlertTriangle, Activity, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import apiClient from '@/lib/api/client';
import { useAuthStore, useAuthHydrated } from '@/lib/store/auth';
import { useRouter } from 'next/navigation';

interface OtpLockedUser {
  phone_prefix: string;
  locked_until: string;
  attempt_count: number;
}

interface HighFailureUser {
  phone_prefix: string;
  attempt_count: number;
}

interface SuspiciousEvent {
  user_public_id: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface SessionAnomaly {
  user_public_id: string;
  distinct_ip_count: number;
}

interface SecurityOverview {
  otp_locked_users: OtpLockedUser[];
  high_failure_users: HighFailureUser[];
  recent_suspicious_events: SuspiciousEvent[];
  session_anomalies: SessionAnomaly[];
}

export default function AdminSecurityPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const hydrated = useAuthHydrated();
  const [data, setData] = useState<SecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && (!isAuthenticated || (!user?.is_admin && !user?.is_staff))) {
      router.replace('/auth?next=/admin/security');
    }
  }, [hydrated, isAuthenticated, user, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    apiClient.get('/users/admin/security-overview/')
      .then((res) => setData(res.data))
      .catch(() => setError(t('errors.somethingWrong')))
      .finally(() => setLoading(false));
  }, [isAuthenticated, t]);

  if (!hydrated) return null;

  return (
    <AdminLayout>
      <div className="container-page py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-eyebrow">{t('admin.title')}</p>
          <h1 className="display-md mt-2">{t('security.title')}</h1>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-primary" strokeWidth={2} />
          </div>
        ) : error ? (
          <div className="surface-elevated p-6 text-center text-danger">{error}</div>
        ) : data ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {/* OTP Locked Users */}
            <SecurityCard
              icon={Lock}
              title={t('security.otpLockedUsers')}
              count={data.otp_locked_users.length}
              tone="text-danger"
            >
              {data.otp_locked_users.length === 0 ? (
                <p className="text-sm text-fg-muted">{t('security.noLockedUsers')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                      <th className="pb-2 text-left">{t('security.phonePrefix')}</th>
                      <th className="pb-2 text-left">{t('security.attempts')}</th>
                      <th className="pb-2 text-left">{t('security.lockedUntil')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.otp_locked_users.map((u, i) => (
                      <tr key={i} className="py-2">
                        <td className="py-2 font-mono text-fg">{u.phone_prefix}***</td>
                        <td className="py-2 text-danger font-semibold">{u.attempt_count}</td>
                        <td className="py-2 text-fg-muted text-xs">{new Date(u.locked_until).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SecurityCard>

            {/* High Failure Users */}
            <SecurityCard
              icon={AlertTriangle}
              title={t('security.highFailureUsers')}
              count={data.high_failure_users.length}
              tone="text-warning"
            >
              {data.high_failure_users.length === 0 ? (
                <p className="text-sm text-fg-muted">{t('security.noHighFailureUsers')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                      <th className="pb-2 text-left">{t('security.phonePrefix')}</th>
                      <th className="pb-2 text-left">{t('security.attempts')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.high_failure_users.map((u, i) => (
                      <tr key={i}>
                        <td className="py-2 font-mono text-fg">{u.phone_prefix}***</td>
                        <td className="py-2 text-warning font-semibold">{u.attempt_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SecurityCard>

            {/* Recent Suspicious Events */}
            <SecurityCard
              icon={ShieldAlert}
              title={t('security.recentSuspiciousEvents')}
              count={data.recent_suspicious_events.length}
              tone="text-danger"
            >
              {data.recent_suspicious_events.length === 0 ? (
                <p className="text-sm text-fg-muted">{t('security.noSuspiciousEvents')}</p>
              ) : (
                <div className="space-y-2">
                  {data.recent_suspicious_events.map((e, i) => (
                    <div key={i} className="rounded-xl bg-bg-subtle p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-fg-muted">{e.ip_address ?? t('security.unknown')}</span>
                        <span className="text-xs text-fg-subtle">{new Date(e.created_at).toLocaleString()}</span>
                      </div>
                      {e.user_public_id && (
                        <p className="mt-1 text-xs text-fg-muted">{t('security.userLabel')}: {e.user_public_id}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SecurityCard>

            {/* Session Anomalies */}
            <SecurityCard
              icon={Activity}
              title={t('security.sessionAnomalies')}
              count={data.session_anomalies.length}
              tone="text-warning"
            >
              {data.session_anomalies.length === 0 ? (
                <p className="text-sm text-fg-muted">{t('security.noAnomalies')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                      <th className="pb-2 text-left">{t('security.userId')}</th>
                      <th className="pb-2 text-left">{t('security.distinctIps')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.session_anomalies.map((a, i) => (
                      <tr key={i}>
                        <td className="py-2 font-mono text-xs text-fg">{a.user_public_id}</td>
                        <td className="py-2 text-warning font-semibold">{a.distinct_ip_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </SecurityCard>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}

function SecurityCard({
  icon: Icon,
  title,
  count,
  tone,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count: number;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="surface-elevated p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${tone}`} strokeWidth={1.75} />
          <h2 className="display-sm">{title}</h2>
        </div>
        <span className={`text-2xl font-bold ${tone}`}>{count}</span>
      </div>
      {children}
    </motion.div>
  );
}
