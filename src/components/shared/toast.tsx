'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, WarningCircle, Warning, Info } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

export type ToastArg =
  | string
  | {
      title?: string;
      message?: string;
      type?: ToastVariant;
      variant?: ToastVariant;
    };

export type ToastFn = ((arg: ToastArg, variant?: ToastVariant) => void) & {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

interface ToastContextValue {
  toast: ToastFn;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-success/40 bg-success/10 shadow-[0_0_20px_var(--et-success-glow)]',
  error: 'border-danger/40 bg-danger/10 shadow-[0_0_20px_var(--et-danger-glow)]',
  warning: 'border-warning/40 bg-warning/10 shadow-[0_0_20px_var(--et-warning-glow)]',
  info: 'border-info/40 bg-info/10 shadow-[0_0_20px_var(--et-info-glow)]',
};

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: <AppIcon icon={CheckCircle} size={20} weight="fill" className="text-success shrink-0" />,
  error: <AppIcon icon={WarningCircle} size={20} weight="fill" className="text-danger shrink-0" />,
  warning: <AppIcon icon={Warning} size={20} weight="fill" className="text-warning shrink-0" />,
  info: <AppIcon icon={Info} size={20} weight="fill" className="text-info shrink-0" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastBase = useCallback(
    (arg: ToastArg, variant: ToastVariant = 'info') => {
      let finalMsg = '';
      let finalVariant = variant;

      if (typeof arg === 'string') {
        finalMsg = arg;
      } else if (arg && typeof arg === 'object') {
        const title = arg.title ? `${arg.title}: ` : '';
        finalMsg = `${title}${arg.message ?? ''}`.trim() || 'Notification';
        finalVariant = arg.variant || arg.type || variant;
      }

      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, message: finalMsg, variant: finalVariant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const toast = useMemo<ToastFn>(() => {
    return Object.assign(
      (arg: ToastArg, variant?: ToastVariant) => toastBase(arg, variant),
      {
        success: (msg: string) => toastBase(msg, 'success'),
        error: (msg: string) => toastBase(msg, 'error'),
        warning: (msg: string) => toastBase(msg, 'warning'),
        info: (msg: string) => toastBase(msg, 'info'),
      },
    );
  }, [toastBase]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed right-4 bottom-24 z-[100] flex flex-col gap-2 md:right-6 md:bottom-6 select-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'animate-slide-up flex max-w-xs items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl',
              variantStyles[t.variant],
            )}
            style={{ animationFillMode: 'both' }}
          >
            {variantIcons[t.variant]}
            <p className="flex-1 text-sm font-bold text-white">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted shrink-0 rounded-lg p-0.5 transition-colors hover:text-white cursor-pointer"
            >
              <AppIcon icon={X} size={16} weight="bold" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
