'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ResultsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/** End-of-match results surface — semantic tokens only. */
export function ResultsCard({ className, children, ...props }: ResultsCardProps) {
  return (
    <div
      className={cn(
        'card-sheen relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-2xl shadow-elev-3',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
