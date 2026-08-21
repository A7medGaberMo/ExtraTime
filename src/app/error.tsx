'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Warning, ArrowCounterClockwise, House } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-400">
        <AppIcon icon={Warning} size={40} weight="duotone" />
      </div>
      <h1 className="text-3xl font-black text-white uppercase font-display">Unexpected Error</h1>
      <p className="text-steel max-w-md text-sm leading-relaxed font-medium">
        Something went wrong while loading this page. It&apos;s not you, it&apos;s us.
      </p>
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={reset}
          leftIcon={<AppIcon icon={ArrowCounterClockwise} size={16} weight="bold" />}
        >
          Try again
        </Button>
        <Link href="/">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<AppIcon icon={House} size={16} weight="bold" />}
          >
            Go home
          </Button>
        </Link>
      </div>
      {error.digest && (
        <p className="text-steel mt-4 font-mono text-[10px]">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
