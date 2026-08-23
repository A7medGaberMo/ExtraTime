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
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { RankEntityAvatar, RankMedia } from './rank-entity-avatar';
import { parseEntityName } from '@/lib/rank-formatters';
import { useI18n } from '@/lib/i18n';

export interface RankCardItem {
  answerKey: string;
  name: string;
  subText?: string;
  media: RankMedia;
}

interface RankCardListProps {
  questionTitle: string;
  metricLabel: string;
  direction: 'asc' | 'desc';
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
    onOrderChange(next);
  };

  const handleMoveDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === currentOrder.length - 1 || hasSubmitted) return;
    const next = [...currentOrder];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    onOrderChange(next);
  };

  const handleCardClick = (key: string) => {
    if (hasSubmitted) return;
    if (selectedKey === null) {
      setSelectedKey(key);
    } else if (selectedKey === key) {
      setSelectedKey(null);
    } else {
      const idx1 = currentOrder.indexOf(selectedKey);
      const idx2 = currentOrder.indexOf(key);
      if (idx1 !== -1 && idx2 !== -1) {
        const next = [...currentOrder];
        const temp = next[idx1];
        next[idx1] = next[idx2];
        next[idx2] = temp;
        onOrderChange(next);
      }
      setSelectedKey(null);
    }
  };

  const cleanMetricLabel = metricLabel.replace(/[()]/g, '').trim();

  const directionHelperText =
    direction === 'desc'
      ? lang === 'ar'
        ? `الأعلى (${cleanMetricLabel}) في #1`
        : `Highest (${cleanMetricLabel}) at #1`
      : lang === 'ar'
        ? `الأقل (${cleanMetricLabel}) في #1`
        : `Lowest (${cleanMetricLabel}) at #1`;

  return (
    <div className="w-full max-w-[420px] mx-auto select-none flex flex-col gap-3 sm:gap-4 py-1 px-1">
      {/* ── QUESTION HEADING & DIRECTION PILL ─────────────────────── */}
      <div className="text-center shrink-0 space-y-2 px-1">
        <h1 className="text-[17px] sm:text-[19px] font-bold leading-snug tracking-tight text-white font-display">
          {questionTitle}
        </h1>

        {/* Apple Status Chip */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/90 px-3 py-0.5 text-xs font-semibold text-lime shadow-sm backdrop-blur-md">
            <AppIcon
              icon={direction === 'desc' ? SortDescending : SortAscending}
              size={13}
              weight="bold"
            />
            <span className="font-stats">{directionHelperText}</span>
          </div>
        </div>
      </div>

      {/* ── REORDER CARDS (Apple Inset Glass Rows) ─ */}
      <div
        className={`transition-opacity duration-300 ${
          hasSubmitted ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <Reorder.Group
          axis="y"
          values={currentOrder}
          onReorder={onOrderChange}
          className="flex flex-col gap-2 sm:gap-2.5 w-full"
          style={{ touchAction: 'none' }}
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
                  px-3.5 sm:px-4 py-2.5 rounded-2xl border
                  transition-all select-none cursor-grab active:cursor-grabbing
                  ${
                    isSelected
                      ? 'border-lime bg-slate-900 shadow-md shadow-lime/10'
                      : isTop
                        ? 'border-lime/40 bg-slate-900/95 shadow-sm'
                        : 'border-white/8 bg-slate-900/80 hover:border-white/15'
                  }
                `}
                style={{
                  touchAction: 'none',
                  WebkitUserSelect: 'none',
                }}
                onClick={() => handleCardClick(key)}
              >
                {/* Rank Badge */}
                <div
                  className={`
                    flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold font-display-number transition-colors pointer-events-none
                    ${
                      isTop
                        ? 'bg-lime text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300'
                    }
                  `}
                >
                  {rankPosition}
                </div>

                {/* Avatar */}
                <div className="pointer-events-none shrink-0 ms-2.5 me-2.5">
                  <RankEntityAvatar media={item.media} name={mainName || item.name} size="md" />
                </div>

                {/* Name, Season Tag & SubText */}
                <div className="min-w-0 flex-1 pointer-events-none flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="truncate text-sm font-semibold text-white leading-tight">
                      {mainName}
                    </span>
                    {tag && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-lime font-stats text-[11px] font-semibold leading-none">
                        {tag}
                      </span>
                    )}
                  </div>
                  {item.subText && (
                    <p className="truncate text-xs text-steel font-normal leading-tight pt-0.5">
                      {item.subText}
                    </p>
                  )}
                </div>

                {/* Controls */}
                {!hasSubmitted && (
                  <div className="flex items-center gap-0.5 shrink-0 ps-1">
                    <button
                      type="button"
                      onClick={(e) => handleMoveUp(index, e)}
                      disabled={index === 0}
                      className="btn-haptic flex h-8 w-8 items-center justify-center rounded-lg text-steel transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      aria-label="Move up"
                    >
                      <AppIcon icon={CaretUp} size={15} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleMoveDown(index, e)}
                      disabled={index === currentOrder.length - 1}
                      className="btn-haptic flex h-8 w-8 items-center justify-center rounded-lg text-steel transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      aria-label="Move down"
                    >
                      <AppIcon icon={CaretDown} size={15} weight="bold" />
                    </button>
                    <div className="flex h-8 w-7 items-center justify-center text-muted hover:text-steel cursor-grab active:cursor-grabbing">
                      <AppIcon icon={DotsSixVertical} size={16} weight="bold" />
                    </div>
                  </div>
                )}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* ── SUBMIT BUTTON (Apple Solid Action Button) ─────────────────── */}
      <div className="shrink-0 pt-1 pb-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || hasSubmitted}
          className="btn-haptic flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-slate-950 bg-lime shadow-sm transition-all active:scale-[0.98] disabled:active:scale-100 cursor-pointer disabled:pointer-events-none font-display uppercase"
        >
          {isSubmitting ? (
            <CircleNotch className="animate-spin text-slate-950" size={18} />
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

