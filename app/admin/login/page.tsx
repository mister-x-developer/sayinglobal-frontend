'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Lock,
  LogIn,
  Shield,
  User,
} from 'lucide-react';

import { authApi, AuthApiError } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth';
import { CodeInput } from '@/components/auth/CodeInput';

const TG_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'sayin_global_bot';

type Tab = 'credentials' | 'otp';

export default function AdminLoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [tab, setTab] = useState<Tab>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredentialsLogin = async () => {
    if (!username.trim() || !password) {
      setError('Enter both username and password');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      setSession(result.tokens.access, result.tokens.refresh, result.user);
      if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
        window.location.replace('/admin');
        return;
      }
      router.replace('/admin');
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.message === 'invalid_credentials') {
          setError('Invalid username or password');
        } else if (err.message === 'not_admin') {
          setError('This account does not have admin access');
        } else if (err.status === 429) {
          setError('Too many attempts. Please wait and try again.');
        } else {
          setError(err.message || 'Login failed');
        }
      } else {
        setError('Network error. Check your connection.');
      }
      setSubmitting(false);
    }
  };

  const handleOtpLogin = async () => {
    if (code.length !== 5) {
      setError('Enter the 5-digit code');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await authApi.verifyCode({ code });
      if (!result.user?.is_admin && !result.user?.is_staff) {
        setError('This account does not have admin access');
        setSubmitting(false);
        return;
      }
      setSession(result.tokens.access, result.tokens.refresh, result.user);
      if (typeof window !== 'undefined' && !Capacitor.isNativePlatform()) {
        window.location.replace('/admin');
        return;
      }
      router.replace('/admin');
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.message === 'invalid_or_expired_code') {
          setError('Code is invalid or expired');
        } else if (err.message === 'otp_locked') {
          setError('Too many failed attempts. Please wait.');
        } else {
          setError(err.message || 'Verification failed');
        }
      } else {
        setError('Network error. Check your connection.');
      }
      setSubmitting(false);
    }
  };

  const openBot = () => {
    window.open(`https://t.me/${TG_BOT}?start=auth`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-accent/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-primary/[0.03] blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-primary/10 mb-4">
              <Shield className="w-7 h-7 text-brand-primary" strokeWidth={1.75} />
            </div>
            <h1 className="text-2xl font-bold text-fg tracking-tight">
              SAYIN<span className="text-brand-accent">.</span> Admin
            </h1>
            <p className="text-sm text-fg-muted mt-1">{t('Auth.adminPanel')}</p>
          </div>

          {/* Card */}
          <div className="surface-elevated p-8">
            {/* Tabs */}
            <div className="flex rounded-xl bg-bg-subtle border border-border p-1 mb-8">
              <button
                type="button"
                onClick={() => { setTab('credentials'); setError(null); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  tab === 'credentials'
                    ? 'bg-white text-fg shadow-sm dark:bg-bg'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                Login / Password
              </button>
              <button
                type="button"
                onClick={() => { setTab('otp'); setError(null); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  tab === 'otp'
                    ? 'bg-white text-fg shadow-sm dark:bg-bg'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                OTP Code
              </button>
            </div>

            <AnimatePresence mode="wait">
              {tab === 'credentials' ? (
                <motion.div
                  key="credentials"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Username */}
                  <label className="block text-sm font-medium text-fg mb-2">Username</label>
                  <div className="relative mb-5">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); if (error) setError(null); }}
                      placeholder="admin"
                      autoComplete="username"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-bg-subtle text-fg text-sm font-medium placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleCredentialsLogin()}
                    />
                  </div>

                  {/* Password */}
                  <label className="block text-sm font-medium text-fg mb-2">Password</label>
                  <div className="relative mb-6">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-subtle" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-bg-subtle text-fg text-sm font-medium placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleCredentialsLogin()}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCredentialsLogin}
                    disabled={submitting || !username.trim() || !password}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Step 1: Open bot */}
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-subtle p-4 mb-6">
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-xs font-bold text-white">
                      1
                    </span>
                    <div>
                      <p className="text-sm font-medium text-fg">{t('Auth.getCodeFromBot')}</p>
                      <button
                        type="button"
                        onClick={openBot}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
                      >
                        Open Telegram Bot
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Enter code */}
                  <div className="flex items-start gap-3 mb-4">
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-accent text-xs font-bold text-white">
                      2
                    </span>
                    <p className="text-sm font-medium text-fg mt-0.5">{t('Auth.enterCode')}</p>
                  </div>

                  <CodeInput
                    value={code}
                    onChange={(v) => { setCode(v); if (error) setError(null); }}
                    length={5}
                    disabled={submitting}
                    hasError={!!error}
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={handleOtpLogin}
                    disabled={submitting || code.length !== 5}
                    className="btn btn-primary btn-lg w-full mt-6"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Verify & Sign In
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 w-4 h-4 flex-shrink-0" strokeWidth={2.25} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-xs text-fg-subtle mt-6">
            Only admin accounts can access this panel
          </p>
        </motion.div>
      </div>
    </div>
  );
}
