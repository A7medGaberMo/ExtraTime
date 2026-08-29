'use client';

import React, { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import {
  Copy,
  Check,
  ShareNetwork,
  X,
  ShieldCheck,
  Sword,
  WhatsappLogo,
  TelegramLogo,
  LinkSimple,
} from '@phosphor-icons/react';
import { useToast } from '@/components/shared/toast';
import { useI18n } from '@/lib/i18n';
import { shareContent, getWhatsAppShareUrl, getTelegramShareUrl } from '@/lib/share';

export interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  code: string;
  shareUrl?: string;
  type?: 'league' | 'duel' | 'room';
}

export function InviteModal({
  isOpen,
  onClose,
  title,
  subtitle,
  code,
  shareUrl,
  type = 'league',
}: InviteModalProps) {
  const { lang, t } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const finalUrl =
    shareUrl ||
    (type === 'league'
      ? `${origin}/leagues?join=${encodeURIComponent(code)}`
      : type === 'duel'
        ? `${origin}/rank?code=${encodeURIComponent(code)}`
        : `${origin}/join-room?code=${encodeURIComponent(code)}`);

  const shareText =
    lang === 'ar'
      ? `انضم لمنافستي في ExtraTime: "${title}" باستخدام الكود: ${code}`
      : `Join my competition on ExtraTime: "${title}" using code: ${code}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast(t('common.copied') || 'Code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Failed to copy', 'error');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(finalUrl);
      toast(lang === 'ar' ? 'تم نسخ الرابط المباشر!' : 'Direct invite link copied!', 'success');
    } catch {
      toast('Failed to copy link', 'error');
    }
  };

  const handleNativeShare = async () => {
    const res = await shareContent({
      title: `ExtraTime — ${title}`,
      text: shareText,
      url: finalUrl,
    });
    if (res === 'copied') {
      toast(lang === 'ar' ? 'تم نسخ الرابط!' : 'Invite link copied!', 'success');
    }
  };

  const waUrl = getWhatsAppShareUrl(shareText, finalUrl);
  const tgUrl = getTelegramShareUrl(shareText, finalUrl);

  const TypeIcon = type === 'league' ? ShieldCheck : Sword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-white/12 bg-slate-950 p-6 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.9)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/15 border border-lime/30 text-lime">
              <AppIcon icon={TypeIcon} size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white font-stats">
                {title}
              </h2>
              <p className="text-[11px] text-steel truncate max-w-[220px]">{subtitle || (lang === 'ar' ? 'دعوة المنافسين' : 'Invite Rivals')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-haptic flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-steel hover:text-white cursor-pointer"
          >
            <AppIcon icon={X} size={15} weight="bold" />
          </button>
        </div>

        {/* Code Showcase Card */}
        <div className="mb-5 rounded-2xl border border-lime/30 bg-lime/5 p-4 text-center">
          <div className="text-[11px] font-bold text-steel uppercase font-stats tracking-wider mb-1">
            {lang === 'ar' ? 'كود الانضمام المباشر' : 'Direct Access Code'}
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="font-stats font-black text-2xl sm:text-3xl text-white tracking-[0.2em] pl-2">
              {code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="btn-haptic flex h-9 w-9 items-center justify-center rounded-xl bg-lime text-slate-950 hover:bg-lime/90 transition-all cursor-pointer shadow-glow-lime"
              title="Copy Code"
            >
              <AppIcon icon={copied ? Check : Copy} size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Direct Sharing Channels */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold text-steel uppercase font-stats tracking-wider">
            {lang === 'ar' ? 'مشاركة فورية' : 'Instant Share'}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-haptic flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50 transition-all font-stats"
            >
              <AppIcon icon={WhatsappLogo} size={18} weight="bold" className="text-emerald-400" />
              <span>WhatsApp</span>
            </a>

            <a
              href={tgUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-haptic flex items-center justify-center gap-2 rounded-2xl border border-sky-500/30 bg-sky-950/40 p-3 text-xs font-bold text-sky-300 hover:bg-sky-900/50 transition-all font-stats"
            >
              <AppIcon icon={TelegramLogo} size={18} weight="bold" className="text-sky-400" />
              <span>Telegram</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn-haptic flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-xs font-bold text-white hover:border-lime/40 transition-all font-stats cursor-pointer"
            >
              <AppIcon icon={LinkSimple} size={16} weight="bold" className="text-lime" />
              <span>{lang === 'ar' ? 'نسخ الرابط' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="btn-haptic flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-3 text-xs font-bold text-white hover:border-lime/40 transition-all font-stats cursor-pointer"
            >
              <AppIcon icon={ShareNetwork} size={16} weight="bold" className="text-lime" />
              <span>{lang === 'ar' ? 'مشاركة' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
