'use client';

import React, { useState } from 'react';
import { Reorder } from 'framer-motion';
import {
  CaretUp,
  CaretDown,
  DotsSixVertical,
  SortAscending,
  SortDescending,
  Check,
  CircleNotch,
  ArrowsDownUp,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { RankEntityAvatar, RankMedia } from './rank-entity-avatar';
import { parseEntityName } from '@/lib/rank-formatters';
import { useI18n } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';

export interface RankCardItem {
  answerKey: string;
  name: string;
  subText?: string;
  media: RankMedia;
}

interface RankCardListProps {
  questionTitle: string;
  metricLabel?: string;
  direction?: 'asc' | 'desc';
  items: Array<{
    answerKey: string;
    name: string;
    subText?: string;
    media: {
      type: 'player' | 'club' | 'nation' | 'tournament' | 'custom' | 'stint';
      fallbackText?: string;
      primaryUrl?: string;
      secondaryBadgeUrl?: string;
      stintBadge?: {
        clubName: string;
        season?: string;
      };
    };
  }>;
  currentOrder: string[];
  onOrderChange: (newOrder: string[]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  hasSubmitted?: boolean;
}

export function RankCardList({
  questionTitle,
  metricLabel,
  direction,
  items,
  currentOrder,
  onOrderChange,
  onSubmit,
  isSubmitting,
  hasSubmitted = false,
}: RankCardListProps) {
  const { lang, t } = useI18n();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const itemMap = new Map(items.map((i) => [i.answerKey, i]));

  const handleMoveUp = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === 0 || hasSubmitted) return;
    const next = [...currentOrder];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    sfx.swap();
    sfx.haptic('light');
    onOrderChange(next);
  };

  const handleMoveDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === currentOrder.length - 1 || hasSubmitted) return;
    const next = [...currentOrder];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    sfx.swap();
    sfx.haptic('light');
    onOrderChange(next);
  };

  const handleCardClick = (key: string) => {
    if (hasSubmitted) return;
    if (selectedKey === null) {
      setSelectedKey(key);
      sfx.tap();
      sfx.haptic('light');
    } else if (selectedKey === key) {
      setSelectedKey(null);
      sfx.tap();
    } else {
      const idx1 = currentOrder.indexOf(selectedKey);
      const idx2 = currentOrder.indexOf(key);
      if (idx1 !== -1 && idx2 !== -1) {
        const next = [...currentOrder];
        const temp = next[idx1];
        next[idx1] = next[idx2];
        next[idx2] = temp;
        sfx.swap();
        sfx.haptic('medium');
        onOrderChange(next);
      }
      setSelectedKey(null);
    }
  };

  const cleanMetricLabel = metricLabel ? metricLabel.replace(/[()]/g, '').trim() : '';

  const directionHelperText = cleanMetricLabel
    ? direction === 'asc'
      ? lang === 'ar'
        ? `الأقل (${cleanMetricLabel}) في #1`
        : `Lowest (${cleanMetricLabel}) at #1`
      : lang === 'ar'
        ? `الأعلى (${cleanMetricLabel}) في #1`
        : `Highest (${cleanMetricLabel}) at #1`
    : lang === 'ar'
      ? 'الترتيب من #1 إلى #5'
      : 'Rank from #1 to #5';

  const handleSubmit = () => {
    if (isSubmitting || hasSubmitted) return;
    sfx.lock();
    sfx.haptic('medium');
    onSubmit();
  };

  return (
    <div className="w-full max-w-md mx-auto select-none flex flex-col gap-1.5 sm:gap-2 py-0.5">
      {/* ── QUESTION HEADING & DIRECTION PILL ─────────────────────── */}
      <div className="text-center shrink-0 space-y-1 px-2">
        <h1 className="text-base sm:text-lg font-bold leading-snug tracking-tight text-white font-display">
          {questionTitle}
        </h1>

        {/* Status Chip & Tap Guide */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface/90 px-3 py-0.5 text-xs font-semibold text-game-accent shadow-sm backdrop-blur-md">
            <AppIcon
              icon={direction === 'desc' ? SortDescending : SortAscending}
              size={13}
              weight="bold"
            />
            <span className="font-stats">{directionHelperText}</span>
          </div>

          {selectedKey && !hasSubmitted && (
            <div className="animate-fade-in inline-flex items-center gap-1 rounded-full border border-game-accent/40 bg-game-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-game-accent">
              <AppIcon icon={ArrowsDownUp} size={12} weight="bold" />
              <span>{lang === 'ar' ? 'اضغط لاعب آخر للتبديل' : 'Tap another card to swap'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── REORDER CARDS (Apple Inset Glass Rows) ─ */}
      <div
        className={`w-full transition-opacity duration-300 ${
          hasSubmitted ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <Reorder.Group
          axis="y"
          values={currentOrder}
          onReorder={onOrderChange}
          className="flex flex-col gap-1.5 w-full touch-pan-y"
          style={{ touchAction: 'pan-y' }}
        >
          {currentOrder.map((key, index) => {
            const item = itemMap.get(key);
            if (!item) return null;

            const isSelected = selectedKey === key;
            const rankPosition = index + 1;
            const isTop = rankPosition === 1;
            const { mainName, tag } = parseEntityName(item.name);

            return (
              <Reorder.Item
                key={key}
                value={key}
                layout="position"
                transition={{
                  type: 'spring',
                  stiffness: 550,
                  damping: 34,
                  mass: 0.5,
                }}
                className={`
                  relative flex items-center justify-between
                  px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border w-full
                  transition-all select-none cursor-grab active:cursor-grabbing backdrop-blur-xl
                  ${
                    isSelected
                      ? 'border-game-accent bg-surface ring-2 ring-game-accent/40 shadow-[0_0_24px_var(--game-glow),inset_0_1px_0_0_var(--et-hi-20)] scale-[1.01]'
                      : isTop
                        ? 'border-game-accent/45 bg-surface/95 shadow-[0_4px_16px_var(--game-glow),inset_0_1px_0_0_var(--et-hi-12)]'
                        : 'border-white/[0.12] bg-surface/85 shadow-[0_4px_16px_var(--et-shade-40),inset_0_1px_0_0_var(--et-hi-08)] hover:border-white/20'
                  }
                `}
                style={{
                  touchAction: 'pan-y',
                  WebkitUserSelect: 'none',
                }}
                onClick={() => handleCardClick(key)}
              >
                {/* Rank Badge */}
                <div
                  className={`
                    flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold font-display-number transition-colors pointer-events-none shadow-sm
                    ${
                      isTop
                        ? 'bg-game-accent text-game-on-accent shadow-[0_2px_8px_var(--game-glow)]'
                        : 'bg-surface-2/90 text-foreground border border-white/5'
                    }
                  `}
                >
                  {rankPosition}
                </div>

                {/* Avatar */}
                <div className="pointer-events-none shrink-0 mx-2 sm:mx-2.5">
                  <RankEntityAvatar media={item.media} name={mainName || item.name} size="md" />
                </div>

                {/* Name, Season Tag & SubText */}
                <div className="min-w-0 flex-1 pointer-events-none flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="truncate text-xs sm:text-sm font-semibold text-white leading-tight">
                      {mainName}
                    </span>
                    {tag && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-game-accent font-stats text-[10px] sm:text-[11px] font-semibold leading-none">
                        {tag}
                      </span>
                    )}
                  </div>
                  {item.subText && (
                    <p className="truncate text-[11px] sm:text-xs text-muted font-normal leading-tight pt-0.5">
                      {item.subText}
                    </p>
                  )}
                </div>

                {/* Controls with accessible touch targets */}
                {!hasSubmitted && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleMoveUp(index, e)}
                      disabled={index === 0}
                      className="btn-haptic flex h-9 w-9 sm:h-8 sm:w-8 min-h-[36px] min-w-[36px] items-center justify-center rounded-xl bg-white/[0.04] border border-white/5 text-muted transition-all hover:bg-white/15 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      aria-label="Move up"
                    >
                      <AppIcon icon={CaretUp} size={16} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleMoveDown(index, e)}
                      disabled={index === currentOrder.length - 1}
                      className="btn-haptic flex h-9 w-9 sm:h-8 sm:w-8 min-h-[36px] min-w-[36px] items-center justify-center rounded-xl bg-white/[0.04] border border-white/5 text-muted transition-all hover:bg-white/15 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      aria-label="Move down"
                    >
                      <AppIcon icon={CaretDown} size={16} weight="bold" />
                    </button>
                    <div
                      style={{ touchAction: 'none' }}
                      className="flex h-9 w-7 sm:h-8 sm:w-7 items-center justify-center text-muted hover:text-foreground cursor-grab active:cursor-grabbing"
                    >
                      <AppIcon icon={DotsSixVertical} size={17} weight="bold" />
                    </div>
                  </div>
                )}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* ── SUBMIT BUTTON (Apple Solid Action Button) ─────────────────── */}
      <div className="shrink-0 pt-0.5 pb-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || hasSubmitted}
          className="btn-haptic flex h-10 sm:h-11 w-full items-center justify-center gap-2 rounded-2xl text-xs sm:text-sm font-bold text-game-on-accent bg-game-accent shadow-[0_8px_20px_var(--game-glow),inset_0_1px_0_0_var(--et-hi-35)] transition-all active:scale-[0.97] disabled:active:scale-100 cursor-pointer disabled:pointer-events-none font-display uppercase"
        >
          {isSubmitting ? (
            <CircleNotch className="animate-spin text-game-on-accent" size={18} />
          ) : hasSubmitted ? (
            <>
              <AppIcon icon={Check} size={18} weight="bold" />
              <span>{t('rank.locked')}</span>
            </>
          ) : (
            <span>{t('rank.submit')}</span>
          )}
        </button>
      </div>
    </div>
  );
}

