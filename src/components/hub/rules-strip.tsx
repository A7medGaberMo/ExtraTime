'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { type Icon } from '@phosphor-icons/react';

export interface RulesStripItem {
  icon: Icon;
  title: string;
  subtitle: string;
}

export interface RulesStripProps {
  items: [RulesStripItem, RulesStripItem, RulesStripItem];
  className?: string;
  moreLabel?: string;
  onMore?: () => void;
}

export function RulesStrip({ items, className, moreLabel, onMore }: RulesStripProps) {
  return (
    <div
      className={cn(
        'hub-feature-strip relative grid w-full grid-cols-3 border-t border-white/[0.08] pt-3 pb-0.5',
        className,
      )}
    >
      {moreLabel && onMore ? (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-auto">
          <button
            type="button"
            onClick={onMore}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] tracking-wider uppercase font-semibold text-white/75 bg-[#0d0f14] border border-white/15 rounded-full hover:text-white hover:border-white/30 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <span>{moreLabel}</span>
          </button>
        </div>
      ) : null}
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex min-w-0 flex-col items-center justify-start gap-1.5 sm:gap-2 px-1 text-center"
        >
          <span className="hub-feature-icon">
            <AppIcon
              icon={item.icon}
              size={14}
              weight="regular"
              className="shrink-0"
              style={{ color: 'var(--hub-accent)' }}
            />
          </span>
          <span className="hub-feature-copy flex min-w-0 flex-col items-center gap-0.5">
            <span className="hub-feature-title text-[11.5px] leading-tight font-semibold text-[#F5F5F7] sm:text-[12.5px]">
              {item.title}
            </span>
            <span className="hub-feature-subline text-[10.5px] leading-tight text-[#9AA0AE] sm:text-[11.5px]">
              {item.subtitle}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
