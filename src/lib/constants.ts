import type { Tier, Position, PositionCategory } from '@/types/player';
import type { GameType } from '@/types/game';
import type { RoomStatus } from '@/types/room';

export const APP_NAME = 'ExtraTime';
export const APP_DESCRIPTION = 'The premium football gaming platform';

/** Room code length */
export const ROOM_CODE_LENGTH = 6;

/** Nickname constraints */
export const NICKNAME_MIN_LENGTH = 2;
export const NICKNAME_MAX_LENGTH = 16;

// ---------------------------------------------------------------------------
// Tier configuration — display properties only, no numerical ratings
// ---------------------------------------------------------------------------
export const TIER_CONFIG: Record<Tier, { label: string; color: string; gradient: [string, string] }> = {
  ICON: { label: 'Icon', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
  MASTER: { label: 'Master', color: '#A855F7', gradient: ['#A855F7', '#7C3AED'] },
  ELITE_PLUS: { label: 'Elite+', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] },
  ELITE: { label: 'Elite', color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
  GOLD: { label: 'Gold', color: '#EAB308', gradient: ['#EAB308', '#CA8A04'] },
  SILVER: { label: 'Silver', color: '#94A3B8', gradient: ['#94A3B8', '#64748B'] },
  BRONZE: { label: 'Bronze', color: '#CD7F32', gradient: ['#CD7F32', '#A0522D'] },
};

/** Ordered tiers from highest to lowest */
export const TIER_ORDER: Tier[] = ['ICON', 'MASTER', 'ELITE_PLUS', 'ELITE', 'GOLD', 'SILVER', 'BRONZE'];

// ---------------------------------------------------------------------------
// Position configuration
// ---------------------------------------------------------------------------
export const POSITION_CONFIG: Record<Position, { label: string; shortLabel: string; category: PositionCategory }> = {
  GK: { label: 'Goalkeeper', shortLabel: 'GK', category: 'defense' },
  CB: { label: 'Center Back', shortLabel: 'CB', category: 'defense' },
  LB: { label: 'Left Back', shortLabel: 'LB', category: 'defense' },
  RB: { label: 'Right Back', shortLabel: 'RB', category: 'defense' },
  CDM: { label: 'Defensive Midfielder', shortLabel: 'CDM', category: 'midfield' },
  CM: { label: 'Central Midfielder', shortLabel: 'CM', category: 'midfield' },
  CAM: { label: 'Attacking Midfielder', shortLabel: 'CAM', category: 'midfield' },
  LW: { label: 'Left Winger', shortLabel: 'LW', category: 'attack' },
  RW: { label: 'Right Winger', shortLabel: 'RW', category: 'attack' },
  ST: { label: 'Striker', shortLabel: 'ST', category: 'attack' },
  CF: { label: 'Center Forward', shortLabel: 'CF', category: 'attack' },
};

// ---------------------------------------------------------------------------
// Game type configuration
// ---------------------------------------------------------------------------
export const GAME_TYPE_CONFIG: Record<GameType, { label: string; description: string; icon: string }> = {
  hidden_bid: {
    label: 'Hidden Bid',
    description: 'Outbid your opponent in a blind auction to build the ultimate squad.',
    icon: '🏆',
  },
  squad_draft: {
    label: 'Squad Draft',
    description: 'Select players sequentially to form your tactical squad.',
    icon: '📋',
  },
  pack_opening_duel: {
    label: 'Pack Duel',
    description: 'Open packs simultaneously and battle with your drawn players.',
    icon: '📦',
  },
  penalty_shootout: {
    label: 'Penalty Shootout',
    description: 'High-stakes penalty kicks to decide the winner.',
    icon: '⚽',
  },
};

// ---------------------------------------------------------------------------
// Room status display
// ---------------------------------------------------------------------------
export const ROOM_STATUS_CONFIG: Record<RoomStatus, { label: string; color: string }> = {
  waiting: { label: 'Waiting', color: 'text-primary' },
  ready: { label: 'Ready', color: 'text-blue-400' },
  in_progress: { label: 'In Progress', color: 'text-amber-400' },
  completed: { label: 'Completed', color: 'text-slate-400' },
  abandoned: { label: 'Abandoned', color: 'text-red-400' },
};
