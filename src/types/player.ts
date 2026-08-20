/** Player tier classification — no numerical ratings exposed in UI */
export type Tier = 'ICON' | 'HERO' | 'ULTIMATE' | 'MASTER' | 'ELITE' | 'GOLD' | 'SILVER' | 'BRONZE';

/** Specific football positions */
export type Position =
  'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST' | 'CF';

export type PlayerPosition = Position | `${Position}/${Position}` | string;

/** Position category for grouping */
export type PositionCategory = 'defense' | 'midfield' | 'attack';

/** UI representation of a player card — no ratings, only tier */
export interface PlayerCardData {
  id: string;
  name: string;
  tier: Tier;
  position: PlayerPosition;
  club: string;
  nation: string;
  imageUrl?: string;
  isLegend?: boolean;
  kitNumber?: number;
}
