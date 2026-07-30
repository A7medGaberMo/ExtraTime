"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

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
  success: "border-lime/40 bg-lime/10",
  error: "border-rose-500/40 bg-rose-500/10",
  warning: "border-amber-500/40 bg-amber-500/10",
  info: "border-sky-500/40 bg-sky-500/10",
};

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 shrink-0 text-lime" />,
  error: <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />,
  warning: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />,
  info: <Info className="h-5 w-5 shrink-0 text-sky-400" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2 md:bottom-6 md:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl animate-slide-up max-w-xs",
              variantStyles[t.variant],
            )}
            style={{ animationFillMode: "both" }}
          >
            {variantIcons[t.variant]}
            <p className="flex-1 text-sm font-medium text-white">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-lg p-0.5 text-steel hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
