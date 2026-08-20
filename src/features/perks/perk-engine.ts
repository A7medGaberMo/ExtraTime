import type {
  IPerkHandler,
  PerkExecutionContext,
  PerkResult,
} from '@/core/perk/perk-handler.interface';
import type { PerkId } from '@/types/perk';
import { ScoutPerkHandler } from './handlers/scout-handler';
import { SpyPerkHandler } from './handlers/spy-handler';
import { FreezePerkHandler } from './handlers/freeze-handler';
import { ShieldPerkHandler } from './handlers/shield-handler';

export class PerkEngine {
  private static instance: PerkEngine;
  private handlers: Map<PerkId, IPerkHandler> = new Map();

  private constructor() {
    this.registerHandler(new ScoutPerkHandler());
    this.registerHandler(new SpyPerkHandler());
    this.registerHandler(new FreezePerkHandler());
    this.registerHandler(new ShieldPerkHandler());
  }

  public static getInstance(): PerkEngine {
    if (!PerkEngine.instance) {
      PerkEngine.instance = new PerkEngine();
    }
    return PerkEngine.instance;
  }

  public registerHandler(handler: IPerkHandler): void {
    this.handlers.set(handler.id, handler);
  }

  public getHandler(id: PerkId): IPerkHandler | undefined {
    return this.handlers.get(id);
  }

  public async executePerk(id: PerkId, ctx: PerkExecutionContext): Promise<PerkResult> {
    const handler = this.getHandler(id);
    if (!handler) {
      return { success: false, message: `Unknown perk strategy: ${id}` };
    }
    return await handler.execute(ctx);
  }
}

export const perkEngine = PerkEngine.getInstance();
