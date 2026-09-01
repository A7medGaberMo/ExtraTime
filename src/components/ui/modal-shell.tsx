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
      className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/85 p-3.5 backdrop-blur-2xl animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-3xl border border-white/18 bg-slate-900/95 p-5 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-2xl animate-scale-in',
          maxWidthClass,
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="btn-haptic absolute top-4 end-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-slate-950/85 text-steel transition-all hover:border-lime/40 hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X size={16} weight="bold" />
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
