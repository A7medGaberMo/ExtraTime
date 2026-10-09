'use client';

import React, { useEffect, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Vault } from '@phosphor-icons/react';

interface VaultDot {
  index: number;
  x: number;
  y: number;
  size: number;
}

// 12 Bank ladder steps along the middle ring (r = 32% of circle, inset 18%)
const VAULT_DOTS: VaultDot[] = Array.from({ length: 12 }, (_, idx) => {
  const angleDeg = -90 + idx * 30;
  const angleRad = (angleDeg * Math.PI) / 180;
  const radiusPercent = 32; // Matches inset 18% (100 - 36 = 64% diameter, 32% radius)
  const x = +(50 + Math.cos(angleRad) * radiusPercent).toFixed(2);
  const y = +(50 + Math.sin(angleRad) * radiusPercent).toFixed(2);
  // 5px to 7px scale
  const size = +(5 + (idx / 11) * 2).toFixed(1);

  return { index: idx, x, y, size };
});

export function BankVaultVisual() {
  const [litCount, setLitCount] = useState<number>(6);
  const [isBanked, setIsBanked] = useState<boolean>(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setLitCount(6);
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout;

    let mode: 'bank' | 'miss' = 'bank';
    let currentStep = 0;
    const maxBankStep = 8;
    const maxMissStep = 5;

    const stepSimulation = () => {
      if (!isMounted) return;

      if (mode === 'bank') {
        if (currentStep <= maxBankStep) {
          setLitCount(currentStep);
          setIsBanked(false);
          currentStep++;
          timer = setTimeout(stepSimulation, 520);
        } else if (currentStep === maxBankStep + 1) {
          setIsBanked(true);
          currentStep++;
          timer = setTimeout(stepSimulation, 1600);
        } else {
          setIsBanked(false);
          setLitCount(0);
          mode = 'miss';
          currentStep = 0;
          timer = setTimeout(stepSimulation, 600);
        }
      } else {
        if (currentStep <= maxMissStep) {
          setLitCount(currentStep);
          setIsBanked(false);
          currentStep++;
          timer = setTimeout(stepSimulation, 520);
        } else if (currentStep === maxMissStep + 1) {
          setLitCount(0);
          currentStep++;
          timer = setTimeout(stepSimulation, 1200);
        } else {
          mode = 'bank';
          currentStep = 0;
          timer = setTimeout(stepSimulation, 600);
        }
      }
    };

    timer = setTimeout(stepSimulation, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {/* 12 Bank Dots along middle ring (5 to 7px, unlit 15% opacity, lit full accent + glow) */}
      {VAULT_DOTS.map((dot) => {
        const isLit = dot.index < litCount;

        return (
          <div
            key={dot.index}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
            }}
            aria-hidden="true"
          >
            <span
              className="relative rounded-full transition-all duration-300"
              style={{
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                backgroundColor: isLit
                  ? 'var(--hub-accent-light)'
                  : 'color-mix(in srgb, var(--hub-accent) 15%, transparent)',
                boxShadow: isLit
                  ? '0 0 6px var(--hub-accent)'
                  : 'none',
              }}
            />
          </div>
        );
      })}

      {/* Center Core Badge — Vault Mark */}
      <div
        className="hub-center-badge relative z-10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{
          boxShadow: isBanked
            ? '0 0 28px color-mix(in srgb, var(--hub-accent) 55%, transparent), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
            : undefined,
          transform: isBanked ? 'scale(1.08)' : undefined,
        }}
      >
        <AppIcon
          icon={Vault}
          size={24}
          weight={isBanked ? 'fill' : 'duotone'}
          className="transition-all duration-300"
          style={{
            color: 'var(--hub-accent)',
            filter: isBanked
              ? 'drop-shadow(0 0 8px var(--hub-accent))'
              : 'drop-shadow(0 1px 6px color-mix(in srgb, var(--hub-accent) 60%, transparent))',
          }}
        />
      </div>
    </>
  );
}
