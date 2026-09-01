'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type LogoVariant =
  | 'primary'
  | 'monochrome-white'
  | 'monochrome-black'
  | 'metallic-silver'
  | 'metallic-gold'
  | 'brushed-steel'
  | 'embossed'
  | 'debossed'
  | 'glass'
  | 'holographic-foil'
  | 'minimal-outline'
  | 'icon-only'
  | 'watermark'
  | 'micro-16px'
  | 'card-badge'
  | 'favicon';

interface ETLogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: LogoVariant;
  size?: number | string;
  showWordmark?: boolean;
  className?: string;
}

export function ETLogo({
  variant = 'primary',
  size = 32,
  showWordmark,
  className,
  ...props
}: ETLogoProps) {
  const isIconOnlyVariant = ['icon-only', 'micro-16px', 'card-badge', 'favicon'].includes(variant);
  const displayWordmark = showWordmark !== undefined ? showWordmark : !isIconOnlyVariant;

  const viewBox = displayWordmark ? '0 0 400 300' : '0 0 200 200';
  const transform = displayWordmark ? 'translate(100, 35)' : 'translate(0, 0)';

  let fillE = '#FFFFFF';
  let fillT = 'url(#et-lime-grad-cmp)';
  let bg = 'none';
  let stroke = 'none';
  let filter = '';
  let opacity = 1.0;

  switch (variant) {
    case 'primary':
      fillE = '#FFFFFF';
      fillT = 'url(#et-lime-grad-cmp)';
      break;
    case 'monochrome-white':
      fillE = '#FFFFFF';
      fillT = '#FFFFFF';
      break;
    case 'monochrome-black':
      fillE = '#02050A';
      fillT = '#02050A';
      break;
    case 'metallic-silver':
      fillE = 'url(#et-silver-grad-cmp)';
      fillT = 'url(#et-silver-grad-cmp)';
      break;
    case 'metallic-gold':
      fillE = 'url(#et-gold-grad-cmp)';
      fillT = 'url(#et-gold-grad-cmp)';
      break;
    case 'brushed-steel':
      fillE = 'url(#et-steel-grad-cmp)';
      fillT = 'url(#et-steel-grad-cmp)';
      break;
    case 'embossed':
      fillE = '#E2E8F0';
      fillT = '#95E810';
      filter = 'url(#et-emboss-cmp)';
      break;
    case 'debossed':
      fillE = '#64748B';
      fillT = '#32521E';
      break;
    case 'glass':
      fillE = 'url(#et-glass-grad-cmp)';
      fillT = 'url(#et-glass-grad-cmp)';
      stroke = 'rgba(255,255,255,0.4)';
      break;
    case 'holographic-foil':
      fillE = 'url(#et-holo-grad-cmp)';
      fillT = 'url(#et-holo-grad-cmp)';
      break;
    case 'minimal-outline':
      fillE = 'none';
      fillT = 'none';
      stroke = '#95E810';
      break;
    case 'icon-only':
      fillE = '#FFFFFF';
      fillT = 'url(#et-lime-grad-cmp)';
      break;
    case 'watermark':
      fillE = '#FFFFFF';
      fillT = '#FFFFFF';
      opacity = 0.08;
      break;
    case 'micro-16px':
      fillE = '#FFFFFF';
      fillT = '#95E810';
      break;
    case 'card-badge':
      fillE = '#FFFFFF';
      fillT = '#95E810';
      break;
    case 'favicon':
      fillE = '#FFFFFF';
      fillT = '#95E810';
      bg = '#02050A';
      break;
  }

  const numericSize = typeof size === 'number' ? size : parseInt(size, 10) || 32;
  const width = numericSize;
  const height = displayWordmark ? Math.round(numericSize * 0.75) : numericSize;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width}
      height={height}
      style={{ opacity }}
      className={cn('inline-block shrink-0 select-none', className)}
      {...props}
    >
      <defs>
        <linearGradient id="et-primary-grad-cmp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="et-lime-grad-cmp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B8F036" />
          <stop offset="50%" stopColor="#95E810" />
          <stop offset="100%" stopColor="#65B307" />
        </linearGradient>
        <linearGradient id="et-silver-grad-cmp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="75%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id="et-gold-grad-cmp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF7CC" />
          <stop offset="30%" stopColor="#FDE68A" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="85%" stopColor="#92400E" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id="et-steel-grad-cmp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="et-holo-grad-cmp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A8A" />
          <stop offset="25%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#34D399" />
          <stop offset="75%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
        <linearGradient id="et-glass-grad-cmp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        <filter id="et-emboss-cmp" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="-2" dy="-2" result="offset1" />
          <feComponentTransfer in="offset1" result="light">
            <feFuncA type="linear" slope="0.7" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="light" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {bg !== 'none' && <rect width="100%" height="100%" fill={bg} rx="30" />}

      <g filter={filter || undefined}>
        <g transform={transform}>
          {/* E Monogram Slash */}
          <path
            d="M 45 40 L 115 40 L 105 68 L 65 68 L 59 86 L 95 86 L 85 114 L 49 114 L 41 138 L 85 138 L 75 166 L 5 166 Z"
            fill={fillE}
            stroke={stroke !== 'none' ? stroke : undefined}
            strokeWidth={stroke !== 'none' ? 6 : undefined}
          />
          {/* T Monogram Slash */}
          <path
            d="M 85 40 L 190 40 L 180 68 L 148 68 L 114 166 L 82 166 L 116 68 L 75 68 Z"
            fill={fillT}
            stroke={stroke !== 'none' ? stroke : undefined}
            strokeWidth={stroke !== 'none' ? 6 : undefined}
          />
        </g>

        {displayWordmark && (
          <g transform="translate(200, 220)" textAnchor="middle">
            <text
              fontFamily="'Sora', 'Inter', sans-serif"
              fontWeight="900"
              fontSize="34"
              letterSpacing="6"
              fill={fillE}
            >
              EXTRA<tspan fill={fillT}>TIME</tspan>
            </text>
            <text
              y="24"
              fontFamily="'Rajdhani', sans-serif"
              fontWeight="700"
              fontSize="11"
              letterSpacing="8"
              fill="#848487"
            >
              PLAY • COMPETE • CONNECT
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
