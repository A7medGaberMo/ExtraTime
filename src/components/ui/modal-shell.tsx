'use client';

import React, { useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  hideCloseButton?: boolean;
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  maxWidth = 'md',
  className,
  hideCloseButton = false,
}: ModalShellProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }[maxWidth];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3.5 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-3xl border border-white/20 bg-slate-900/95 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl animate-scale-in',
          maxWidthClass,
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 end-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/80 text-steel transition-all hover:border-lime/40 hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X size={18} weight="bold" />
          </button>
        )}

        {(title || subtitle || badge) && (
          <div className="mb-5 space-y-1.5 text-center px-4">
            {badge && <div className="inline-block mb-1">{badge}</div>}
            {title && (
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-steel text-xs sm:text-sm font-medium leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
