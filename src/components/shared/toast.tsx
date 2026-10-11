'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, WarningCircle, Warning, Info } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  timestamp: number;
}

export type ToastArg =
  | string
  | Error
  | {
      title?: string;
      message?: string;
      type?: ToastVariant;
      variant?: ToastVariant;
      data?: unknown;
    }
  | unknown;

export type ToastFn = ((arg: ToastArg, variant?: ToastVariant) => void) & {
  success: (message: ToastArg) => void;
  error: (message: ToastArg) => void;
  warning: (message: ToastArg) => void;
  info: (message: ToastArg) => void;
};

interface ToastContextValue {
  toast: ToastFn;
  dismiss: (id: string) => void;
  toasts: ToastItem[];
  activeToast: ToastItem | null;
  registerHeaderActive: (active: boolean) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Normalizes raw errors or messages into short, direct, clean toast copy
 * without verbose server tracebacks or noisy technical prefixes.
 */
export function cleanToastMessage(raw: unknown): string {
  if (!raw) return 'Done';

  let msg = '';
  if (typeof raw === 'string') {
    msg = raw;
  } else if (raw instanceof Error) {
    msg = raw.message;
  } else if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.data === 'string') {
      msg = obj.data;
    } else if (obj.data && typeof obj.data === 'object' && 'message' in obj.data) {
      msg = String((obj.data as Record<string, unknown>).message);
    } else if (typeof obj.message === 'string') {
      msg = obj.message;
    } else {
      msg = String(raw);
    }
  } else {
    msg = String(raw);
  }

  // Strip Convex and standard error prefixes
  msg = msg
    .replace(/^\[CONVEX[^\]]*\]\s*/i, '')
    .replace(/^Server Error:\s*/i, '')
    .replace(/^ConvexError:\s*/i, '')
    .replace(/^Uncaught Error:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();

  // Known string mappings to short, direct phrases
  const lower = msg.toLowerCase();
  if (
    lower.includes('room not found') ||
    lower.includes('check the code') ||
    lower.includes('check the room code')
  ) {
    return msg.includes('الغرفة') ? 'الغرفة غير موجودة' : 'Room not found';
  }
  if (lower.includes('already in progress') || lower.includes('already begun')) {
    return msg.includes('الغرفة') ? 'الغرفة بدأت بالفعل' : 'Room already in progress';
  }
  if (lower.includes('room is full') || lower.includes('room is already full')) {
    return msg.includes('الغرفة') ? 'الغرفة ممتلئة' : 'Room is full';
  }
  if (lower.includes('matchmaking failed')) {
    return msg.includes('فشل') ? 'فشل البحث عن ماتش' : 'Matchmaking failed';
  }
  if (lower.includes('could not leave match') || lower.includes('failed to forfeit')) {
    return msg.includes('تعذر') ? 'تعذر المغادرة' : 'Could not leave match';
  }
  if (lower.includes('not authorized')) {
    return msg.includes('غير مصرح') ? 'غير مصرح لك' : 'Not authorized';
  }
  if (lower.includes('it is not your turn') || lower.includes('not your turn')) {
    return msg.includes('دور') ? 'ليس دورك الآن' : 'Not your turn';
  }
  if (lower.includes('waiting for opponent')) {
    return msg.includes('المنافس') ? 'في انتظار المنافس' : 'Waiting for opponent';
  }
  if (lower.includes('duplicate answer keys detected')) {
    return msg.includes('إجابات') ? 'إجابات مكررة' : 'Duplicate answers detected';
  }
  if (lower.includes('exactly 5 items must be ranked')) {
    return msg.includes('رتب') ? 'يجب ترتيب 5 عناصر' : 'Must rank all 5 items';
  }

  // Keep message short and direct
  if (msg.length > 70) {
    return msg.slice(0, 67) + '…';
  }
  return msg;
}

export const variantStyles: Record<ToastVariant, string> = {
  success:
    'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  error:
    'border-rose-500/40 bg-rose-500/15 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]',
  warning:
    'border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  info:
    'border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]',
};

export const variantIcons: Record<ToastVariant, ReactNode> = {
  success: (
    <AppIcon
      icon={CheckCircle}
      size={16}
      weight="fill"
      className="text-emerald-400 shrink-0"
    />
  ),
  error: (
    <AppIcon
      icon={WarningCircle}
      size={16}
      weight="fill"
      className="text-rose-400 shrink-0"
    />
  ),
  warning: (
    <AppIcon
      icon={Warning}
      size={16}
      weight="fill"
      className="text-amber-400 shrink-0"
    />
  ),
  info: (
    <AppIcon
      icon={Info}
      size={16}
      weight="fill"
      className="text-cyan-400 shrink-0"
    />
  ),
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isHeaderActive, setIsHeaderActive] = useState(false);
  const activeTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const registerHeaderActive = useCallback((active: boolean) => {
    setIsHeaderActive(active);
  }, []);

  const dismiss = useCallback((id: string) => {
    const timer = activeTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      activeTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastBase = useCallback(
    (arg: ToastArg, variant: ToastVariant = 'info') => {
      let finalVariant = variant;
      let rawMsg = '';

      if (typeof arg === 'string') {
        rawMsg = arg;
      } else if (arg instanceof Error) {
        rawMsg = arg.message;
        finalVariant = 'error';
      } else if (arg && typeof arg === 'object') {
        const obj = arg as Record<string, unknown>;
        finalVariant =
          (obj.variant as ToastVariant) || (obj.type as ToastVariant) || variant;
        if (typeof obj.data === 'string') {
          rawMsg = obj.data;
        } else if (obj.data && typeof obj.data === 'object' && 'message' in obj.data) {
          rawMsg = String((obj.data as Record<string, unknown>).message);
        } else if (typeof obj.message === 'string') {
          const title = obj.title ? `${obj.title}: ` : '';
          rawMsg = `${title}${obj.message}`;
        } else {
          rawMsg = String(arg);
        }
      }

      const finalMsg = cleanToastMessage(rawMsg);
      if (!finalMsg) return;

      const now = Date.now();

      setToasts((prev) => {
        // ── Deduplication: Check if toast with same message is already visible ──
        const existingIndex = prev.findIndex((t) => t.message === finalMsg);
        if (existingIndex !== -1) {
          const existing = prev[existingIndex];
          // Reset auto-dismiss timer for the existing toast
          const oldTimer = activeTimersRef.current.get(existing.id);
          if (oldTimer) clearTimeout(oldTimer);

          const newTimer = setTimeout(() => dismiss(existing.id), 3500);
          activeTimersRef.current.set(existing.id, newTimer);

          // Return unchanged or refreshed timestamp
          return prev.map((t, idx) =>
            idx === existingIndex ? { ...t, timestamp: now } : t,
          );
        }

        // New unique toast
        const id = Math.random().toString(36).slice(2, 9);
        const newTimer = setTimeout(() => dismiss(id), 3500);
        activeTimersRef.current.set(id, newTimer);

        // Keep maximum 2 toasts visible at once to avoid screen clutter
        const next = [...prev.slice(-1), { id, message: finalMsg, variant: finalVariant, timestamp: now }];
        return next;
      });
    },
    [dismiss],
  );

  const toast = useMemo<ToastFn>(() => {
    return Object.assign(
      (arg: ToastArg, variant?: ToastVariant) => toastBase(arg, variant),
      {
        success: (msg: ToastArg) => toastBase(msg, 'success'),
        error: (msg: ToastArg) => toastBase(msg, 'error'),
        warning: (msg: ToastArg) => toastBase(msg, 'warning'),
        info: (msg: ToastArg) => toastBase(msg, 'info'),
      },
    );
  }, [toastBase]);

  const activeToast = toasts.length > 0 ? toasts[toasts.length - 1] : null;

  return (
    <ToastContext.Provider
      value={{
        toast,
        dismiss,
        toasts,
        activeToast,
        registerHeaderActive,
      }}
    >
      {children}

      {/* ── Standalone Top-Center Toast Pill (Centered at Header position) ──
          Always centered at header level. Displays if header is not rendering the toast or in gameplay. */}
      {toasts.length > 0 && !isHeaderActive && (
        <div
          dir="ltr"
          className="fixed top-[max(0.6rem,calc(env(safe-area-inset-top,0px)+0.4rem))] inset-x-0 z-[100] flex flex-col items-center pointer-events-none select-none px-3 gap-1.5"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={cn(
                'pointer-events-auto animate-slide-down flex max-w-sm sm:max-w-md items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-2xl backdrop-blur-2xl transition-all',
                variantStyles[t.variant],
              )}
            >
              {variantIcons[t.variant]}
              <p className="flex-1 truncate text-xs font-bold text-white tracking-tight">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-white/60 hover:text-white shrink-0 p-0.5 rounded-full transition-colors cursor-pointer"
                aria-label="Dismiss toast"
              >
                <AppIcon icon={X} size={13} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
