'use client';

import React, { useState } from 'react';
import { Reorder } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  GripVertical,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Check,
  Loader2,
} from 'lucide-react';
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
  hasSubmitted?: boolean;
}

function parseEntityName(rawName: string) {
  if (!rawName) return { mainName: '', tag: null };
  const match = rawName.match(/^(.+?)\s*[\(\[]([^\)\]]+)[\)\]]$/);
  if (match) {
    return { mainName: match[1].trim(), tag: match[2].trim() };
  }
  return { mainName: rawName.trim(), tag: null };
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

  const DirectionIcon = direction === 'desc' ? ArrowDownWideNarrow : ArrowUpNarrowWide;

  return (
    <div className="w-full max-w-[400px] mx-auto select-none flex flex-col gap-3 sm:gap-4 py-1 px-1">
      {/* ── QUESTION HEADING & DIRECTION SUBTITLE CHIP ─────────────────────── */}
      <div className="text-center shrink-0 space-y-2 px-1">
        <h1 className="text-[17px] sm:text-[20px] font-bold leading-[1.3] tracking-[-0.01em] text-[#F5F5F7] font-display">
          {questionTitle}
        </h1>

        {/* Subtitle chip */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-[#141416] px-3.5 py-1 text-[12px] font-medium text-lime shadow-sm">
            <DirectionIcon size={13} strokeWidth={2.5} />
            <span>{directionHelperText}</span>
          </div>
        </div>
      </div>

      {/* ── 5 REORDER CARDS (Tight Elegant Spacing, Zero Stretch) ─ */}
      <div
        className={`transition-opacity duration-300 ${
          hasSubmitted ? 'opacity-60 pointer-events-none' : ''
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
                  damping: 32,
                  mass: 0.5,
                }}
                className={`
                  relative flex items-center justify-between
                  px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[18px] sm:rounded-[20px] border
                  transition-colors select-none cursor-grab active:cursor-grabbing
                  ${
                    isSelected
                      ? 'border-lime bg-[#1a1f14] shadow-[0_0_18px_rgba(198,255,74,0.35)]'
                      : ''
                  }
                `}
                style={{
                  background: isSelected ? '#161c12' : '#141416',
                  borderColor: isSelected
                    ? '#C6FF4A'
                    : isTop
                      ? 'rgba(198,255,74,0.32)'
                      : 'rgba(255,255,255,0.06)',
                  boxShadow: isTop && !isSelected
                    ? '0 0 0 1px rgba(198,255,74,0.08), 0 10px 24px -8px rgba(198,255,74,0.2)'
                    : 'none',
                  touchAction: 'none',
                  WebkitUserSelect: 'none',
                }}
                onClick={() => handleCardClick(key)}
              >
                {/* Rank Badge */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[14px] font-bold font-stats transition-colors pointer-events-none"
                  style={{
                    background: isTop ? '#C6FF4A' : '#26262A',
                    color: isTop ? '#0A0A0B' : '#98989D',
                  }}
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
                    <span className="truncate text-[13.5px] sm:text-[14.5px] font-bold text-[#F5F5F7] leading-tight">
                      {mainName}
                    </span>
                    {tag && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/10 text-lime font-stats text-[11px] font-bold leading-none">
                        {tag}
                      </span>
                    )}
                  </div>
                  {item.subText && (
                    <p className="truncate text-[11px] sm:text-[11.5px] text-[#8893a4] font-medium leading-tight pt-0.5">
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
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#616166] transition-all hover:bg-white/[0.06] hover:text-white active:scale-90 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      aria-label="Move up"
                    >
                      <ChevronUp size={17} strokeWidth={2.25} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleMoveDown(index, e)}
                      disabled={index === currentOrder.length - 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#616166] transition-all hover:bg-white/[0.06] hover:text-white active:scale-90 disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
                      aria-label="Move down"
                    >
                      <ChevronDown size={17} strokeWidth={2.25} />
                    </button>
                    <div className="flex h-8 w-7 items-center justify-center text-[#424246] hover:text-white/80 cursor-grab active:cursor-grabbing">
                      <GripVertical size={16} strokeWidth={2} />
                    </div>
                  </div>
                )}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      {/* ── SUBMIT BUTTON ─────────────────── */}
      <div className="shrink-0 pt-1 pb-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || hasSubmitted}
          className="flex h-[50px] sm:h-[52px] w-full items-center justify-center gap-2 rounded-[18px] text-[15px] sm:text-[16px] font-bold tracking-tight text-[#0A0A0B] bg-lime transition-all active:scale-[0.98] disabled:active:scale-100 cursor-pointer disabled:pointer-events-none font-display uppercase shadow-[0_10px_28px_-6px_rgba(198,255,74,0.32)]"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : hasSubmitted ? (
            <>
              <Check size={20} strokeWidth={3} />
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
