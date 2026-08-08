import type { GameType, IMatchSimulatorStrategy } from '@/core/simulation/simulation.interface';
import { TacticalMatchSimulatorStrategy } from '@/core/simulation/strategies/tactical-match-simulator';

/**
 * Registry of deterministic match simulator strategies.
 *
 * The Universal Score Hub only consumes `MatchSimulationResult`, so new game
 * modes can plug in without touching a single Score Hub UI component.
 */
export class MatchSimulatorRegistry {
  private static instance: MatchSimulatorRegistry;
  private strategies: Map<GameType, IMatchSimulatorStrategy> = new Map();

  private constructor() {
    this.registerStrategy(new TacticalMatchSimulatorStrategy());
  }

  public static getInstance(): MatchSimulatorRegistry {
    if (!MatchSimulatorRegistry.instance) {
      MatchSimulatorRegistry.instance = new MatchSimulatorRegistry();
    }
    return MatchSimulatorRegistry.instance;
  }

  public registerStrategy(strategy: IMatchSimulatorStrategy): void {
    this.strategies.set(strategy.gameType, strategy);
  }

  public getStrategy(type: GameType): IMatchSimulatorStrategy {
    return this.strategies.get(type) ?? this.strategies.get('hidden_bid')!;
  }
}

export const matchSimulatorRegistry = MatchSimulatorRegistry.getInstance();
