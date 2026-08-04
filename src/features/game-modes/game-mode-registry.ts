import type { IGameEngineStrategy } from '@/core/engine/game-engine.interface';
import type { GameType } from '@/types/game';
import { HiddenBidEngine } from './strategies/hidden-bid-engine';

export class GameModeRegistry {
  private static instance: GameModeRegistry;
  private strategies: Map<GameType, IGameEngineStrategy> = new Map();

  private constructor() {
    this.registerStrategy(new HiddenBidEngine());
  }

  public static getInstance(): GameModeRegistry {
    if (!GameModeRegistry.instance) {
      GameModeRegistry.instance = new GameModeRegistry();
    }
    return GameModeRegistry.instance;
  }

  public registerStrategy(strategy: IGameEngineStrategy): void {
    this.strategies.set(strategy.type, strategy);
  }

  public getStrategy(type: GameType): IGameEngineStrategy {
    const strategy = this.strategies.get(type);
    if (!strategy) {
      // Fallback to default hidden bid engine
      return this.strategies.get('hidden_bid')!;
    }
    return strategy;
  }
}

export const gameModeRegistry = GameModeRegistry.getInstance();
