'use client';

import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number; // duration in ms, default 3500
  particleCount?: number; // default 65 on mobile, 110 on desktop
}

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
}

const PALETTE = [
  '#8ee000', // Lime
  '#ffd60a', // Gold
  '#0a84ff', // Sky
  '#ff375f', // Rose
  '#30d158', // Green
  '#bf5af2', // Master Violet
  '#ffffff', // White sparkle
];

export function Confetti({ active, duration = 3500, particleCount }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const isMobile = width < 768;
    const count = particleCount ?? (isMobile ? 65 : 120);

    const particles: Particle[] = Array.from({ length: count }, () => {
      const angle = (Math.random() * 60 + 60) * (Math.PI / 180); // Upwards fountain
      const speed = Math.random() * 12 + 8;
      const spreadX = Math.random() > 0.5 ? 1 : -1;

      return {
        x: width * 0.5 + (Math.random() - 0.5) * 80,
        y: height * 0.75,
        w: Math.random() * 8 + 6,
        h: Math.random() * 5 + 4,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        vx: Math.cos(angle) * speed * spreadX * (Math.random() * 1.5 + 0.5),
        vy: -Math.sin(angle) * speed * (Math.random() * 0.6 + 0.8),
        angle: Math.random() * 360,
        angularVelocity: (Math.random() - 0.5) * 12,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.1 + 0.05,
        opacity: 1,
      };
    });

    let animationId: number;
    const startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38; // gravity
        p.vx *= 0.985; // air resistance
        p.angle += p.angularVelocity;
        p.wobble += p.wobbleSpeed;

        if (progress > 0.7) {
          p.opacity = Math.max(0, 1 - (progress - 0.7) / 0.3);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.scale(Math.sin(p.wobble), 1);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
    };
  }, [active, duration, particleCount]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}
