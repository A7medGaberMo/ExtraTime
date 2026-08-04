import type { IPerkHandler, PerkExecutionContext, PerkResult, PerkEffectData } from '@/core/perk/perk-handler.interface';
import { PERK_REGISTRY, type PerkId } from '@/types/perk';

export class ScoutPerkHandler implements IPerkHandler {
  readonly id: PerkId = 'SCOUT';
  readonly metadata = PERK_REGISTRY.SCOUT;

  canExecute(ctx: PerkExecutionContext): boolean {
    return ctx.roundNumber >= 1;
  }

  async execute(ctx: PerkExecutionContext): Promise<PerkResult> {
    if (!this.canExecute(ctx)) {
      return { success: false, message: 'Scout cannot be activated for this round.' };
    }
    return {
      success: true,
      message: 'Scout intelligence activated! Revealing next round main player target.',
    };
  }
}
