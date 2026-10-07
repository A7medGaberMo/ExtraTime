'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface HubVisualProps {
  children: React.ReactNode;
  className?: string;
}

export function HubVisual({ children, className }: HubVisualProps) {
  return (
    <div
      className={cn(
        'hub-radar-stage hub-stagger-3 mt-4 sm:mt-5 flex min-h-0 w-full flex-1 items-center justify-center',
        className,
      )}
    >
      <div className="hub-radar-display relative flex items-center justify-center">
        {/* Scope Corner Brackets (Framing) */}
        <span className="hub-scope-bracket hub-scope-bracket-tl" aria-hidden="true" />
        <span className="hub-scope-bracket hub-scope-bracket-tr" aria-hidden="true" />
        <span className="hub-scope-bracket hub-scope-bracket-bl" aria-hidden="true" />
        <span className="hub-scope-bracket hub-scope-bracket-br" aria-hidden="true" />

        {/* Visual Slot */}
        {children}
      </div>
    </div>
  );
}
