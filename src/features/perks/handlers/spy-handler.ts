import type { IPerkHandler, PerkExecutionContext, PerkResult } from '@/core/perk/perk-handler.interface';
import { PERK_REGISTRY, type PerkId } from '@/types/perk';

export class SpyPerkHandler implements IPerkHandler {
  readonly id: PerkId = 'SPY';
  readonly metadata = PERK_REGISTRY.SPY;

  canExecute(ctx: PerkExecutionContext): boolean {
    return ctx.roundNumber >= 1;
  }

  async execute(ctx: PerkExecutionContext): Promise<PerkResult> {
    if (!this.canExecute(ctx)) {
      return { success: false, message: 'Spy cannot be activated for this round.' };
    }
    return {
      success: true,
      message: 'Rival spy deployed! Secret sub-player revealed for this round.',
    };
  }
}
