"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-400">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-black text-white">Unexpected Error</h1>
      <p className="max-w-md text-sm text-steel leading-relaxed">
        Something went wrong while loading this page. It&apos;s not you, it&apos;s us.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3 text-sm font-black text-background shadow-lg shadow-lime/20 transition-all hover:bg-vivid active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-card px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:border-white/30 active:scale-95"
        >
          <Home className="h-4 w-4" />
          Go home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-4 text-[10px] text-steel font-mono">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
