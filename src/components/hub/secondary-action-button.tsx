'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/ui/app-icon';
import { type Icon } from '@phosphor-icons/react';

export interface SecondaryActionButtonProps {
  id?: string;
  label: string;
  icon: Icon;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export function SecondaryActionButton({
  id,
  label,
  icon,
  href,
  onClick,
  disabled = false,
  className,
}: SecondaryActionButtonProps) {
  const handleSpotlight = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  const sharedClassName = cn(
    'hub-action-card btn-haptic group relative flex h-16 items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 text-center sm:h-[68px]',
    disabled && 'pointer-events-none opacity-50',
    className,
  );

  const innerContent = (
    <>
      <span
        className="hub-card-icon relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] transition-colors duration-200"
      >
        <AppIcon
          icon={icon}
          size={19}
          weight="regular"
          className="text-[#C8CBD2] transition-colors duration-200 group-hover:brightness-125"
        />
      </span>
      <span className="hub-card-title relative z-10 truncate text-[#F5F5F7]">
        {label}
      </span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        id={id}
        onPointerMove={handleSpotlight}
        className={sharedClassName}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      disabled={disabled}
      onPointerMove={handleSpotlight}
      className={sharedClassName}
    >
      {innerContent}
    </button>
  );
}
