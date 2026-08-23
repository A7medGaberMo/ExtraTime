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
      className={cn('p-5 sm:p-7 flex flex-col justify-between gap-5 group', className)}
      {...props}
    >
      <div className="space-y-4">
        {/* Header Strip */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl border border-lime/40 bg-lime/10 text-lime shadow-sm">
              {icon}
            </div>
            <div className="min-w-0">
              {subtitle && (
                <span className="text-lime text-xs font-semibold tracking-wide uppercase block truncate">
                  {subtitle}
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display truncate">
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
        <p className="text-steel text-xs sm:text-sm font-normal leading-relaxed">
          {description}
        </p>

        {/* Visual Preview Slot */}
        {previewSlot}

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

