'use client';

import React, { useState } from 'react';
import { Reorder } from 'framer-motion';
import {
  DotsSixVertical,
  CheckCircle,
  CaretUp,
  CaretDown,
} from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';
import { RankEntityAvatar, RankMedia } from './rank-entity-avatar';
import { useI18n } from '@/lib/i18n';

export interface RankCardItem {
  answerKey: string;
  name: string;
  subText?: string;
  media: RankMedia;
}

interface RankCardListProps {
  questionTitle: string;
  questionSubtitle?: string;
  metricLabel: string;
  direction: 'asc' | 'desc';
  tags?: string[];
  scopeType?: string;
  asOfDate?: string;
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
  hasSubmitted: boolean;
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
  hasSubmitted,
}: RankCardListProps) {
  const { lang, t } = useI18n();
  const [selectedKeyForSwap, setSelectedKeyForSwap] = useState<string | null>(null);

  const itemMap = React.useMemo(() => {
    const map = new Map<string, (typeof items)[0]>();
    items.forEach((item) => map.set(item.answerKey, item));
    return map;
  }, [items]);

  function handleCardClick(clickedKey: string) {
    if (hasSubmitted) return;

    if (!selectedKeyForSwap) {
      setSelectedKeyForSwap(clickedKey);
      return;
    }

    if (selectedKeyForSwap === clickedKey) {
      setSelectedKeyForSwap(null);
      return;
    }

    const indexA = currentOrder.indexOf(selectedKeyForSwap);
    const indexB = currentOrder.indexOf(clickedKey);

    if (indexA !== -1 && indexB !== -1) {
      const newOrder = [...currentOrder];
      newOrder[indexA] = clickedKey;
      newOrder[indexB] = selectedKeyForSwap;
      onOrderChange(newOrder);
    }

    setSelectedKeyForSwap(null);
  }

  function handleMoveUp(index: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (hasSubmitted || index <= 0) return;
    const newOrder = [...currentOrder];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    onOrderChange(newOrder);
    setSelectedKeyForSwap(null);
  }

  function handleMoveDown(index: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (hasSubmitted || index >= currentOrder.length - 1) return;
    const newOrder = [...currentOrder];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    onOrderChange(newOrder);
    setSelectedKeyForSwap(null);
  }

  const directionHelperText =
    direction === 'desc'
      ? lang === 'ar'
        ? `الأكثر (${metricLabel}) في #1`
        : `Highest (${metricLabel}) at #1`
      : lang === 'ar'
        ? `الأقل (${metricLabel}) في #1`
        : `Lowest (${metricLabel}) at #1`;

  return (
    <div className="flex-1 flex flex-col justify-between w-full max-w-lg mx-auto select-none overflow-hidden min-h-0 gap-1 sm:gap-2">
      {/* ── QUESTION HEADING & DIRECTION BADGE STRIP ─────────────────────── */}
      <div className="text-center shrink-0 space-y-1 px-1">
        <h2 className="text-sm sm:text-base md:text-lg font-black text-white leading-snug font-display line-clamp-2">
          {questionTitle}
        </h2>
        <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-lime/10 border border-lime/30 text-[11px] sm:text-xs font-black text-lime shadow-sm">
          <span>{directionHelperText}</span>
        </div>
      </div>

      {/* ── 5 REORDER CARDS (Zero-Scroll Adaptive Heights & Zero Spoilers) ─ */}
      <div className="flex-1 flex flex-col justify-evenly min-h-0 py-0.5">
        <Reorder.Group
          axis="y"
          values={currentOrder}
          onReorder={hasSubmitted ? () => {} : onOrderChange}
          className="flex-1 flex flex-col justify-between gap-1.5 sm:gap-2 touch-manipulation w-full min-h-0"
        >
          {currentOrder.map((key, index) => {
            const item = itemMap.get(key);
            if (!item) return null;

            const isSelected = selectedKeyForSwap === key;
            const rankPosition = index + 1;

            return (
              <Reorder.Item
                key={key}
                value={key}
                dragListener={!hasSubmitted}
                layout
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 28,
                  mass: 0.7,
                }}
                whileDrag={{
                  scale: 1.02,
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(149, 232, 16, 0.3)',
                  zIndex: 50,
                  cursor: 'grabbing',
                }}
                className={`
                  relative flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all duration-150
                  ${
                    hasSubmitted
                      ? 'bg-slate-900/60 border-white/5 cursor-not-allowed opacity-85'
                      : isSelected
                        ? 'bg-slate-900 border-lime ring-2 ring-lime/70 shadow-[0_0_15px_rgba(149,232,16,0.25)]'
                        : 'bg-slate-900/95 border-white/10 hover:border-lime/40 cursor-grab active:cursor-grabbing shadow-sm'
                  }
                `}
                onClick={() => handleCardClick(key)}
              >
                {/* Left: Position Rank Number + Entity Avatar + Clear Entity Name */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={`
                      w-6 h-6 sm:w-7 sm:h-7 rounded-lg font-stats font-black text-xs sm:text-sm flex items-center justify-center shrink-0 border
                      ${
                        rankPosition === 1
                          ? 'bg-lime text-slate-950 border-lime shadow-sm shadow-lime/30'
                          : rankPosition === 5
                            ? 'bg-slate-950 text-steel border-white/10'
                            : 'bg-slate-950 text-white border-white/10'
                      }
                    `}
                  >
                    {rankPosition}
                  </div>

                  <RankEntityAvatar media={item.media} name={item.name} size="sm" />

                  {/* Entity Name ONLY - Zero Spoilers, Zero Subtext during Active Playing */}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm md:text-base font-bold text-white tracking-wide truncate block leading-tight">
                      {item.name}
                    </span>
                  </div>
                </div>

                {/* Right: Quick Micro Up/Down Arrows + Drag Grip */}
                {!hasSubmitted && (
                  <div className="flex items-center gap-1 shrink-0 ps-1.5">
                    {/* Move Up Button */}
                    <button
                      type="button"
                      onClick={(e) => handleMoveUp(index, e)}
                      disabled={index === 0}
                      className="p-1 sm:p-1.5 rounded-lg text-steel hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      title="Move Up"
                      aria-label="Move Up"
                    >
                      <AppIcon icon={CaretUp} size={15} weight="bold" />
                    </button>

                    {/* Move Down Button */}
                    <button
                      type="button"
                      onClick={(e) => handleMoveDown(index, e)}
                      disabled={index === currentOrder.length - 1}
                      className="p-1 sm:p-1.5 rounded-lg text-steel hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      title="Move Down"
                      aria-label="Move Down"
                    >
                      <AppIcon icon={CaretDown} size={15} weight="bold" />
                    </button>

                    {/* Drag Grip Handle */}
                    <div
                      className="p-1 text-steel/60 hover:text-lime cursor-grab select-none"
                      style={{ touchAction: 'none' }}
                    >
                      <AppIcon icon={DotsSixVertical} size={18} weight="bold" />
                    </div>
                  </div>
                )}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* ── SUBMIT / LOCK ACTION BUTTON (Permanently Visible at Bottom) ──── */}
      <div className="shrink-0 pt-1 pb-1">
        <Button
          variant={hasSubmitted ? 'secondary' : 'primary'}
          size="md"
          fullWidth
          onClick={onSubmit}
          disabled={isSubmitting || hasSubmitted}
          loading={isSubmitting}
          leftIcon={hasSubmitted ? <AppIcon icon={CheckCircle} size={16} weight="fill" /> : undefined}
          className="min-h-[42px] sm:min-h-[46px] text-xs sm:text-sm font-black shadow-lg shadow-lime/10"
        >
          {hasSubmitted
            ? (lang === 'ar' ? 'تم تثبيت الترتيب ✓' : 'Ranking Locked ✓')
            : isSubmitting
              ? t('rank.submitting')
              : t('rank.submitRanking')}
        </Button>
      </div>
    </div>
  );
}
