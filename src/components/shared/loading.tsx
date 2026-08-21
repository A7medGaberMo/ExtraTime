'use client';

import { CircleNotch } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <AppIcon
      icon={CircleNotch}
      size={size}
      weight="bold"
      className={cn('text-lime animate-spin', className)}
    />
  );
}

export function FullPageLoading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <LoadingSpinner size={40} />
    </div>
  );
}
