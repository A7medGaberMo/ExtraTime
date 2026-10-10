import type { Icon } from '@phosphor-icons/react';
import { Crosshair, Ranking, Lightning, Vault } from '@phosphor-icons/react';

/**
 * Single source of truth for every game mode.
 *
 * This registry intentionally contains NO colors. Theming lives entirely in
 * src/styles/theme.css where [data-game="..."] blocks define per-game tokens.
 * Home cards, the header channels, hub pages and routers must read from here.
 */
export type GameId = 'snipe' | 'rank' | 'draft' | 'bank';

export interface GameDefinition {
  id: GameId;
  /** Primary hub/destination for the game. */
  href: string;
  /** Where a manager creates a room for this game. */
  createHref: string;
  /** Where a manager joins with a code for this game. */
  joinHref: string;
  /** Phosphor icon used on Home cards, header channels and rails. */
  icon: Icon;
  /** i18n key for the display title (en + ar dictionaries). */
  titleKey: string;
  /** i18n key for the one-line tagline (en + ar dictionaries). */
  taglineKey: string;
  /** Whether this game appears as a card on the Home screen. */
  showOnHome: boolean;
}

export const GAMES: Record<GameId, GameDefinition> = {
  snipe: {
    id: 'snipe',
    href: '/snipe',
    createHref: '/create-room?mode=snipe',
    joinHref: '/join-room',
    icon: Crosshair,
    titleKey: 'game.snipe.title',
    taglineKey: 'game.snipe.tagline',
    showOnHome: true,
  },
  rank: {
    id: 'rank',
    href: '/rank',
    createHref: '/create-room?mode=rank',
    joinHref: '/rank',
    icon: Ranking,
    titleKey: 'game.rank.title',
    taglineKey: 'game.rank.tagline',
    showOnHome: true,
  },
  draft: {
    id: 'draft',
    href: '/draft',
    createHref: '/create-room?mode=draft',
    joinHref: '/draft',
    icon: Lightning,
    titleKey: 'game.draft.title',
    taglineKey: 'game.draft.tagline',
    showOnHome: true,
  },
  bank: {
    id: 'bank',
    href: '/bank',
    createHref: '/create-room?mode=bank',
    joinHref: '/bank',
    icon: Vault,
    titleKey: 'game.bank.title',
    taglineKey: 'game.bank.tagline',
    showOnHome: true,
  },
};

/** Ordered list of games shown on Home (registry order). */
export const HOME_GAMES: GameDefinition[] = Object.values(GAMES).filter((g) => g.showOnHome);

/** All game ids for type-safe iteration. */
export const GAME_IDS = Object.keys(GAMES) as GameId[];

/**
 * Persisted game-type discriminants (rooms / matches records) → themed game id.
 *
 * Dynamic routes whose game is only known from data (e.g. /result/[roomId])
 * must resolve their theme scope through this map rather than defaulting to a
 * game, so a record that is not recognised yields `null` (neutral brand scope)
 * instead of another game's colors.
 */
const GAME_TYPE_TO_ID: Record<string, GameId> = {
  hidden_bid: 'snipe',
  classic_draft: 'draft',
  bank_it: 'bank',
};

/** Resolve a stored game type to its themed game id, or null if unknown. */
export function gameIdForType(gameType: string | null | undefined): GameId | null {
  if (!gameType) return null;
  return GAME_TYPE_TO_ID[gameType] ?? null;
}
