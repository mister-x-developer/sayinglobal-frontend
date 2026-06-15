'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { create } from 'zustand';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  href?: string;
  onClick?: () => void;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (t: Omit<ToastItem, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (t) => {
    const id = Math.random().toString(36).slice(2, 9);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    // Slightly longer for calm reading
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, t.duration ?? 5200);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

const ICON: Record<ToastType, React.ComponentType<any>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const TONE_CLASS: Record<ToastType, string> = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
  info: 'toast-info',
};

export function ToastContainer() {
  const { toasts, remove } = useToastStore();
  const router = useRouter();
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  return (
    <div className="pointer-events-none fixed bottom-[calc(84px+env(safe-area-inset-bottom,0px))] right-4 z-[2000] flex flex-col gap-2.5 sm:bottom-5 sm:right-5">
      <AnimatePresence>
        {toasts.map((item) => {
          const Icon = ICON[item.type];
          const isActionable = !!(item.href || item.onClick);

          const handleAction = () => {
            if (item.onClick) item.onClick();
            if (item.href) router.push(item.href);
            remove(item.id);
          };

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.2, 1, 0.3, 1] }}
              onClick={isActionable ? handleAction : undefined}
              role={isActionable ? 'button' : undefined}
              tabIndex={isActionable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isActionable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleAction();
                }
              }}
              className={`toast pointer-events-auto group flex w-[320px] max-w-[calc(100vw-2rem)] items-start gap-3 border p-4 shadow-xl ${TONE_CLASS[item.type]} ${isActionable ? 'cursor-pointer active:opacity-95' : ''}`}
            >
              <div className="mt-0.5 flex-shrink-0">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="text-[14.5px] font-semibold leading-snug tracking-[-0.1px] text-fg">
                  {item.title === 'SERVER_ERROR' ? tErrors('serverError') : item.title}
                </div>
                {item.message && (
                  <div className="mt-1 text-[13px] leading-snug text-fg-muted">
                    {item.message === 'SERVER_ERROR' ? tErrors('serverError') : item.message}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(item.id); }}
                className="ml-1 mt-0.5 flex-shrink-0 rounded-full p-1 text-fg-subtle opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5"
                aria-label={tCommon('close')}
              >
                <X className="h-4 w-4" strokeWidth={2.25} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export const toast = {
  success: (title: string, message?: string, href?: string) =>
    useToastStore.getState().add({ type: 'success', title, message, href }),
  error: (title: string, message?: string, href?: string) =>
    useToastStore.getState().add({ type: 'error', title, message, href }),
  warning: (title: string, message?: string, href?: string) =>
    useToastStore.getState().add({ type: 'warning', title, message, href }),
  info: (title: string, message?: string, href?: string) =>
    useToastStore.getState().add({ type: 'info', title, message, href }),
  notification: (title: string, message: string | undefined, href: string, onRead?: () => void) =>
    useToastStore.getState().add({
      type: 'info',
      title,
      message,
      href,
      duration: 6500,
      onClick: onRead ? () => { onRead(); } : undefined,
    }),
};
