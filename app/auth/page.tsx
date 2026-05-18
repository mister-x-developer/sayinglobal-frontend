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
  Timer,
} from 'lucide-react';

import { LandingNav } from '@/components/layout/LandingNav';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { AtmosphericBackground } from '@/components/shared/AtmosphericBackground';
import { CodeInput } from '@/components/auth/CodeInput';
import { authApi, AuthApiError } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';

const TG_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'sayinglobal_bot';

const COOLDOWN_MS = 60_000;
const EXPIRED_MS = 10 * 60_000;

function formatMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Stage = 'open-bot' | 'enter-code' | 'success';

export default function AuthPage() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setTokens } = useAuthStore();

  const nextPath = searchParams.get('next') || '/dashboard';

  const [stage, setStage] = useState<Stage>('open-bot');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // `issuedAt` is hoisted to the parent so a verify-time cooldown
  // response (`error: 'otp_cooldown'` + `retry_after`) can re-align
  // the local countdown by mutating `issuedAt` from the verify
  // handler that lives here.
  const [issuedAt, setIssuedAt] = useState<number | null>(null);
  // `lockRetryAfter` is hoisted so the parent `handleVerify` can set
  // it when the backend returns `otp_locked`.
  const [lockRetryAfter, setLockRetryAfter] = useState(0);

  const openTelegramBot = () => {
    const url = `https://t.me/${TG_BOT}?start=auth`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIssuedAt(Date.now());
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
      const result = await authApi.verifyCode({
        code,
        // Do NOT send phone as fallback — the backend uses code-only lookup.
        // Sending phone: code was causing "not found" errors.
      });
      setUser(result.user);
      setTokens(result.tokens.access, result.tokens.refresh);
      setStage('success');
      // Marketplace admin → admin panel automatically.
      // Regular users → the next path requested (defaults to /dashboard).
      const target = result.user.is_admin ? '/admin' : nextPath;
      setTimeout(() => router.push(target), 1200);
    } catch (err: unknown) {
      // Verify-time cooldown branch: the backend may answer the
      // verify with a 429 if the issuance pipeline rate-limited.
      // Re-align the local countdown with the server's remaining
      // cooldown and surface the dedicated `auth.requestCooldown`
      // copy instead of a generic invalid-code message.
      if (err instanceof AuthApiError) {
        if (
          err.message === 'otp_cooldown' &&
          typeof err.data?.retry_after === 'number'
        ) {
          const retryAfter = err.data.retry_after as number;
          // Place `issuedAt` so that the derived `secondsRemaining`
          // equals `retryAfter` on the next tick:
          //   secondsRemaining = ceil((issuedAt + 60_000 - now) / 1000)
          //   ⇒ issuedAt = now - (60_000 - retryAfter * 1000)
          setIssuedAt(Date.now() - (COOLDOWN_MS - retryAfter * 1000));
          setErrorMessage(
            t('auth.requestCooldown', { time: formatMSS(retryAfter) }),
          );
        } else if (err.message === 'invalid_or_expired_code') {
          setErrorMessage(t('auth.errorInvalidOrExpiredCode'));
        } else if (err.message === 'admin_blocked' || err.status === 403) {
          // F-31/F-32: admin attempts to use the user app — show ONLY the
          // localized "This application is for marketplace users." line.
          // No tokens persisted (this branch is reached BEFORE setUser/setTokens).
          setErrorMessage(t('auth.errorAdminBlocked'));
        } else if (err.message === 'otp_locked' && typeof err.data?.retry_after === 'number') {
          setLockRetryAfter(err.data.retry_after as number);
        } else if (err.message === 'phone_not_supported') {
          setErrorMessage(t('auth.errorPhoneNotSupported'));
        } else if (err.status === 429) {
          setErrorMessage(t('auth.errorRateLimited'));
        } else {
          setErrorMessage(t('auth.errorInvalidCode'));
        }
      } else {
        setErrorMessage(t('auth.errorInvalidCode'));
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
                  setErrorMessage={setErrorMessage}
                  issuedAt={issuedAt ?? Date.now()}
                  setIssuedAt={setIssuedAt}
                  lockRetryAfter={lockRetryAfter}
                  setLockRetryAfter={setLockRetryAfter}
                  onSubmit={handleVerify}
                  onBack={() => setStage('open-bot')}
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
  setErrorMessage,
  issuedAt,
  setIssuedAt,
  lockRetryAfter,
  setLockRetryAfter,
  onSubmit,
  onBack,
}: {
  code: string;
  setCode: (v: string) => void;
  submitting: boolean;
  errorMessage: string | null;
  setErrorMessage: (v: string | null) => void;
  issuedAt: number;
  setIssuedAt: (v: number) => void;
  lockRetryAfter: number;
  setLockRetryAfter: (v: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const t = useTranslations();

  // 1-second tick drives the live countdown and the 10-minute
  // expired-banner cross-over. We avoid heavyweight effects — a
  // single setInterval is fine and is cleaned up on unmount.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Decrement the OTP lock countdown every second while active.
  useEffect(() => {
    if (lockRetryAfter <= 0) return;
    const id = setInterval(() => {
      setLockRetryAfter(Math.max(0, lockRetryAfter - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [lockRetryAfter, setLockRetryAfter]);

  const secondsRemaining = Math.max(
    0,
    Math.ceil((issuedAt + COOLDOWN_MS - now) / 1000),
  );
  const expired = now - issuedAt > EXPIRED_MS;

  // Resend = re-open the Telegram bot (matches mobile UX contract).
  // No phone re-entry, no requestCode REST call. The bot itself issues
  // a fresh OTP via the "Get code" button and respects backend cooldown.
  const handleResend = () => {
    if (submitting || secondsRemaining > 0) return;
    const url = `https://t.me/${TG_BOT}?start=auth`;
    window.open(url, '_blank', 'noopener,noreferrer');
    // Reset the issuance moment so the 60s cooldown UI restarts.
    setIssuedAt(Date.now());
    setErrorMessage(null);
  };

  const resendDisabled = submitting || secondsRemaining > 0;
  const verifyDisabled = code.length !== 5 || submitting || expired || lockRetryAfter > 0;

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
        {/* OTP lock banner — shown when the backend returns otp_locked.
            Countdown decrements every second; verify button is disabled
            while lockRetryAfter > 0. */}
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
                {t('auth.otpLocked', { time: formatMSS(lockRetryAfter) })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 10-minute expired banner — shown above CodeInput per
            design.md change #16. The verify button is disabled while
            this banner is visible. Lucide AlertTriangle, no emoji. */}
        <AnimatePresence>
          {expired && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.22 }}
              className="mb-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-sm text-warning"
              role="alert"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                strokeWidth={2.25}
              />
              <span className="font-semibold">{t('auth.codeExpired')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <CodeInput
          value={code}
          onChange={setCode}
          length={5}
          disabled={submitting || expired}
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

      <div className="mt-5 flex flex-col items-center gap-1.5 text-center text-sm">
        <span className="text-fg-muted">{t('auth.didntReceiveCode')}</span>
        <button
          onClick={handleResend}
          type="button"
          disabled={resendDisabled}
          className={`inline-flex items-center gap-1.5 font-semibold transition-opacity ${
            resendDisabled
              ? 'cursor-not-allowed text-fg-muted opacity-70'
              : 'text-brand-primary hover:underline'
          }`}
          aria-disabled={resendDisabled}
        >
          {secondsRemaining > 0 ? (
            <>
              <Timer className="h-3.5 w-3.5" strokeWidth={2.25} />
              {t('auth.resendIn', { time: formatMSS(secondsRemaining) })}
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.25} />
              {t('auth.resendCode')}
            </>
          )}
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
