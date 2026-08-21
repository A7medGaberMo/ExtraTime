'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, WarningCircle, Warning, Info } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-lime/40 bg-lime/10 shadow-[0_0_20px_rgba(149,232,16,0.15)]',
  error: 'border-rose-500/40 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
  warning: 'border-amber-500/40 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  info: 'border-sky-500/40 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.15)]',
};

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: <AppIcon icon={CheckCircle} size={20} weight="fill" className="text-lime shrink-0" />,
  error: <AppIcon icon={WarningCircle} size={20} weight="fill" className="text-rose-400 shrink-0" />,
  warning: <AppIcon icon={Warning} size={20} weight="fill" className="text-amber-400 shrink-0" />,
  info: <AppIcon icon={Info} size={20} weight="fill" className="text-sky-400 shrink-0" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

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
              className="text-steel shrink-0 rounded-lg p-0.5 transition-colors hover:text-white cursor-pointer"
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
