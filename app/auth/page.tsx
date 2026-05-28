'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground';
import { CodeInput } from '@/components/auth/CodeInput';
import { authApi, AuthApiError } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';

const TG_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'sayin_global_bot';

type Stage = 'open-bot' | 'enter-code' | 'success';

export default function AuthPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.user);

  const nextPath = searchParams.get('next') || '';

  // If the user is already authenticated, do not display the auth screen.
  // Redirect to the appropriate landing page immediately.
  useEffect(() => {
    if (!isAuthenticated) return;
    const target = nextPath || (currentUser?.is_admin ? '/admin' : '/dashboard');
    if (typeof window !== 'undefined') {
      window.location.replace(target);
    } else {
      router.replace(target);
    }
  }, [isAuthenticated, currentUser?.is_admin, nextPath, router]);

  const [stage, setStage] = useState<Stage>('open-bot');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lockRetryAfter, setLockRetryAfter] = useState(0);

  const openTelegramBot = () => {
    const url = `https://t.me/${TG_BOT}?start=auth`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setStage('enter-code');
  };

  const handleVerify = async () => {
    if (code.length !== 5) {
      setErrorMessage(t('auth.errorInvalidCode'));
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await authApi.verifyCode({ code });

      // Admin users are now allowed to log in via web — they get redirected to /admin.
      // No blocking here. The middleware handles routing.

      // Atomic write: tokens + user + cookie BEFORE we navigate.
      setSession(result.tokens.access, result.tokens.refresh, result.user);

      // Decide destination. is_admin → /admin, otherwise honour ?next=, fall
      // back to /dashboard.
      const target =
        nextPath || (result.user?.is_admin ? '/admin' : '/dashboard');

      // Critical fix for the "Redirecting..." freeze that users hit on
      // successful login: do a full document navigation so the destination
      // page boots with a clean React tree, the middleware re-evaluates the
      // freshly-written cookie, and there is no possibility of a Zustand
      // hydration race or duplicate router.replace from this page's own
      // "already authenticated" effect.
      //
      // Tradeoff: ~200 ms extra paint vs hard guarantee the user actually
      // lands on the destination — chosen deliberately.
      if (typeof window !== 'undefined') {
        window.location.replace(target);
        return;
      }
      router.replace(target);
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.message === 'invalid_or_expired_code' || err.status === 400) {
          setErrorMessage(t('auth.errorInvalidOrExpiredCode'));
        } else if (err.message === 'admin_blocked' || err.status === 403) {
          // Old backend behavior — now admin can log in. Show generic error.
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

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />

      <main className="relative flex-1 flex items-center justify-center isolate overflow-hidden">
        <AtmosphericBackground variant="hero" showHills />

        <div className="container-page relative z-10 py-12 sm:py-20">
          <div className="mx-auto w-full max-w-md">
            <AnimatePresence mode="wait">
              {stage === 'open-bot' && (
                <OpenBotStage key="open" onContinue={openTelegramBot} />
              )}

              {stage === 'enter-code' && (
                <EnterCodeStage
                  key="code"
                  code={code}
                  setCode={(v) => {
                    setCode(v);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  submitting={submitting}
                  errorMessage={errorMessage}
                  lockRetryAfter={lockRetryAfter}
                  onSubmit={handleVerify}
                  onBack={() => {
                    setStage('open-bot');
                    setCode('');
                    setErrorMessage(null);
                    setLockRetryAfter(0);
                  }}
                  onResend={openTelegramBot}
                />
              )}

              {stage === 'success' && <SuccessStage key="success" />}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

function OpenBotStage({ onContinue }: { onContinue: () => void }) {
  const t = useTranslations();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="surface-elevated p-8 sm:p-10"
    >
      <div className="text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
          <ShieldCheck className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="display-md mt-6">{t('auth.title')}</h1>
        <p className="mt-2 text-sm text-fg-muted">{t('auth.subtitle')}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-bg-subtle p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
            1
          </span>
          <div>
            <h2 className="font-semibold text-fg">{t('auth.openBotTitle')}</h2>
            <p className="mt-1 text-sm text-fg-muted">
              {t('auth.openBotDescription')}
            </p>
          </div>
        </div>
      </div>

      <button onClick={onContinue} className="btn btn-primary btn-lg mt-6 w-full group">
        {t('auth.openBotButton')}
        <ExternalLink
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </button>

      <div className="mt-6 flex items-start gap-2 rounded-xl bg-bg-subtle/60 p-3 text-xs text-fg-subtle">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-accent" strokeWidth={2} />
        <p>{t('auth.securityDescription')}</p>
      </div>
    </motion.div>
  );
}

function EnterCodeStage({
  code,
  setCode,
  submitting,
  errorMessage,
  lockRetryAfter,
  onSubmit,
  onBack,
  onResend,
}: {
  code: string;
  setCode: (v: string) => void;
  submitting: boolean;
  errorMessage: string | null;
  lockRetryAfter: number;
  onSubmit: () => void;
  onBack: () => void;
  onResend: () => void;
}) {
  const t = useTranslations();

  const verifyDisabled = code.length !== 5 || submitting || lockRetryAfter > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="surface-elevated p-8 sm:p-10"
    >
      <button
        type="button"
        onClick={onBack}
        className="btn btn-ghost btn-sm -ml-2 mb-2"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        {t('common.back')}
      </button>

      <div className="text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <h1 className="display-md mt-6">{t('auth.enterCodeTitle')}</h1>
        <p className="mt-2 text-sm text-fg-muted">
          {t('auth.enterCodeDescription')}
        </p>
      </div>

      <div className="mt-8">
        {/* OTP brute-force lock banner */}
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
          onChange={setCode}
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
              className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                strokeWidth={2.25}
              />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        onClick={onSubmit}
        disabled={verifyDisabled}
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

      {/* Resend — always active, just reopens the Telegram bot.
          No countdown timer. OTP validity is 10 minutes and the
          backend enforces a 60s cooldown; the bot itself notifies
          the user when cooldown is active. */}
      <div className="mt-5 flex flex-col items-center gap-1.5 text-center text-sm">
        <span className="text-fg-muted">{t('auth.didntReceiveCode')}</span>
        <button
          onClick={onResend}
          type="button"
          disabled={submitting}
          className="inline-flex items-center gap-1.5 font-semibold text-brand-primary transition-opacity hover:underline disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
          {t('auth.resendCode')}
        </button>
      </div>
    </motion.div>
  );
}

function SuccessStage() {
  const t = useTranslations();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="surface-elevated p-10 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 240, damping: 18 }}
        className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success"
      >
        <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
      </motion.div>
      <h1 className="display-md mt-6">{t('auth.successTitle')}</h1>
      <p className="mt-2 text-sm text-fg-muted">{t('auth.successDescription')}</p>
      <div className="mt-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-brand-primary" strokeWidth={2} />
      </div>
    </motion.div>
  );
}
