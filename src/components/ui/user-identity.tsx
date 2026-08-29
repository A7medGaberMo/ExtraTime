'use client';

import React from 'react';
import Image from 'next/image';
import { Crown, ShieldCheck } from '@phosphor-icons/react';
import { AppIcon } from './app-icon';
import { cn } from '@/lib/utils';
import { parseAvatarSeed, getMonogramInitial } from '@/lib/avatars';

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
  const parsed = parseAvatarSeed(seed);
  const meta = parsed.meta;
  const monogram = getMonogramInitial(nickname, 2);
  const finalImage = imageUrl || parsed.avatarUrl;

  const sizeMap = {
    sm: {
      avatar: 'h-8 w-8 text-xs',
      name: 'text-xs',
      sub: 'text-[10px]',
      imgSize: 28,
    },
    md: {
      avatar: 'h-11 w-11 text-sm',
      name: 'text-sm sm:text-base',
      sub: 'text-xs',
      imgSize: 38,
    },
    lg: {
      avatar: 'h-16 w-16 text-xl',
      name: 'text-lg sm:text-xl',
      sub: 'text-xs sm:text-sm',
      imgSize: 56,
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
            'flex items-center justify-center rounded-2xl border bg-gradient-to-br shadow-lg font-stats font-black select-none overflow-hidden backdrop-blur-md transition-all p-1',
            meta.border,
            meta.gradient,
            meta.text,
            meta.glow,
            sizeMap.avatar,
          )}
        >
          {finalImage ? (
            <div className="relative h-full w-full flex items-center justify-center">
              <Image
                src={finalImage}
                alt={nickname}
                width={sizeMap.imgSize}
                height={sizeMap.imgSize}
                className="max-h-full max-w-full object-contain p-0.5"
                unoptimized
              />
            </div>
          ) : (
            <span className="tracking-tight">{monogram}</span>
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
