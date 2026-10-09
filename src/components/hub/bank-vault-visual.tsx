'use client';

import React, { useEffect, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { Vault } from '@phosphor-icons/react';

interface VaultDot {
  index: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // px
  value: string;
}

// 12 Bank ladder steps along the 18% inset middle ring (r = 32% of 240px = 76.8px)
const LADDER_VALUES = ['1', '2', '4', '8', '16', '32', '64', '128', '256', '512', '1K', '2K'];

const VAULT_DOTS: VaultDot[] = LADDER_VALUES.map((val, idx) => {
  // Clock positions starting from 12 o'clock (-90 deg), 30 deg steps
  const angleDeg = -90 + idx * 30;
  const angleRad = (angleDeg * Math.PI) / 180;
  const radiusPercent = 32; // middle ring is inset 18% on both sides, so diameter = 64%, radius = 32%
  const x = +(50 + Math.cos(angleRad) * radiusPercent).toFixed(2);
  const y = +(50 + Math.sin(angleRad) * radiusPercent).toFixed(2);
  // Scale dot sizes smoothly from 5px to 7px
  const size = +(5 + (idx / 11) * 2).toFixed(1);

  return {
    index: idx,
    x,
    y,
    size,
    value: val,
  };
});

export function BankVaultVisual() {
  // Animation state: active dot index (0 to 12)
  // sequenceMode: 'bank' (climbs to 8, banks successfully with center pulse) | 'miss' (climbs to 6, wipes out)
  const [litCount, setLitCount] = useState<number>(6);
  const [isBanked, setIsBanked] = useState<boolean>(false);
  const [isWiped, setIsWiped] = useState<boolean>(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setLitCount(6);
      setIsBanked(false);
      setIsWiped(false);
      return;
    }

    let isMounted = true;
    let timer: NodeJS.Timeout;

    // Simulation loop alternating between Bank and Miss
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
          setIsWiped(false);
          currentStep++;
          timer = setTimeout(stepSimulation, 520);
        } else if (currentStep === maxBankStep + 1) {
          // Trigger BANK pulse
          setIsBanked(true);
          currentStep++;
          timer = setTimeout(stepSimulation, 1600); // Hold banked state
        } else {
          // Transition to Miss cycle
          setIsBanked(false);
          setLitCount(0);
          mode = 'miss';
          currentStep = 0;
          timer = setTimeout(stepSimulation, 600);
        }
      } else {
        // Mode === 'miss'
        if (currentStep <= maxMissStep) {
          setLitCount(currentStep);
          setIsBanked(false);
          setIsWiped(false);
          currentStep++;
          timer = setTimeout(stepSimulation, 520);
        } else if (currentStep === maxMissStep + 1) {
          // Trigger wipeout: dots flash / reset
          setIsWiped(true);
          setLitCount(0);
          currentStep++;
          timer = setTimeout(stepSimulation, 1200);
        } else {
          // Transition back to Bank cycle
          setIsWiped(false);
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
      {/* Outer Degree Tick Bezel — Fine tick marks clearly visible */}
      <div className="hub-radar-ticks pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />

      {/* Slow Counter-Rotating Dashed Bezel (matching Snipe's 13% opacity) */}
      <div
        className="pointer-events-none absolute inset-[7%] rounded-full border border-dashed motion-reduce:animation-none"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 13%, transparent)',
          animation: 'draftBoardTickSweep 60s linear infinite reverse',
        }}
        aria-hidden="true"
      />

      {/* Outer Ring — 1px stroke at low opacity, no outer glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full border"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 14%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Inner Rings — Thin 1px strokes and low opacity matching Snipe */}
      <div
        className="draft-ring-breathe pointer-events-none absolute inset-[18%] rounded-full border"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 18%, transparent)',
        }}
        aria-hidden="true"
      />
      <div
        className="draft-ring-breathe draft-ring-breathe-delay pointer-events-none absolute inset-[36%] rounded-full border"
        style={{
          borderColor: 'color-mix(in srgb, var(--hub-accent) 24%, transparent)',
        }}
        aria-hidden="true"
      />

      {/* Precision Crosshair Axis Lines — Thin 1px strokes at low opacity */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div
          className="h-full w-px"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--hub-accent) 22%, transparent), transparent, color-mix(in srgb, var(--hub-accent) 22%, transparent))',
          }}
        />
        <div
          className="absolute h-px w-full"
          style={{
            background:
              'linear-gradient(to right, color-mix(in srgb, var(--hub-accent) 22%, transparent), transparent, color-mix(in srgb, var(--hub-accent) 22%, transparent))',
          }}
        />
      </div>

      {/* 12 Bank Ladder Dots along the middle ring */}
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
            {/* Ambient Aura blur when lit */}
            {isLit && (
              <span
                className="absolute rounded-full blur-[2px] transition-opacity duration-300"
                style={{
                  width: `${dot.size + 4}px`,
                  height: `${dot.size + 4}px`,
                  backgroundColor: 'color-mix(in srgb, var(--hub-accent) 40%, transparent)',
                }}
              />
            )}

            {/* Core dot */}
            <span
              className="relative rounded-full transition-all duration-300"
              style={{
                width: `${dot.size}px`,
                height: `${dot.size}px`,
                backgroundColor: isLit
                  ? 'var(--hub-accent-light)'
                  : isWiped
                    ? 'rgba(239, 68, 68, 0.35)'
                    : 'color-mix(in srgb, var(--hub-accent) 20%, transparent)',
                boxShadow: isLit
                  ? '0 0 6px var(--hub-accent)'
                  : 'none',
              }}
            />
          </div>
        );
      })}

      {/* Center Core Badge — 56px rounded-2xl with dark gradient, accent border, and Vault icon */}
      <div
        className="relative z-10 flex size-12 sm:size-14 items-center justify-center rounded-2xl border transition-all duration-500 hover:scale-105 active:scale-95"
        style={{
          borderColor: isBanked
            ? 'var(--hub-accent)'
            : 'color-mix(in srgb, var(--hub-accent) 40%, transparent)',
          background: isBanked
            ? 'linear-gradient(165deg, color-mix(in srgb, var(--hub-accent) 30%, #14121a), #111016 58%, #09090f)'
            : 'linear-gradient(165deg, color-mix(in srgb, var(--hub-accent) 18%, #14121a), #111016 58%, #09090f)',
          boxShadow: isBanked
            ? '0 0 28px color-mix(in srgb, var(--hub-accent) 55%, transparent), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
            : '0 0 20px color-mix(in srgb, var(--hub-accent) 25%, transparent), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
          transform: isBanked ? 'scale(1.08)' : 'scale(1)',
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
