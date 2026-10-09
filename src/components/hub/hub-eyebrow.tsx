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
      data-hub-eyebrow
      className={cn(
        'hub-eyebrow-container flex w-full shrink-0 items-center justify-center gap-2.5 sm:gap-3',
        className,
      )}
      style={{
        height: 'var(--hub-eyebrow-height)',
        marginBottom: 'var(--hub-gap-eyebrow-title)',
      }}
    >
      <span className="hub-eyebrow-line shrink-0" aria-hidden="true" />
      <span className="hub-eyebrow shrink-0">
        {text}
      </span>
      <span className="hub-eyebrow-line hub-eyebrow-line-end shrink-0" aria-hidden="true" />
    </div>
  );
}
