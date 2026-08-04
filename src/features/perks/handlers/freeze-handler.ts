import type { IPerkHandler, PerkExecutionContext, PerkResult } from '@/core/perk/perk-handler.interface';
import { PERK_REGISTRY, type PerkId } from '@/types/perk';

export class FreezePerkHandler implements IPerkHandler {
  readonly id: PerkId = 'FREEZE';
  readonly metadata = PERK_REGISTRY.FREEZE;

  canExecute(ctx: PerkExecutionContext): boolean {
    return ctx.roundNumber >= 1;
  }

  async execute(ctx: PerkExecutionContext): Promise<PerkResult> {
    return {
      success: true,
      message: 'Clock freeze activated! +15 seconds added to decision timer.',
    };
  }
}
