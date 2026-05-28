'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ' },
  { code: 'uz-cyrl', label: 'Ўзбекча', short: 'УЗ' },
  { code: 'ru', label: 'Русский', short: 'RU' },
  { code: 'en', label: 'English', short: 'EN' },
] as const;

const COOKIE = 'sayin-locale';
const ONE_YEAR = 60 * 60 * 24 * 365;

function setLocaleCookie(locale: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE}=${locale}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const switchTo = (code: string) => {
    setOpen(false);
    setLocaleCookie(code);
    // Force full page reload so Next.js server reads the new cookie
    window.location.reload();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={current.label}
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 text-sm font-medium text-fg transition-colors hover:bg-bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Globe className="h-[16px] w-[16px]" strokeWidth={1.75} />
        <span>{current.short}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-12 z-[60] w-48 overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lift"
          >
            <div className="p-1.5">
              {LANGUAGES.map((lang) => {
                const active = lang.code === locale;
                return (
                  <button
                    key={lang.code}
                    onClick={() => switchTo(lang.code)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                        : 'text-fg hover:bg-bg-subtle'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {active && <Check className="h-4 w-4" strokeWidth={2.25} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
