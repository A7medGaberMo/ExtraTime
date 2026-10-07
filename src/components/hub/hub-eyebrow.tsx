'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface HubEyebrowProps {
  text: string;
  className?: string;
}

export function HubEyebrow({ text, className }: HubEyebrowProps) {
  return (
    <div
      className={cn(
        'hub-stagger-1 mb-1 flex items-center justify-center gap-2.5 sm:gap-3',
        className,
      )}
    >
      <span className="hub-eyebrow-line shrink-0" aria-hidden="true" />
      <span className="hub-eyebrow text-[11px] font-semibold tracking-[0.24em] drop-shadow-sm sm:text-xs">
        {text}
      </span>
      <span className="hub-eyebrow-line hub-eyebrow-line-end shrink-0" aria-hidden="true" />
    </div>
  );
}
