import type {
  IPerkHandler,
  PerkExecutionContext,
  PerkResult,
} from '@/core/perk/perk-handler.interface';
import { PERK_REGISTRY, type PerkId } from '@/types/perk';

export class ShieldPerkHandler implements IPerkHandler {
  readonly id: PerkId = 'SHIELD';
  readonly metadata = PERK_REGISTRY.SHIELD;

  canExecute(ctx: PerkExecutionContext): boolean {
    return ctx.roundNumber >= 1;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(ctx: PerkExecutionContext): Promise<PerkResult> {
    return {
      success: true,
      message: 'Budget Shield deployed! 20% budget protected on outbid.',
    };
  }
}
