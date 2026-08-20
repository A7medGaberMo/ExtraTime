import { type Position } from '../lib/constants';

export type MatchSize = 5 | 11;

const FORMATIONS_11: Record<string, Position[][]> = {
  '4-3-3': [
    ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'RW', 'LW', 'ST'],
    ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CAM', 'RW', 'LW', 'ST'],
    ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'LW', 'ST'],
  ],
  '4-4-2': [['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST']],
  '4-2-3-1': [['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CDM', 'CAM', 'RW', 'LW', 'ST']],
  '3-5-2': [['GK', 'CB', 'CB', 'CB', 'LM', 'RM', 'CDM', 'CM', 'CM', 'ST', 'CF']],
};

const FORMATIONS_5: Record<string, Position[][]> = {
  '1-2-1': [['GK', 'CB', 'CM', 'CAM', 'ST']],
  '2-1-1': [['GK', 'CB', 'CB', 'CM', 'ST']],
  '1-1-2': [['GK', 'CB', 'CM', 'ST', 'CF']],
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getRandomFormation(matchSize: MatchSize): string {
  return pick(Object.keys(matchSize === 5 ? FORMATIONS_5 : FORMATIONS_11));
}

export function getFormationPositions(formation: string, matchSize: MatchSize): Position[] {
  const registry = matchSize === 5 ? FORMATIONS_5 : FORMATIONS_11;
  const variants = registry[formation] || registry[matchSize === 5 ? '1-2-1' : '4-3-3'];
  return pick(variants);
}
