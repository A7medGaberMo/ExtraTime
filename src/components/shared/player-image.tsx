'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { PlayerSilhouette } from './player-silhouette';

interface PlayerImageProps {
  src?: string | null;
  imageUrl?: string | null;
  alt?: string;
  name?: string;
  size?: number;
  tier?: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  variant?: 0 | 1 | 2 | 3 | 4 | 5;
  silhouetteClassName?: string;
}

/**
 * Universal safe Player Image component.
 * - Enforces `referrerPolicy="no-referrer"` to bypass Wikipedia/CDN hotlink blocking.
 * - Safely detects missing/invalid images or loading errors.
 * - Automatically falls back to a sleek `PlayerSilhouette` without displaying broken image icons or unstyled alt text.
 * - Resets error state dynamically whenever `src` changes.
 */
export function PlayerImage({
  src,
  imageUrl,
  alt,
  name,
  size,
  tier,
  className,
  imgClassName,
  fallbackClassName,
  variant,
  silhouetteClassName,
}: PlayerImageProps) {
  const imageSource = src ?? imageUrl;
  const [prevSrc, setPrevSrc] = useState(imageSource);
  const [hasError, setHasError] = useState(false);

  // Reset error state when imageSource changes
  if (prevSrc !== imageSource) {
    setPrevSrc(imageSource);
    setHasError(false);
  }

  const playerName = name || alt || 'Player';
  const calculatedVariant: 0 | 1 | 2 | 3 | 4 | 5 =
    variant ??
    ((((playerName.charCodeAt(0) || 0) + playerName.length) % 6) as 0 | 1 | 2 | 3 | 4 | 5);

  const isValidUrl =
    Boolean(imageSource) &&
    typeof imageSource === 'string' &&
    imageSource.trim() !== '' &&
    !imageSource.includes('Photo-Missing.png') &&
    !hasError;

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      {isValidUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageSource!}
          alt={alt || name || 'Player'}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={cn('h-full w-full object-cover object-top', imgClassName)}
        />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center', fallbackClassName)}>
          <PlayerSilhouette
            variant={calculatedVariant}
            className={cn('h-3/4 w-3/4 text-white/90', silhouetteClassName)}
          />
        </div>
      )}
    </div>
  );
}
