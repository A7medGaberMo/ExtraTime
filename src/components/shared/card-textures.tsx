'use client';

import React from 'react';
import { Tier } from '@/types/player';

export function CardBackgroundTexture({ tier }: { tier: Tier }) {
  switch (tier) {
    case 'ICON':
      // Marble veins & Guilloche Gold (opacity 4%)
      return (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="tex-icon-marble" width="100" height="100" patternUnits="userSpaceOnUse">
            <path
              d="M 0 20 Q 25 5, 50 40 T 100 20 M 100 70 Q 75 95, 25 70 T 0 100"
              fill="none"
              stroke="#F7F5EF"
              strokeWidth="0.8"
            />
            <path
              d="M 15 0 Q 35 35, 75 15 T 100 75"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="0.6"
            />
            <text
              x="50"
              y="55"
              fontSize="8"
              fontFamily="sans-serif"
              fontWeight="900"
              fill="#D4AF37"
              opacity="0.3"
              textAnchor="middle"
            >
              ET
            </text>
          </pattern>
          <rect width="100%" height="100%" fill="url(#tex-icon-marble)" />
        </svg>
      );

    case 'HERO':
      // Emerald starburst & heroic shield lines (opacity 4%)
      return (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="tex-hero-shield" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 30 5 L 55 20 L 55 45 L 30 55 L 5 45 L 5 20 Z"
              fill="none"
              stroke="#10B981"
              strokeWidth="0.6"
            />
            <path
              d="M 30 15 L 45 25 L 45 40 L 30 45 L 15 40 L 15 25 Z"
              fill="none"
              stroke="#A7F3D0"
              strokeWidth="0.4"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tex-hero-shield)" />
        </svg>
      );

    case 'MASTER':
      // Crystal geometry (hexagonal faceted lattice, opacity 4%)
      return (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="tex-master-crystal" width="40" height="40" patternUnits="userSpaceOnUse">
            <polygon
              points="20,0 40,10 40,30 20,40 0,30 0,10"
              fill="none"
              stroke="#D8B4FE"
              strokeWidth="0.6"
            />
            <line x1="20" y1="0" x2="20" y2="40" stroke="#7C3AED" strokeWidth="0.4" />
            <line x1="0" y1="10" x2="40" y2="30" stroke="#7C3AED" strokeWidth="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tex-master-crystal)" />
        </svg>
      );

    case 'ULTIMATE':
      // Sapphire facets (opacity 4%)
      return (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="tex-ultimate-sapphire" width="45" height="45" patternUnits="userSpaceOnUse">
            <path
              d="M 22.5 0 L 45 22.5 L 22.5 45 L 0 22.5 Z"
              fill="none"
              stroke="#7DD3FC"
              strokeWidth="0.7"
            />
            <line x1="0" y1="0" x2="45" y2="45" stroke="#0EA5E9" strokeWidth="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tex-ultimate-sapphire)" />
        </svg>
      );

    case 'ELITE':
      // Technical polygons (opacity 4%)
      return (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="tex-elite-poly" width="30" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M 0 0 L 30 15 L 0 30 Z M 30 0 L 30 30 L 0 15 Z"
              fill="none"
              stroke="#93C5FD"
              strokeWidth="0.5"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tex-elite-poly)" />
        </svg>
      );

    case 'GOLD':
      // Luxury engraving (fine metallic guilloche curves, opacity 4%)
      return (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="tex-gold-engrave" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#FDE68A"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <circle cx="25" cy="25" r="10" fill="none" stroke="#EAB308" strokeWidth="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tex-gold-engrave)" />
        </svg>
      );

    case 'SILVER':
      // Brushed aluminum grain (horizontal micro hairline steel, opacity 4%)
      return (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="tex-silver-brushed" width="80" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="2" x2="80" y2="2" stroke="#F8FAFC" strokeWidth="0.4" />
            <line x1="0" y1="6" x2="80" y2="6" stroke="#64748B" strokeWidth="0.4" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tex-silver-brushed)" />
        </svg>
      );

    case 'BRONZE':
    default:
      // Hammered copper (opacity 4%)
      return (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="tex-bronze-hammered" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1.2" fill="#E8BE97" />
            <circle cx="15" cy="15" r="1" fill="#5B341A" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#tex-bronze-hammered)" />
        </svg>
      );
  }
}
