import type { Tier, Position, PositionCategory } from '@/types/player';
import type { GameType } from '@/types/game';
import type { RoomStatus } from '@/types/room';

export const APP_NAME = 'ExtraTime';
export const APP_DESCRIPTION = 'The premier football strategy and draft arena';

/** Room code length */
export const ROOM_CODE_LENGTH = 6;

/** Nickname constraints */
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 24;

// ---------------------------------------------------------------------------
// Tier configuration — display properties only, no numerical ratings
// ---------------------------------------------------------------------------
export const TIER_CONFIG: Record<
  Tier,
  { label: string; color: string; gradient: [string, string] }
> = {
  ICON: {
    label: 'Icon',
    color: 'var(--et-tier-icon)',
    gradient: ['var(--et-white)', 'var(--et-tier-icon)'],
  },
  HERO: {
    label: 'Hero',
    color: 'var(--et-tier-hero)',
    gradient: [
      'var(--et-tier-hero)',
      'color-mix(in srgb, var(--et-tier-hero) 70%, var(--et-canvas))',
    ],
  },
  ULTIMATE: {
    label: 'Ultimate',
    color: 'var(--et-tier-ultimate)',
    gradient: [
      'var(--et-tier-ultimate)',
      'color-mix(in srgb, var(--et-tier-ultimate) 70%, var(--et-canvas))',
    ],
  },
  MASTER: {
    label: 'Master',
    color: 'var(--et-tier-master)',
    gradient: [
      'var(--et-tier-master)',
      'color-mix(in srgb, var(--et-tier-master) 70%, var(--et-canvas))',
    ],
  },
  ELITE: {
    label: 'Elite',
    color: 'var(--et-tier-elite)',
    gradient: [
      'var(--et-tier-elite)',
      'color-mix(in srgb, var(--et-tier-elite) 70%, var(--et-canvas))',
    ],
  },
  GOLD: {
    label: 'Gold',
    color: 'var(--et-tier-gold)',
    gradient: [
      'var(--et-tier-gold)',
      'color-mix(in srgb, var(--et-tier-gold) 70%, var(--et-canvas))',
    ],
  },
  SILVER: {
    label: 'Silver',
    color: 'var(--et-tier-silver)',
    gradient: [
      'var(--et-tier-silver)',
      'color-mix(in srgb, var(--et-tier-silver) 70%, var(--et-canvas))',
    ],
  },
  BRONZE: {
    label: 'Bronze',
    color: 'var(--et-tier-bronze)',
    gradient: [
      'var(--et-tier-bronze)',
      'color-mix(in srgb, var(--et-tier-bronze) 70%, var(--et-canvas))',
    ],
  },
};

/** Ordered tiers from highest to lowest */
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

// ---------------------------------------------------------------------------
// Position configuration
// ---------------------------------------------------------------------------
export const POSITION_CONFIG: Record<
  Position,
  { label: string; shortLabel: string; category: PositionCategory }
> = {
  GK: { label: 'Goalkeeper', shortLabel: 'GK', category: 'defense' },
  CB: { label: 'Center Back', shortLabel: 'CB', category: 'defense' },
  LB: { label: 'Left Back', shortLabel: 'LB', category: 'defense' },
  RB: { label: 'Right Back', shortLabel: 'RB', category: 'defense' },
  CDM: { label: 'Defensive Midfielder', shortLabel: 'CDM', category: 'midfield' },
  CM: { label: 'Central Midfielder', shortLabel: 'CM', category: 'midfield' },
  CAM: { label: 'Attacking Midfielder', shortLabel: 'CAM', category: 'midfield' },
  LM: { label: 'Left Midfielder', shortLabel: 'LM', category: 'midfield' },
  RM: { label: 'Right Midfielder', shortLabel: 'RM', category: 'midfield' },
  LW: { label: 'Left Winger', shortLabel: 'LW', category: 'attack' },
  RW: { label: 'Right Winger', shortLabel: 'RW', category: 'attack' },
  ST: { label: 'Striker', shortLabel: 'ST', category: 'attack' },
  CF: { label: 'Center Forward', shortLabel: 'CF', category: 'attack' },
};

// ---------------------------------------------------------------------------
// Game type configuration
// ---------------------------------------------------------------------------
export const GAME_TYPE_CONFIG: Record<
  GameType,
  { label: string; description: string; icon: string }
> = {
  hidden_bid: {
    label: 'Snipe',
    description: 'Outbid your opponent in a secret bid auction to build the ultimate squad.',
    icon: '🎯',
  },
  penalty_shootout: {
    label: 'Penalty Shootout',
    description: 'High-stakes penalty kicks to decide the winner.',
    icon: '⚽',
  },
  classic_draft: {
    label: 'Extra Draft',
    description: '14-pick tactical draft duel. Formations, chemistry links, and live match showdown.',
    icon: '⚡',
  },
  bank_it: {
    label: 'Bank It',
    description: 'Double your points streak or bank it before one wrong answer wipes it out.',
    icon: '🏦',
  },
};

// ---------------------------------------------------------------------------
// Room status display
// ---------------------------------------------------------------------------
export const ROOM_STATUS_CONFIG: Record<RoomStatus, { label: string; color: string }> = {
  waiting: { label: 'Waiting', color: 'text-game-accent' },
  ready: { label: 'Ready', color: 'text-info' },
  in_progress: { label: 'In Progress', color: 'text-warning' },
  completed: { label: 'Completed', color: 'text-muted' },
  abandoned: { label: 'Abandoned', color: 'text-danger' },
};
