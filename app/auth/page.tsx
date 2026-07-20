'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground';
import { CodeInput } from '@/components/auth/CodeInput';
import { authApi, AuthApiError } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const TG_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'sayin_global_bot';

// Simplified to only code entry as per requirements (open bot via Telegram to receive code, then enter code only)

function AuthPageContent() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.user);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const nextPath = searchParams.get('next') || '';

  // If the user is already authenticated, do not display the auth screen.
  // Redirect to the appropriate landing page immediately.
  // NOTE: Only redirect after hydration to avoid false redirects on cold start.
  useEffect(() => {
    if (!isAuthenticated) return;
    const target = nextPath || (currentUser?.is_admin || currentUser?.is_admin_account ? '/admin/' : '/dashboard/');
    router.replace(target);
  }, [isAuthenticated, currentUser?.is_admin, currentUser?.is_admin_account, nextPath, router]);

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockRetryAfter, setLockRetryAfter] = useState(0);

  const openTelegramBot = () => {
    const url = `https://t.me/${TG_BOT}?start=auth`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleVerify = async () => {
    if (code.length !== 5) {
      setErrorMessage(t('auth.errorInvalidCode'));
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);

    try {
      let recaptchaToken = undefined;
      if (executeRecaptcha && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        recaptchaToken = await executeRecaptcha('verify_code');
      }
      
      const result = await authApi.verifyCode({ code, recaptcha_token: recaptchaToken });

      // Admin users are now allowed to log in via web — they get redirected to /admin.
      // No blocking here. The middleware handles routing.

      // Atomic write: tokens + user + cookie BEFORE we navigate.
      setSession(result.tokens.access, result.tokens.refresh, result.user);

      // Decide destination. is_admin → /admin, otherwise honour ?next=, fall
      // back to /dashboard.
      const target =
        nextPath || (result.user?.is_admin || result.user?.is_admin_account ? '/admin/' : '/dashboard/');

      router.replace(target);
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.data?.error === 'recaptcha_failed') { setErrorMessage("ReCAPTCHA xatosi: " + err.data.message); } else if (err.message === 'invalid_or_expired_code' || err.status === 400) {
          setErrorMessage(t('auth.errorInvalidOrExpiredCode'));
        } else if (err.message === 'admin_blocked' || err.status === 403) {
          setErrorMessage(t('auth.errorInvalidCode'));
        } else if (err.message === 'otp_locked' && typeof err.data?.retry_after === 'number') {
          setLockRetryAfter(err.data.retry_after as number);
        } else if (err.status === 429) {
          setErrorMessage(t('auth.errorRateLimited'));
        } else if (err.status === null) {
          // Network error — could be CORS, DNS, or backend down
          // ERR_NETWORK = CORS blocked, ECONNABORTED = timeout
          const isTimeout = err.message === 'ECONNABORTED' || err.message === 'ERR_NETWORK';
          setErrorMessage(t('auth.errorNetwork'));
        } else {
          setErrorMessage(t('auth.errorInvalidCode'));
        }
      } else {
        setErrorMessage(t('auth.errorNetwork'));
      }
      setSubmitting(false);
    }
  };

  // UX Improvement: Auto-submit when code is fully entered
  useEffect(() => {
    if (code.length === 5 && !submitting && !errorMessage && lockRetryAfter === 0) {
      handleVerify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      <main className="relative flex-1 flex isolate overflow-y-auto overflow-x-hidden">
        <AtmosphericBackground variant="hero" showHills />

        <div className="container-page relative z-10 py-12 sm:py-20 my-auto">
          <div className="mx-auto w-full max-w-md">
            <div className="surface-elevated p-8 sm:p-10">
              <div className="text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
                  <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <h1 className="display-md mt-6">{t('auth.enterCodeTitle')}</h1>
                <p className="mt-2 text-sm text-fg-muted">
                  {t('auth.enterCodeDescription')}
                </p>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={openTelegramBot}
                  className="btn btn-secondary w-full mb-4"
                >
                  {t('auth.openBotButton')} <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                {/* OTP lock banner */}
                <AnimatePresence>
                  {lockRetryAfter > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="mb-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
                      role="alert"
                    >
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 flex-shrink-0"
                        strokeWidth={2.25}
                      />
                      <span className="font-semibold">
                        {t('auth.otpLocked')}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <CodeInput
                  value={code}
                  onChange={(v) => {
                    setCode(v);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  length={5}
                  disabled={submitting}
                  hasError={!!errorMessage}
                  autoFocus
                />

                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={2.25} />
                        <span>{errorMessage}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={code.length !== 5 || submitting || lockRetryAfter > 0}
                className="btn btn-primary btn-lg mt-6 w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} />
                    {t('auth.verifying')}
                  </>
                ) : (
                  <>
                    {t('auth.verifyButton')}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </>
                )}
              </button>

              <div className="mt-5 flex flex-col items-center gap-1.5 text-center text-sm">
                <span className="text-fg-muted">{t('auth.didntReceiveCode')}</span>
                <button
                  onClick={openTelegramBot}
                  type="button"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 font-semibold text-brand-primary transition-opacity hover:underline disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
                  {t('auth.resendCode')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

export default function AuthPage() {
  const t = useTranslations();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">{t('common.loading') || 'Loading...'}</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
