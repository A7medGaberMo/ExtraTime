'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  href: string;
}

interface EmptyStateProps {
  /** Pass a rendered icon element, e.g. <Gavel className="h-8 w-8" /> */
  icon: ReactNode;
  title: string;
  description: string;
  /** Action button — either an object { label, href } or a ReactNode */
  action?: EmptyStateAction | ReactNode;
  className?: string;
}

function isActionObject(action: EmptyStateAction | ReactNode): action is EmptyStateAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    'label' in action &&
    'href' in action
  );
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl p-10 text-center',
        className,
      )}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-steel">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-steel">{description}</p>
      {action && (
        <div>
          {isActionObject(action) ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3 text-sm font-black text-background shadow-lg shadow-lime/20 transition-all hover:bg-vivid hover:shadow-lime/30 active:scale-95"
            >
              {action.label}
            </Link>
          ) : (
            action
          )}
        </div>
      )}
    </div>
  );
}
