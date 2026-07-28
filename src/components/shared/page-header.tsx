'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional back navigation URL */
  backUrl?: string;
  /** Optional action slot (e.g., button) */
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, backUrl, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8',
        className,
      )}
    >
      <div className="space-y-1">
        {backUrl && (
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1.5 text-sm text-steel hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        )}
        <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-steel md:text-base">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
