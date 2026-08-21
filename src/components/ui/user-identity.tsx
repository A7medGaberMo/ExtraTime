'use client';

import React from 'react';
import Image from 'next/image';
import { Crown, ShieldCheck } from '@phosphor-icons/react';
import { AppIcon } from './app-icon';
import { cn } from '@/lib/utils';

export interface UserIdentityProps extends React.HTMLAttributes<HTMLDivElement> {
  nickname: string;
  avatarSeed?: string;
  imageUrl?: string;
  guestId?: string;
  subtitle?: string | React.ReactNode;
  badge?: string | React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showAvatarOnly?: boolean;
  isHost?: boolean;
  isWinner?: boolean;
  className?: string;
}

// Generate rich consistent sport avatar colors from nickname seed
function getAvatarColors(seed: string): { bg: string; border: string; text: string } {
  const palettes = [
    { bg: 'from-lime/30 to-slate-900', border: 'border-lime/50', text: 'text-lime' },
    { bg: 'from-sky-500/30 to-slate-900', border: 'border-sky-400/50', text: 'text-sky-300' },
    { bg: 'from-amber-500/30 to-slate-900', border: 'border-amber-400/50', text: 'text-amber-300' },
    { bg: 'from-purple-500/30 to-slate-900', border: 'border-purple-400/50', text: 'text-purple-300' },
    { bg: 'from-rose-500/30 to-slate-900', border: 'border-rose-400/50', text: 'text-rose-300' },
    { bg: 'from-emerald-500/30 to-slate-900', border: 'border-emerald-400/50', text: 'text-emerald-300' },
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

export function UserIdentity({
  nickname,
  avatarSeed,
  imageUrl,
  guestId,
  subtitle,
  badge,
  size = 'md',
  showAvatarOnly = false,
  isHost,
  isWinner,
  className,
  ...props
}: UserIdentityProps) {
  const seed = avatarSeed || nickname || 'manager';
  const colors = getAvatarColors(seed);
  const initial = (nickname || 'M').trim().charAt(0).toUpperCase();

  const sizeMap = {
    sm: {
      avatar: 'h-8 w-8 text-xs',
      name: 'text-xs',
      sub: 'text-[10px]',
    },
    md: {
      avatar: 'h-11 w-11 text-base',
      name: 'text-sm sm:text-base',
      sub: 'text-xs',
    },
    lg: {
      avatar: 'h-16 w-16 text-2xl',
      name: 'text-lg sm:text-xl',
      sub: 'text-xs sm:text-sm',
    },
  }[size];

  return (
    <div
      className={cn('inline-flex items-center gap-3', className)}
      data-guest-id={guestId}
      {...props}
    >
      {/* Avatar Container */}
      <div className="relative shrink-0">
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl border bg-gradient-to-b shadow-lg font-stats font-black select-none overflow-hidden',
            colors.border,
            colors.bg,
            colors.text,
            sizeMap.avatar,
          )}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={nickname}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        {isHost && (
          <div
            className="absolute -top-1.5 -end-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-sm"
            title="Host"
          >
            <AppIcon icon={Crown} size={10} weight="fill" />
          </div>
        )}

        {isWinner && (
          <div
            className="absolute -bottom-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-lime text-slate-950 shadow-sm"
            title="Winner"
          >
            <AppIcon icon={ShieldCheck} size={11} weight="fill" />
          </div>
        )}
      </div>

      {/* User Details */}
      {!showAvatarOnly && (
        <div className="min-w-0 flex-1 flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={cn('font-black text-white truncate', sizeMap.name)}>
              {nickname}
            </span>
            {badge && (
              <span className="shrink-0">{badge}</span>
            )}
          </div>
          {subtitle && (
            <span className={cn('text-steel font-medium truncate mt-0.5', sizeMap.sub)}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
