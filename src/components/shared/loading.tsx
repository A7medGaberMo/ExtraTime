"use client";

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("h-6 w-6 animate-spin text-primary", className)} />
  );
}

export function FullPageLoading() {
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <LoadingSpinner className="h-10 w-10" />
    </div>
  );
}
