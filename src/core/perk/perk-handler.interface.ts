import type { PerkId, PerkDefinition } from '@/types/perk';
import type { ReactNode } from 'react';

export interface PerkExecutionContext {
  roomId: string;
  auctionId: string;
  actorGuestId: string;
  roundNumber: number;
}

export interface PerkResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface PerkEffectData {
  perkId: PerkId;
  targetPlayerName?: string;
  revealedInfo?: string;
  isActive: boolean;
}

export interface IPerkHandler {
  readonly id: PerkId;
  readonly metadata: PerkDefinition;
  canExecute(ctx: PerkExecutionContext): boolean;
  execute(ctx: PerkExecutionContext): Promise<PerkResult>;
  renderEffectBanner?(effectData: PerkEffectData): ReactNode;
}
