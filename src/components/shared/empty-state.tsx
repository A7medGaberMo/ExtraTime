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
  return typeof action === 'object' && action !== null && 'label' in action && 'href' in action;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl p-10 text-center',
        className,
      )}
    >
      <div className="text-steel mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold text-white">{title}</h3>
      <p className="text-steel mb-6 max-w-sm text-sm leading-relaxed">{description}</p>
      {action && (
        <div>
          {isActionObject(action) ? (
            <Link
              href={action.href}
              className="bg-lime text-background shadow-lime/20 hover:bg-vivid hover:shadow-lime/30 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-black shadow-lg transition-all active:scale-95"
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
