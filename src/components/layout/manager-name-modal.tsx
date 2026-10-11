'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Shuffle, Check, UserCircle } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { useGuestNickname } from '@/hooks/use-guest-nickname';
import { useGuestSession } from '@/hooks/use-guest-session';
import { randomEgyptianManagerName as randomName } from '@/lib/random-names';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/shared/toast';
import { sfx } from '@/lib/sfx';

interface ManagerNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

export function ManagerNameModal({
  isOpen,
  onClose,
  accentColor = '#e5b842',
}: ManagerNameModalProps) {
  const [currentNickname, setNickname] = useGuestNickname();
  const { ensureGuestId } = useGuestSession(false);
  const { lang } = useI18n();
  const { toast } = useToast();
  const isArabic = lang === 'ar';

  const [inputValue, setInputValue] = useState(currentNickname);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevCurrentNickname, setPrevCurrentNickname] = useState(currentNickname);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (isOpen !== prevIsOpen || currentNickname !== prevCurrentNickname) {
    setPrevIsOpen(isOpen);
    setPrevCurrentNickname(currentNickname);
    if (isOpen) {
      setInputValue(currentNickname);
    }
  }

  // Autofocus input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRandomize = () => {
    sfx.tap();
    const generated = randomName();
    setInputValue(generated);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast(isArabic ? 'يرجى كتابة اسم المدرب' : 'Please enter a manager name', 'warning');
      return;
    }

    setIsSaving(true);
    sfx.tap();

    try {
      setNickname(trimmed);
      // Persist to server session if guest session exists
      try {
        await ensureGuestId(trimmed);
      } catch {
        // Fallback to local persistence
      }

      toast(isArabic ? 'تم تحديث اسم المدرب' : 'Manager name updated', 'success');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'تعديل اسم المدرب' : 'Edit Manager Name'}
      className="fixed inset-0 z-[120] pointer-events-auto flex items-center justify-center p-3.5 bg-black/60 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[340px] sm:max-w-[360px] overflow-hidden rounded-3xl border p-4.5 sm:p-5 shadow-2xl backdrop-blur-2xl animate-scale-in"
        style={{
          backgroundColor: 'rgba(11, 15, 23, 0.94)',
          borderColor: `color-mix(in srgb, ${accentColor} 35%, rgba(255, 255, 255, 0.12))`,
          boxShadow: `0 16px 40px -8px color-mix(in srgb, ${accentColor} 20%, rgba(0, 0, 0, 0.8))`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-white/8">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full shrink-0 shadow-sm"
              style={{
                backgroundColor: `color-mix(in srgb, ${accentColor} 18%, transparent)`,
                color: accentColor,
              }}
            >
              <AppIcon icon={UserCircle} size={18} weight="fill" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase font-display truncate">
                {isArabic ? 'اسم المدرب' : 'Manager Handle'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <AppIcon icon={X} size={14} weight="bold" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-3.5 pt-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase font-stats tracking-wider block">
              {isArabic ? 'الاسم الظاهر في المباريات' : 'Display Handle in Matches'}
            </label>

            <div
              className="relative flex items-center rounded-2xl border transition-all"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                maxLength={18}
                placeholder={isArabic ? 'اكتب اسمك هنا…' : 'Enter handle…'}
                dir="auto"
                className="w-full bg-transparent px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white placeholder-muted/60 focus:outline-none"
              />

              {/* Shuffle button */}
              <button
                type="button"
                onClick={handleRandomize}
                title={isArabic ? 'اسم عشوائي' : 'Randomize name'}
                aria-label={isArabic ? 'اسم عشوائي' : 'Randomize name'}
                className="btn-haptic me-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted hover:text-white transition-colors cursor-pointer"
              >
                <AppIcon icon={Shuffle} size={14} weight="bold" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted px-1 font-stats">
              <span>{isArabic ? 'الحد الأقصى 18 حرفاً' : 'Max 18 characters'}</span>
              <span>{inputValue.length}/18</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn-haptic flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-muted hover:text-white transition-all cursor-pointer"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSaving || !inputValue.trim()}
              className="btn-haptic flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md disabled:opacity-40"
              style={{
                backgroundColor: accentColor,
                color: '#07090f',
                boxShadow: `0 2px 14px color-mix(in srgb, ${accentColor} 40%, transparent)`,
              }}
            >
              <AppIcon icon={Check} size={14} weight="bold" />
              <span>{isSaving ? (isArabic ? 'جاري الحفظ…' : 'Saving…') : (isArabic ? 'حفظ' : 'Save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
