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

  const visual = getEntityVisual(name, media.type);

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-10 h-10 sm:w-11 sm:h-11 text-xs sm:text-sm',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 text-sm sm:text-base',
  }[size];

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }[size];

  const fallbackLetters =
    media.fallbackText ||
    (visual ? visual.initials : name.slice(0, 3).toUpperCase());

  const customBgStyle: React.CSSProperties = visual
    ? {
        background: `linear-gradient(135deg, ${visual.primaryColor}E6 0%, #090d16 100%)`,
        borderColor: `${visual.secondaryColor}40`,
        boxShadow: `0 4px 12px ${visual.primaryColor}25`,
      }
    : {};

  const getCardDefaultTheme = () => {
    switch (media.type) {
      case 'club':
        return 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-white/20 text-white';
      case 'nation':
        return 'bg-gradient-to-br from-emerald-900/60 via-slate-900 to-slate-950 border-emerald-500/30 text-emerald-300';
      case 'tournament':
        return 'bg-gradient-to-br from-amber-900/60 via-slate-900 to-slate-950 border-amber-500/40 text-amber-300';
      case 'stint':
      case 'player':
      default:
        return 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 border-lime/30 text-lime';
    }
  };

  const renderIcon = () => {
    switch (media.type) {
      case 'club':
        return <AppIcon icon={Shield} size={iconSizes} weight="duotone" className="text-white drop-shadow" />;
      case 'nation':
        return <AppIcon icon={Flag} size={iconSizes} weight="duotone" className="text-emerald-400" />;
      case 'tournament':
        return <AppIcon icon={Trophy} size={iconSizes} weight="duotone" className="text-amber-400" />;
      case 'stint':
      case 'player':
      default:
        return <AppIcon icon={User} size={iconSizes} weight="duotone" className="text-lime" />;
    }
  };

  const targetImageUrl = media.primaryUrl || (!imgError ? visual?.imageUrl : undefined);

  return (
    <div className="relative shrink-0 select-none">
      <div
        style={visual ? customBgStyle : undefined}
        className={`
          ${sizeClasses} ${!visual ? getCardDefaultTheme() : 'border'} rounded-2xl
          flex items-center justify-center overflow-hidden shadow-md
          transition-transform duration-200 ring-1 ring-white/10
        `}
      >
        {targetImageUrl && !imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={targetImageUrl}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center font-black">
            {fallbackLetters ? (
              <span className="font-stats tracking-tight font-black text-white text-[13px] sm:text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {fallbackLetters}
              </span>
            ) : (
              renderIcon()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
