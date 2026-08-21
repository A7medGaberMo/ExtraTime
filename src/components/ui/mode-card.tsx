'use client';

import React from 'react';
import { Panel } from './panel';
import { StatPill } from './stat-pill';
import { cn } from '@/lib/utils';

export interface ModeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tag?: string;
  tagVariant?: 'lime' | 'amber' | 'sky';
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  description: string;
  rules?: Array<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    variant?: 'lime' | 'sky' | 'amber';
  }>;
  previewSlot?: React.ReactNode;
  selectorSlot?: React.ReactNode;
  actionsSlot: React.ReactNode;
  secondaryLinksSlot?: React.ReactNode;
  glowColor?: string;
}

export function ModeCard({
  tag,
  tagVariant = 'lime',
  icon,
  title,
  subtitle,
  description,
  rules,
  previewSlot,
  selectorSlot,
  actionsSlot,
  secondaryLinksSlot,
  glowColor,
  className,
  ...props
}: ModeCardProps) {
  return (
    <Panel
      variant="highlight"
      hasAmbientLight
      glowColor={glowColor}
      className={cn('p-5 sm:p-7 md:p-8 flex flex-col justify-between gap-5 sm:gap-6 group', className)}
      {...props}
    >
      <div className="space-y-4 sm:space-y-5">
        {/* Header Strip */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl border border-lime/40 bg-lime/10 text-lime shadow-xl shadow-lime/10">
              {icon}
            </div>
            <div className="min-w-0">
              {subtitle && (
                <span className="text-lime text-[10px] font-black tracking-widest uppercase block truncate">
                  {subtitle}
                </span>
              )}
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-display truncate">
                {title}
              </h2>
            </div>
          </div>

          {tag && (
            <StatPill variant={tagVariant} size="sm" className="shrink-0">
              {tag}
            </StatPill>
          )}
        </div>

        {/* Description */}
        <p className="text-steel text-xs sm:text-sm font-medium leading-relaxed">
          {description}
        </p>

        {/* Visual Preview Slot (e.g. Rank 3-item strip) */}
        {previewSlot}

        {/* Core Tactical Rules Strip (3 column cards) */}
        {rules && rules.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-2.5 sm:p-3 text-center sm:text-start"
              >
                <div className="mb-1 flex items-center justify-center gap-1.5 sm:justify-start">
                  <span className="shrink-0">{rule.icon}</span>
                  <span
                    className={cn(
                      'text-[10px] sm:text-xs font-black uppercase truncate',
                      rule.variant === 'sky'
                        ? 'text-sky-400'
                        : rule.variant === 'amber'
                          ? 'text-amber-300'
                          : 'text-lime',
                    )}
                  >
                    {rule.title}
                  </span>
                </div>
                <p className="text-steel text-[9px] sm:text-[10px] font-medium truncate">
                  {rule.subtitle}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Pool / Tab Selector Slot */}
        {selectorSlot}
      </div>

      {/* Action Buttons & Secondary Links */}
      <div className="space-y-3 pt-1">
        {actionsSlot}
        {secondaryLinksSlot && (
          <div className="flex items-center justify-between px-1 pt-0.5">
            {secondaryLinksSlot}
          </div>
        )}
      </div>
    </Panel>
  );
}
