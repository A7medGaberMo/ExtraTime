'use client';

import React, { useState } from 'react';
import { Shield, Trophy, Flag, User } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { getEntityVisual } from '@/lib/rank-assets';

export interface RankMedia {
  type: 'player' | 'club' | 'nation' | 'tournament' | 'custom' | 'stint';
  primaryUrl?: string;
  secondaryBadgeUrl?: string;
  fallbackText?: string;
  entityId?: string;
  stintBadge?: {
    clubName: string;
    season?: string;
  };
}

interface RankEntityAvatarProps {
  media: RankMedia;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RankEntityAvatar({ media, name, size = 'md' }: RankEntityAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const visual = getEntityVisual(name, media?.type);

  const sizeClasses = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9 text-xs',
    md: 'w-10 h-10 sm:w-11 sm:h-11 text-xs sm:text-sm',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 text-sm sm:text-base',
  }[size];

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];

  const fallbackLetters =
    media?.fallbackText ||
    (visual ? visual.initials : name?.slice(0, 3)?.toUpperCase() || 'ET');

  const customBgStyle: React.CSSProperties = visual
    ? {
        background: `linear-gradient(135deg, ${visual.primaryColor}33 0%, var(--et-entity-bg-2) 100%)`,
        borderColor: `${visual.primaryColor}55`,
        boxShadow: `0 2px 8px ${visual.primaryColor}20`,
      }
    : {};

  const getCardDefaultTheme = () => {
    switch (media?.type) {
      case 'club':
        return 'bg-[var(--et-entity-bg)] border-white/10 text-white';
      case 'nation':
        return 'bg-[var(--et-entity-bg)] border-white/10 text-white';
      case 'tournament':
        return 'bg-tier-gold/40 border-tier-gold/30 text-tier-gold';
      case 'stint':
      case 'player':
      default:
        return 'bg-[var(--et-entity-bg)] border-white/10 text-game-accent';
    }
  };

  const renderFallbackIcon = () => {
    switch (media?.type) {
      case 'club':
        return <AppIcon icon={Shield} size={iconSizes} weight="duotone" className="text-white drop-shadow" />;
      case 'nation':
        return <AppIcon icon={Flag} size={iconSizes} weight="duotone" className="text-tier-hero" />;
      case 'tournament':
        return <AppIcon icon={Trophy} size={iconSizes} weight="duotone" className="text-tier-gold" />;
      case 'stint':
      case 'player':
      default:
        return <AppIcon icon={User} size={iconSizes} weight="duotone" className="text-game-accent" />;
    }
  };

  const targetImageUrl = media?.primaryUrl || (!imgError ? visual?.imageUrl : undefined);
  const isClubOrTournament = media?.type === 'club' || media?.type === 'tournament';
  const isNation = media?.type === 'nation';

  return (
    <div className="relative shrink-0 select-none">
      <div
        style={visual ? customBgStyle : undefined}
        className={`
          ${sizeClasses} ${!visual ? getCardDefaultTheme() : 'border'} rounded-full
          flex items-center justify-center overflow-hidden ring-1 ring-white/[0.08]
          transition-transform duration-200
        `}
      >
        {targetImageUrl && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={targetImageUrl}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`w-full h-full ${
              isClubOrTournament
                ? 'object-contain p-1'
                : isNation
                  ? 'object-cover'
                  : 'object-cover'
            }`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center font-bold">
            {fallbackLetters ? (
              <span className="font-stats tracking-tight font-bold text-white text-[12px] sm:text-[13px] drop-shadow-[0_1px_2px_var(--et-shade-80)]">
                {fallbackLetters}
              </span>
            ) : (
              renderFallbackIcon()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
