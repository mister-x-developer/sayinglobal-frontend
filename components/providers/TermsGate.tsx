'use client';

/**
 * Terms acceptance gate.
 *
 * Mounts inside the authenticated layer of the app. If the signed-in user
 * has not accepted the current platform-terms version, this component
 * blocks the screen with a non-dismissible modal and POSTs the acceptance
 * before letting the user through.
 *
 * Behaviour:
 *  - Skipped on /auth, /admin (admins are exempt), and the public landing.
 *  - On mount: reads /users/auth/terms/ to decide whether to show the modal.
 *  - On accept: POSTs /users/auth/terms/, updates auth-store user, hides modal.
 *  - The modal is keyboard-blocked (no ESC), and the user cannot scroll the
 *    page behind it. The only exit is "Roziman" (Accept).
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { usersApi } from '@/lib/api/users';

const SKIP_PATHS = ['/', '/auth'];

export function TermsGate() {
  const t = useTranslations();
  const pathname = usePathname() || '/';
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);

  const shouldEvaluate = useMemo(() => {
    if (!isAuthenticated) return false;
    if (SKIP_PATHS.includes(pathname)) return false;
    if (pathname.startsWith('/admin')) return false; // admins are exempt
    if (user?.is_admin) return false;
    return true;
  }, [isAuthenticated, pathname, user?.is_admin]);

  useEffect(() => {
    if (!shouldEvaluate) {
      setOpen(false);
      return;
    }

    let alive = true;
    // If we already know acceptance from cached user state, skip the network roundtrip.
    if (user?.terms_accepted_at) {
      setOpen(false);
      return;
    }
    usersApi
      .getTerms()
      .then((data) => {
        if (!alive || !data) return;
        if (!data.accepted) {
          setOpen(true);
        } else {
          updateUser({ terms_accepted_at: data.accepted_at ?? undefined });
          setOpen(false);
        }
      })
      .catch(() => {/* network — leave gate closed, retry on next nav */});
    return () => {
      alive = false;
    };
  }, [shouldEvaluate, user?.terms_accepted_at, updateUser]);

  // Lock body scroll while the gate is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const accept = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await usersApi.acceptTerms();
      if (result?.accepted_at) {
        updateUser({ terms_accepted_at: result.accepted_at });
      } else {
        updateUser({ terms_accepted_at: new Date().toISOString() });
      }
      setOpen(false);
    } catch {
      // surface as non-blocking; keep modal open and let user retry
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 px-4 pb-4 pt-10 sm:items-center sm:pb-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-gate-title"
    >
      <div className="surface-elevated w-full max-w-lg overflow-hidden">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-accent/12 text-brand-accent">
              <ShieldAlert className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 id="terms-gate-title" className="display-sm">{t('terms.title')}</h2>
              <p className="mt-0.5 text-xs text-fg-subtle">{t('terms.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 text-sm leading-relaxed text-fg">
          <p className="text-fg-muted">{t('terms.intro')}</p>

          <ol className="mt-4 space-y-3 text-fg">
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-bg-subtle text-[11px] font-bold text-fg-muted">
                1
              </span>
              <span>{t('terms.point1')}</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-bg-subtle text-[11px] font-bold text-fg-muted">
                2
              </span>
              <span>{t('terms.point2')}</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-bg-subtle text-[11px] font-bold text-fg-muted">
                3
              </span>
              <span>{t('terms.point3')}</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-bg-subtle text-[11px] font-bold text-fg-muted">
                4
              </span>
              <span>{t('terms.point4')}</span>
            </li>
          </ol>

          <p className="mt-5 rounded-xl bg-bg-subtle p-4 text-xs text-fg-muted">
            {t('terms.disclaimer')}
          </p>
        </div>

        <div className="border-t border-border px-6 py-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary"
            />
            <span className="text-sm text-fg">{t('terms.checkboxLabel')}</span>
          </label>

          <button
            type="button"
            onClick={accept}
            disabled={!checked || submitting}
            className="btn btn-primary btn-lg mt-4 w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                {t('common.loading')}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
                {t('terms.accept')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
