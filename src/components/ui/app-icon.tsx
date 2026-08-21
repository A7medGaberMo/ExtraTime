'use client';

import React from 'react';
import type { Icon as PhosphorIconType, IconWeight } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type AppIconWeight = 'duotone' | 'bold' | 'regular' | 'fill' | 'light' | 'thin';

interface AppIconProps extends React.SVGAttributes<SVGSVGElement> {
  icon: PhosphorIconType;
  size?: number | string;
  weight?: AppIconWeight;
  className?: string;
  /** Force RTL flip behavior. If undefined, directional icons are automatically flipped. */
  flipRTL?: boolean;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

export function AppIcon({
  icon: IconComponent,
  size = 20,
  weight = 'bold',
  className,
  flipRTL,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  ...props
}: AppIconProps) {
  const { isRTL } = useI18n();

  // Determine if icon should be mirrored in RTL
  const iconName = (IconComponent as { displayName?: string })?.displayName || '';
  const isDirectional =
    /Arrow|Caret|Chevron|FastForward|Rewind|Skip|SignOut|SignIn|Export|ArrowSquare/i.test(iconName);

  const shouldFlip = flipRTL !== undefined ? flipRTL && isRTL : isDirectional && isRTL;

  return (
    <IconComponent
      size={size}
      weight={weight as IconWeight}
      className={cn(
        'shrink-0 transition-transform duration-150 inline-block align-middle',
        shouldFlip && '-scale-x-100',
        className,
      )}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden ?? (ariaLabel ? false : true)}
      {...props}
    />
  );
}
