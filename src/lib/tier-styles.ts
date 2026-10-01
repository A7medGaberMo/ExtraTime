import type { Tier } from '@/types/player';

export interface TierVisualStyle {
  name: Tier;
  identity: string;
  material: string;
  primary: string;
  highlight: string;
  shadow: string;
  accent: string;
  ink: string;
  surface: string;
  frame: string;
  backdrop: string;
  plate: string;
  glow: string;
}

export const TIER_ORDER: Tier[] = [
  'ICON',
  'HERO',
  'ULTIMATE',
  'MASTER',
  'ELITE',
  'GOLD',
  'SILVER',
  'BRONZE',
];

/**
 * Per-tier presentation palette. Every field is a raw CSS color string, consumed
 * only inline (`style={{ background: … }}`, box-shadow, gradients, filter).
 *
 * NOTE: `highlight`, `accent` and `shadow` deliberately remain hex literals.
 * They are hex-alpha concatenation sources — consumers build translucent variants
 * as `${tierStyle.accent}55` (also `${highlight}42`, `${highlight}26`,
 * `${shadow}CC`), which a `var(--et-tier-*)` string cannot support. Converting
 * them to tokens requires those consumers to use `color-mix(...)` first.
 */
export const TIER_STYLES: Record<Tier, TierVisualStyle> = {
  ICON: {
    name: 'ICON',
    identity: 'Off-White Icon',
    material: 'Off-white enamel, pearl ceramic, restrained antique trim',
    primary: 'var(--et-tier-icon)',
    highlight: '#FFFDF6',
    shadow: '#6D614D',
    accent: '#B79A55',
    ink: 'var(--et-canvas)',
    surface: 'var(--et-surface-2)',
    frame:
      'linear-gradient(145deg, var(--et-white) 0%, color-mix(in srgb, var(--et-tier-icon) 12%, var(--et-white)) 18%, var(--et-tier-icon) 34%, color-mix(in srgb, var(--et-tier-icon) 22%, var(--et-white)) 52%, var(--et-white) 70%, color-mix(in srgb, var(--et-tier-icon) 55%, var(--et-canvas)) 86%, color-mix(in srgb, var(--et-tier-icon) 22%, var(--et-canvas)) 100%)',
    backdrop:
      'radial-gradient(circle at 28% 12%, var(--et-hi-80) 0%, transparent 28%), radial-gradient(circle at 78% 82%, color-mix(in srgb, var(--et-tier-icon) 20%, transparent) 0%, transparent 34%), linear-gradient(160deg, var(--et-white) 0%, color-mix(in srgb, var(--et-tier-icon) 18%, var(--et-white)) 42%, color-mix(in srgb, var(--et-tier-icon) 45%, var(--et-white)) 74%, color-mix(in srgb, var(--et-tier-icon) 45%, var(--et-canvas)) 100%)',
    plate:
      'linear-gradient(180deg, var(--et-white), color-mix(in srgb, var(--et-tier-icon) 25%, var(--et-white)))',
    glow: 'var(--et-hi-30)',
  },
  HERO: {
    name: 'HERO',
    identity: 'Emerald Hero',
    material: 'Emerald glass, forest enamel, heroic gold',
    primary: 'var(--et-tier-hero)',
    highlight: '#8AF7C4',
    shadow: '#031A13',
    accent: '#E1B85F',
    ink: 'var(--et-text)',
    surface: 'var(--et-surface-2)',
    frame:
      'linear-gradient(145deg, color-mix(in srgb, var(--et-tier-gold) 25%, var(--et-white)) 0%, color-mix(in srgb, var(--et-tier-hero) 45%, var(--et-white)) 16%, var(--et-tier-hero) 34%, color-mix(in srgb, var(--et-tier-hero) 22%, var(--et-canvas)) 56%, var(--et-tier-gold) 76%, var(--et-canvas) 100%)',
    backdrop:
      'radial-gradient(circle at 30% 13%, color-mix(in srgb, var(--et-tier-hero) 44%, transparent) 0%, transparent 28%), radial-gradient(circle at 76% 78%, color-mix(in srgb, var(--et-tier-gold) 24%, transparent) 0%, transparent 34%), linear-gradient(160deg, color-mix(in srgb, var(--et-tier-hero) 70%, var(--et-canvas)) 0%, color-mix(in srgb, var(--et-tier-hero) 30%, var(--et-canvas)) 52%, var(--et-canvas) 100%)',
    plate:
      'linear-gradient(180deg, color-mix(in srgb, var(--et-tier-hero) 30%, var(--et-canvas)), var(--et-canvas))',
    glow: 'color-mix(in srgb, var(--et-tier-hero) 34%, transparent)',
  },
  ULTIMATE: {
    name: 'ULTIMATE',
    identity: 'Sapphire Ultimate',
    material: 'Electric sapphire, platinum, championship gold',
    primary: 'var(--et-tier-ultimate)',
    highlight: '#DCEEFF',
    shadow: '#020A18',
    accent: '#F0C15A',
    ink: 'var(--et-text)',
    surface: 'var(--et-surface-2)',
    frame:
      'linear-gradient(145deg, var(--et-white) 0%, color-mix(in srgb, var(--et-tier-ultimate) 40%, var(--et-white)) 14%, var(--et-tier-ultimate) 32%, color-mix(in srgb, var(--et-tier-ultimate) 25%, var(--et-canvas)) 52%, var(--et-tier-gold) 68%, color-mix(in srgb, var(--et-tier-ultimate) 15%, var(--et-white)) 84%, var(--et-canvas) 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, color-mix(in srgb, var(--et-tier-ultimate) 52%, transparent) 0%, transparent 30%), radial-gradient(circle at 76% 78%, color-mix(in srgb, var(--et-tier-gold) 26%, transparent) 0%, transparent 34%), linear-gradient(160deg, color-mix(in srgb, var(--et-tier-ultimate) 72%, var(--et-canvas)) 0%, color-mix(in srgb, var(--et-tier-ultimate) 28%, var(--et-canvas)) 52%, var(--et-canvas) 100%)',
    plate:
      'linear-gradient(180deg, color-mix(in srgb, var(--et-tier-ultimate) 30%, var(--et-canvas)), var(--et-canvas))',
    glow: 'color-mix(in srgb, var(--et-tier-ultimate) 42%, transparent)',
  },
  MASTER: {
    name: 'MASTER',
    identity: 'Violet Master',
    material: 'Royal violet lacquer, amethyst crystal, icy cyan',
    primary: 'var(--et-tier-master)',
    highlight: '#E6D2FF',
    shadow: '#05020B',
    accent: '#56D8FF',
    ink: 'var(--et-text)',
    surface: 'var(--et-surface-2)',
    frame:
      'linear-gradient(145deg, var(--et-white) 0%, color-mix(in srgb, var(--et-tier-master) 22%, var(--et-white)) 14%, var(--et-tier-master) 31%, color-mix(in srgb, var(--et-tier-master) 20%, var(--et-canvas)) 53%, var(--et-info) 73%, color-mix(in srgb, var(--et-tier-master) 40%, var(--et-canvas)) 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, color-mix(in srgb, var(--et-tier-master) 36%, transparent) 0%, transparent 28%), radial-gradient(circle at 74% 78%, color-mix(in srgb, var(--et-info) 20%, transparent) 0%, transparent 34%), linear-gradient(160deg, color-mix(in srgb, var(--et-tier-master) 60%, var(--et-canvas)) 0%, color-mix(in srgb, var(--et-tier-master) 25%, var(--et-canvas)) 50%, var(--et-canvas) 100%)',
    plate:
      'linear-gradient(180deg, color-mix(in srgb, var(--et-tier-master) 30%, var(--et-canvas)), var(--et-canvas))',
    glow: 'color-mix(in srgb, var(--et-tier-master) 42%, transparent)',
  },
  ELITE: {
    name: 'ELITE',
    identity: 'Ruby Elite',
    material: 'Ruby enamel, dark carbon, bright rose metal',
    primary: 'var(--et-tier-elite)',
    highlight: '#FFC2CB',
    shadow: '#080609',
    accent: '#FF5C7C',
    ink: 'var(--et-text)',
    surface: 'var(--et-surface-2)',
    frame:
      'linear-gradient(145deg, color-mix(in srgb, var(--et-tier-elite) 15%, var(--et-white)) 0%, color-mix(in srgb, var(--et-tier-elite) 75%, var(--et-white)) 16%, var(--et-tier-elite) 34%, var(--et-canvas) 58%, color-mix(in srgb, var(--et-tier-elite) 45%, var(--et-white)) 78%, color-mix(in srgb, var(--et-tier-elite) 25%, var(--et-canvas)) 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, color-mix(in srgb, var(--et-tier-elite) 34%, transparent) 0%, transparent 28%), radial-gradient(circle at 76% 78%, color-mix(in srgb, var(--et-tier-elite) 16%, transparent) 0%, transparent 34%), linear-gradient(160deg, color-mix(in srgb, var(--et-tier-elite) 60%, var(--et-canvas)) 0%, color-mix(in srgb, var(--et-tier-elite) 25%, var(--et-canvas)) 50%, var(--et-canvas) 100%)',
    plate:
      'linear-gradient(180deg, color-mix(in srgb, var(--et-tier-elite) 30%, var(--et-canvas)), var(--et-canvas))',
    glow: 'color-mix(in srgb, var(--et-tier-elite) 34%, transparent)',
  },
  GOLD: {
    name: 'GOLD',
    identity: 'Champagne Gold',
    material: 'Champagne metal, polished gold, midnight base',
    primary: 'var(--et-tier-gold)',
    highlight: '#FFE7A6',
    shadow: '#241505',
    accent: '#B9792A',
    ink: 'var(--et-canvas)',
    surface: 'var(--et-surface-2)',
    frame:
      'linear-gradient(145deg, color-mix(in srgb, var(--et-tier-gold) 15%, var(--et-white)) 0%, color-mix(in srgb, var(--et-tier-gold) 65%, var(--et-white)) 16%, var(--et-tier-gold) 32%, color-mix(in srgb, var(--et-tier-gold) 45%, var(--et-canvas)) 55%, color-mix(in srgb, var(--et-tier-gold) 55%, var(--et-white)) 76%, var(--et-canvas) 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, color-mix(in srgb, var(--et-tier-gold) 40%, transparent) 0%, transparent 28%), radial-gradient(circle at 76% 78%, var(--et-shade-30) 0%, transparent 34%), linear-gradient(160deg, color-mix(in srgb, var(--et-tier-gold) 75%, var(--et-canvas)) 0%, color-mix(in srgb, var(--et-tier-gold) 40%, var(--et-canvas)) 55%, var(--et-canvas) 100%)',
    plate:
      'linear-gradient(180deg, color-mix(in srgb, var(--et-tier-gold) 40%, var(--et-white)), color-mix(in srgb, var(--et-tier-gold) 45%, var(--et-canvas)))',
    glow: 'color-mix(in srgb, var(--et-tier-gold) 32%, transparent)',
  },
  SILVER: {
    name: 'SILVER',
    identity: 'Titanium Silver',
    material: 'Titanium, graphite, ice-blue reflection',
    primary: 'var(--et-tier-silver)',
    highlight: '#F8FBFF',
    shadow: '#2F3540',
    accent: '#9ED8FF',
    ink: 'var(--et-text)',
    surface: 'var(--et-surface-2)',
    frame:
      'linear-gradient(145deg, var(--et-white) 0%, color-mix(in srgb, var(--et-tier-silver) 25%, var(--et-white)) 17%, var(--et-tier-silver) 32%, color-mix(in srgb, var(--et-tier-silver) 22%, var(--et-canvas)) 58%, var(--et-info) 78%, var(--et-canvas) 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, var(--et-hi-30) 0%, transparent 28%), radial-gradient(circle at 76% 78%, color-mix(in srgb, var(--et-info) 18%, transparent) 0%, transparent 34%), linear-gradient(160deg, color-mix(in srgb, var(--et-tier-silver) 45%, var(--et-canvas)) 0%, color-mix(in srgb, var(--et-tier-silver) 22%, var(--et-canvas)) 52%, var(--et-canvas) 100%)',
    plate:
      'linear-gradient(180deg, color-mix(in srgb, var(--et-tier-silver) 30%, var(--et-canvas)), var(--et-canvas))',
    glow: 'color-mix(in srgb, var(--et-info) 26%, transparent)',
  },
  BRONZE: {
    name: 'BRONZE',
    identity: 'Smoked Bronze',
    material: 'Copper, ember bronze, charcoal shadow',
    primary: 'var(--et-tier-bronze)',
    highlight: '#F1B37D',
    shadow: '#1E0E07',
    accent: '#E0793B',
    ink: 'var(--et-text)',
    surface: 'var(--et-surface-2)',
    frame:
      'linear-gradient(145deg, color-mix(in srgb, var(--et-tier-bronze) 25%, var(--et-white)) 0%, color-mix(in srgb, var(--et-tier-bronze) 75%, var(--et-white)) 16%, var(--et-tier-bronze) 34%, color-mix(in srgb, var(--et-tier-bronze) 28%, var(--et-canvas)) 58%, color-mix(in srgb, var(--et-tier-bronze) 45%, var(--et-white)) 78%, var(--et-canvas) 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, color-mix(in srgb, var(--et-tier-bronze) 32%, transparent) 0%, transparent 28%), radial-gradient(circle at 76% 78%, color-mix(in srgb, var(--et-tier-bronze) 18%, transparent) 0%, transparent 34%), linear-gradient(160deg, color-mix(in srgb, var(--et-tier-bronze) 75%, var(--et-canvas)) 0%, color-mix(in srgb, var(--et-tier-bronze) 35%, var(--et-canvas)) 54%, var(--et-canvas) 100%)',
    plate:
      'linear-gradient(180deg, color-mix(in srgb, var(--et-tier-bronze) 30%, var(--et-canvas)), var(--et-canvas))',
    glow: 'color-mix(in srgb, var(--et-tier-bronze) 26%, transparent)',
  },
};

export function getTierStyle(tier?: Tier | string | null): TierVisualStyle {
  return TIER_STYLES[(tier as Tier) || 'SILVER'] ?? TIER_STYLES.SILVER;
}
