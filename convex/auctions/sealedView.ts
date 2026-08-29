import { Doc, Id } from '../_generated/dataModel';

/**
 * sealedView.ts — Public DTO helpers for the sealed-bid auction system.
 *
 * Single Responsibility: strip secret bid amounts from auction documents before
 * they reach the client.  Every query that returns an auction doc MUST use
 * `toPublicAuction` so DevTools / custom clients cannot read the opponent's
 * sealed number.
 */

// ── Type guards ────────────────────────────────────────────────

/** True when the auction is using the sealed Hidden Bid flow (has a seed). */
export function isSealedBidMode(auction: Doc<'auctions'>): boolean {
  return auction.seed != null;
}

/** True when `userId` is one of the two auction participants. */
export function isAuctionParticipant(auction: Doc<'auctions'>, userId: Id<'guestUsers'>): boolean {
  return auction.host.userId === userId || auction.guest?.userId === userId;
}

// ── Public DTO ─────────────────────────────────────────────────

/**
 * Strips secret `amount` fields from `sealedBids` so the client only sees
 * `{ locked: true, timestamp }` per side.  Resolved round history is fine to
 * expose — those amounts are already public once the round is done.
 *
 * The return type is a shallow copy of the auction with `sealedBids` replaced.
 */
export function toPublicAuction(auction: Doc<'auctions'>) {
  const raw = auction.sealedBids;

  const redactedSealedBids = raw
    ? {
        host: raw.host ? { locked: true as const, timestamp: raw.host.submittedAt } : undefined,
        guest: raw.guest ? { locked: true as const, timestamp: raw.guest.submittedAt } : undefined,
      }
    : undefined;

  const isCompleted = auction.status === 'completed';
  const curRound = auction.currentRound;

  // Sanitize rounds: protect against DevTools cheating by hiding unrevealed sub-players and future stars
  const sanitizedRounds = (auction.rounds ?? []).map((r) => {
    if (isCompleted || r.roundNumber < curRound) {
      return r;
    }
    if (r.roundNumber === curRound) {
      return {
        ...r,
        // Secret sub-card is stripped; only revealed in query getState if SPY perk was used
        subPlayerId: undefined as unknown as Id<'players'>,
      };
    }
    // Future rounds: only expose position and roundNumber
    return {
      ...r,
      mainPlayerId: undefined as unknown as Id<'players'>,
      subPlayerId: undefined as unknown as Id<'players'>,
    };
  });

  return {
    ...auction,
    rounds: sanitizedRounds,
    sealedBids: redactedSealedBids,
  };
}
