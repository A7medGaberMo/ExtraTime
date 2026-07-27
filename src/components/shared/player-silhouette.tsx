'use client';

import { cn } from '@/lib/utils';

/**
 * 6 diverse player silhouette variants for visual variety on cards.
 * Each is a distinct pose/stance so cards don't feel repetitive.
 *
 * Variants:
 * 0 — Standing confident (hands on hips)
 * 1 — Ball at foot (dribbling stance)
 * 2 — Running / in motion
 * 3 — Arms crossed (captain pose)
 * 4 — Celebrating (fist pump)
 * 5 — Goalkeeper stance (wide arms)
 */

interface PlayerSilhouetteProps {
  variant: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export function PlayerSilhouette({ variant, className }: PlayerSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 120 160"
      fill="currentColor"
      className={cn('text-slate-400', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {silhouettes[variant]}
    </svg>
  );
}

const silhouettes: Record<number, React.ReactNode> = {
  // 0 — Standing confident (hands on hips)
  0: (
    <>
      <circle cx="60" cy="24" r="16" />
      <path d="M60 42c-12 0-22 8-24 18l-4 30c0 3 2 5 5 5h6l3 55c0 4 3 7 7 7h14c4 0 7-3 7-7l3-55h6c3 0 5-2 5-5l-4-30c-2-10-12-18-24-18z" />
      <path d="M36 68l-10 8c-2 1.5-2 4 0 5l8 5" opacity="0.9" />
      <path d="M84 68l10 8c2 1.5 2 4 0 5l-8 5" opacity="0.9" />
    </>
  ),

  // 1 — Ball at foot (dribbling)
  1: (
    <>
      <circle cx="58" cy="22" r="15" />
      <path d="M58 39c-11 0-20 7-22 17l-3 28c0 3 2 5 5 5h4l2 40c0 4 3 6 6 6h8l6-20 8 20h8c3 0 5-2 5-6l-6-40h4c3 0 5-2 5-5l-4-28c-2-10-11-17-22-17z" />
      <path d="M38 62l-14 14c-2 2-1 4 1 5l12 2" opacity="0.9" />
      <path d="M78 62l10 20c1 2 0 4-2 4l-10-2" opacity="0.9" />
      <circle cx="82" cy="148" r="8" opacity="0.5" />
    </>
  ),

  // 2 — Running / in motion
  2: (
    <>
      <circle cx="62" cy="20" r="14" />
      <path d="M62 36c-10 0-18 6-20 15l-3 24c0 2 1 4 4 4h3l-4 32 14 18c2 2 5 2 7 0l6-14 8 16c2 3 5 3 7 0l8-22-2-30h3c3 0 4-2 4-4l-3-24c-2-9-10-15-20-15z" />
      <path d="M42 56l-16 6c-3 1-3 4-1 5l14 6" opacity="0.9" />
      <path d="M82 56l12 12c2 2 1 5-1 5l-12-4" opacity="0.9" />
    </>
  ),

  // 3 — Arms crossed (captain pose)
  3: (
    <>
      <circle cx="60" cy="22" r="15" />
      <path d="M60 39c-12 0-22 8-24 18l-3 26c0 3 2 5 5 5h4l3 54c0 4 3 7 7 7h16c4 0 7-3 7-7l3-54h4c3 0 5-2 5-5l-3-26c-2-10-12-18-24-18z" />
      <path d="M36 62l4 14h40l4-14" opacity="0.9" />
      <path d="M42 68l16 4 16-4" opacity="0.7" />
    </>
  ),

  // 4 — Celebrating (fist pump)
  4: (
    <>
      <circle cx="58" cy="22" r="15" />
      <path d="M58 39c-12 0-21 8-23 18l-3 28c0 3 2 5 5 5h4l4 52c0 4 3 7 7 7h14c4 0 7-3 7-7l4-52h4c3 0 5-2 5-5l-3-28c-2-10-11-18-23-18z" />
      <path d="M35 60l-6-22c-1-3 1-5 3-5l6 2 3 20" opacity="0.9" />
      <path d="M81 60l10 16c2 3 0 5-2 5l-10-6" opacity="0.9" />
    </>
  ),

  // 5 — Goalkeeper stance (wide arms)
  5: (
    <>
      <circle cx="60" cy="24" r="16" />
      <path d="M60 42c-12 0-22 8-24 18l-4 28c0 3 2 5 5 5h6l3 50c0 4 3 7 7 7h14c4 0 7-3 7-7l3-50h6c3 0 5-2 5-5l-4-28c-2-10-12-18-24-18z" />
      <path d="M36 58l-22 4c-3 1-4 3-3 6l8 14 14-10" opacity="0.9" />
      <path d="M84 58l22 4c3 1 4 3 3 6l-8 14-14-10" opacity="0.9" />
    </>
  ),
};
