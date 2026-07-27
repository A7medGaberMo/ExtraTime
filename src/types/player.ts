/** Player tier classification — no numerical ratings exposed in UI */
export type Tier = 'ICON' | 'MASTER' | 'ELITE_PLUS' | 'ELITE' | 'GOLD' | 'SILVER' | 'BRONZE';

/** Specific football positions */
export type Position =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'LW'
  | 'RW'
  | 'ST'
  | 'CF';

/** Position category for grouping */
export type PositionCategory = 'defense' | 'midfield' | 'attack';

/** UI representation of a player card — no ratings, only tier */
export interface PlayerCardData {
  id: string;
  name: string;
  tier: Tier;
  position: Position;
  club: string;
  nation: string;
  imageUrl?: string;
  isLegend?: boolean;
  kitNumber?: number;
}
