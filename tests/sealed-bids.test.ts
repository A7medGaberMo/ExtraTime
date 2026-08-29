import { describe, it, expect } from 'vitest';
import { hashSeed, mulberry32 } from '../src/core/simulation/match-simulator';
import { Doc, Id } from '../convex/_generated/dataModel';

interface SquadSlot {
  roundNumber: number;
  position: string;
  playerId: string;
  isSub: boolean;
  cost: number;
}

interface ManagerState {
  userId: string;
  budget: number;
  squad: SquadSlot[];
}

interface RoundData {
  roundNumber: number;
  position: string;
  mainPlayerId: string;
  subPlayerId: string;
}

/**
 * Pure simulation function matching convex/auctions/sealed.ts logic.
 */
function resolveSealedRoundPure(params: {
  round: RoundData;
  host: ManagerState;
  guest: ManagerState;
  hostBid: number;
  guestBid: number;
  roomId: string;
  seed?: string;
}) {
  const { round, hostBid, guestBid, roomId, seed } = params;
  const host: ManagerState = { ...params.host, squad: [...params.host.squad] };
  const guest: ManagerState = { ...params.guest, squad: [...params.guest.squad] };

  const starterIsHost = round.roundNumber % 2 !== 0;

  let winnerUserId: string;
  let winningPrice = 0;
  let wasTieLottery = false;

  if (hostBid === 0 && guestBid === 0) {
    winnerUserId = starterIsHost ? host.userId : guest.userId;
    winningPrice = 0;
  } else if (hostBid > guestBid) {
    winnerUserId = host.userId;
    winningPrice = hostBid;
  } else if (guestBid > hostBid) {
    winnerUserId = guest.userId;
    winningPrice = guestBid;
  } else {
    // Equal positive bids
    const lotRng = mulberry32(hashSeed(`${seed ?? roomId}:${round.roundNumber}:lottery`));
    winnerUserId = lotRng() < 0.5 ? host.userId : guest.userId;
    winningPrice = hostBid;
    wasTieLottery = true;
  }

  if (winnerUserId === host.userId) {
    host.budget -= winningPrice;
    host.squad.push({
      roundNumber: round.roundNumber,
      position: round.position,
      playerId: round.mainPlayerId,
      isSub: false,
      cost: winningPrice,
    });

    const guestCost = guestBid;
    guest.budget -= guestCost;
    guest.squad.push({
      roundNumber: round.roundNumber,
      position: round.position,
      playerId: round.subPlayerId,
      isSub: true,
      cost: guestCost,
    });
  } else {
    guest.budget -= winningPrice;
    guest.squad.push({
      roundNumber: round.roundNumber,
      position: round.position,
      playerId: round.mainPlayerId,
      isSub: false,
      cost: winningPrice,
    });

    const hostCost = hostBid;
    host.budget -= hostCost;
    host.squad.push({
      roundNumber: round.roundNumber,
      position: round.position,
      playerId: round.subPlayerId,
      isSub: true,
      cost: hostCost,
    });
  }

  return {
    winnerUserId,
    winningPrice,
    wasTieLottery,
    host,
    guest,
  };
}

describe('Sealed Bid Resolver & Budget Fair Rules', () => {
  const round: RoundData = {
    roundNumber: 1,
    position: 'ST',
    mainPlayerId: 'p_cr7',
    subPlayerId: 'p_morata',
  };

  it('charges winner $35M for Main and loser $30M for Hidden on 35 vs 30 bids', () => {
    const host: ManagerState = { userId: 'u_host', budget: 100, squad: [] };
    const guest: ManagerState = { userId: 'u_guest', budget: 100, squad: [] };

    const result = resolveSealedRoundPure({
      round,
      host,
      guest,
      hostBid: 35,
      guestBid: 30,
      roomId: 'room_123',
    });

    expect(result.winnerUserId).toBe('u_host');
    expect(result.winningPrice).toBe(35);
    expect(result.wasTieLottery).toBe(false);

    // Host checks
    expect(result.host.budget).toBe(65);
    expect(result.host.squad).toHaveLength(1);
    expect(result.host.squad[0]).toEqual({
      roundNumber: 1,
      position: 'ST',
      playerId: 'p_cr7',
      isSub: false,
      cost: 35,
    });

    // Guest checks (received backup for their submitted bid)
    expect(result.guest.budget).toBe(70);
    expect(result.guest.squad).toHaveLength(1);
    expect(result.guest.squad[0]).toEqual({
      roundNumber: 1,
      position: 'ST',
      playerId: 'p_morata',
      isSub: true,
      cost: 30,
    });
  });

  it('mirrors correctly on 30 vs 35 bids', () => {
    const host: ManagerState = { userId: 'u_host', budget: 100, squad: [] };
    const guest: ManagerState = { userId: 'u_guest', budget: 100, squad: [] };

    const result = resolveSealedRoundPure({
      round,
      host,
      guest,
      hostBid: 30,
      guestBid: 35,
      roomId: 'room_123',
    });

    expect(result.winnerUserId).toBe('u_guest');
    expect(result.winningPrice).toBe(35);
    expect(result.guest.budget).toBe(65);
    expect(result.guest.squad[0].isSub).toBe(false);
    expect(result.guest.squad[0].cost).toBe(35);

    expect(result.host.budget).toBe(70);
    expect(result.host.squad[0].isSub).toBe(true);
    expect(result.host.squad[0].cost).toBe(30);
  });

  it('assigns backup player for $0M when loser bid is $0M', () => {
    const host: ManagerState = { userId: 'u_host', budget: 100, squad: [] };
    const guest: ManagerState = { userId: 'u_guest', budget: 100, squad: [] };

    const result = resolveSealedRoundPure({
      round,
      host,
      guest,
      hostBid: 35,
      guestBid: 0,
      roomId: 'room_123',
    });

    expect(result.winnerUserId).toBe('u_host');
    expect(result.host.budget).toBe(65);
    expect(result.guest.budget).toBe(100);
    expect(result.guest.squad[0].cost).toBe(0);
    expect(result.guest.squad[0].isSub).toBe(true);
  });

  it('handles dual $0M bids by awarding Main to round starter at $0M and backup to rival at $0M', () => {
    const host: ManagerState = { userId: 'u_host', budget: 100, squad: [] };
    const guest: ManagerState = { userId: 'u_guest', budget: 100, squad: [] };

    // Round 1 -> host starts
    const r1 = resolveSealedRoundPure({
      round: { ...round, roundNumber: 1 },
      host,
      guest,
      hostBid: 0,
      guestBid: 0,
      roomId: 'room_123',
    });

    expect(r1.winnerUserId).toBe('u_host');
    expect(r1.host.budget).toBe(100);
    expect(r1.host.squad[0].playerId).toBe('p_cr7');
    expect(r1.host.squad[0].cost).toBe(0);
    expect(r1.guest.budget).toBe(100);
    expect(r1.guest.squad[0].playerId).toBe('p_morata');
    expect(r1.guest.squad[0].cost).toBe(0);

    // Round 2 -> guest starts
    const r2 = resolveSealedRoundPure({
      round: { ...round, roundNumber: 2 },
      host,
      guest,
      hostBid: 0,
      guestBid: 0,
      roomId: 'room_123',
    });

    expect(r2.winnerUserId).toBe('u_guest');
    expect(r2.guest.squad[0].playerId).toBe('p_cr7');
    expect(r2.host.squad[0].playerId).toBe('p_morata');
  });

  it('resolves equal positive bids with deterministic room-seed lottery where both pay committed bid', () => {
    const host: ManagerState = { userId: 'u_host', budget: 100, squad: [] };
    const guest: ManagerState = { userId: 'u_guest', budget: 100, squad: [] };

    const result = resolveSealedRoundPure({
      round,
      host,
      guest,
      hostBid: 25,
      guestBid: 25,
      roomId: 'room_seed_abc',
    });

    expect(result.wasTieLottery).toBe(true);
    expect(result.winningPrice).toBe(25);
    expect(result.host.budget).toBe(75);
    expect(result.guest.budget).toBe(75);
    expect(result.host.squad[0].cost).toBe(25);
    expect(result.guest.squad[0].cost).toBe(25);
    // One got main, one got sub
    const mainSlot = [result.host.squad[0], result.guest.squad[0]].find((s) => !s.isSub);
    const subSlot = [result.host.squad[0], result.guest.squad[0]].find((s) => s.isSub);
    expect(mainSlot?.playerId).toBe('p_cr7');
    expect(subSlot?.playerId).toBe('p_morata');
  });

  it('guarantees budgets never drop below zero when bids are <= current budget', () => {
    const host: ManagerState = { userId: 'u_host', budget: 15, squad: [] };
    const guest: ManagerState = { userId: 'u_guest', budget: 20, squad: [] };

    const result = resolveSealedRoundPure({
      round,
      host,
      guest,
      hostBid: 15,
      guestBid: 20,
      roomId: 'room_123',
    });

    expect(result.host.budget).toBe(0);
    expect(result.guest.budget).toBe(0);
    expect(result.host.budget).toBeGreaterThanOrEqual(0);
    expect(result.guest.budget).toBeGreaterThanOrEqual(0);
  });

  it('redacts unrevealed sub-players and future round main players in toPublicAuction', async () => {
    const { toPublicAuction } = await import('../convex/auctions/sealedView');
    const mockAuction: Doc<'auctions'> = {
      _id: 'auc_1' as Id<'auctions'>,
      _creationTime: 12345,
      roomId: 'room_1' as Id<'rooms'>,
      formation: '4-3-3',
      matchSize: 11,
      startingBudget: 100,
      poolMode: 'GLOBAL',
      currentRound: 2,
      status: 'active',
      currentBidding: {
        highestBid: 0,
        turnExpiresAt: 12345,
      },
      host: {
        userId: 'u_1' as Id<'guestUsers'>,
        budget: 100,
        perk: 'SCOUT',
        perkUsed: false,
        squad: [],
      },
      guest: {
        userId: 'u_2' as Id<'guestUsers'>,
        budget: 100,
        perk: 'SPY',
        perkUsed: false,
        squad: [],
      },
      sealedBids: {
        host: { amount: 30, submittedAt: 100 },
        guest: { amount: 25, submittedAt: 105 },
      },
      rounds: [
        { roundNumber: 1, position: 'GK', mainPlayerId: 'p_gk' as Id<'players'>, subPlayerId: 'p_gk_sub' as Id<'players'> },
        { roundNumber: 2, position: 'CB', mainPlayerId: 'p_cb' as Id<'players'>, subPlayerId: 'p_cb_sub' as Id<'players'> },
        { roundNumber: 3, position: 'ST', mainPlayerId: 'p_st' as Id<'players'>, subPlayerId: 'p_st_sub' as Id<'players'> },
      ],
      createdAt: 100,
    };

    const publicView = toPublicAuction(mockAuction);

    // Sealed bids are redacted to boolean locked flags (amounts stripped)
    expect(publicView.sealedBids?.host?.locked).toBe(true);
    expect(publicView.sealedBids?.host?.timestamp).toBe(100);

    // Round 1 (completed/past): remains unredacted
    expect(publicView.rounds[0].mainPlayerId).toBe('p_gk');
    expect(publicView.rounds[0].subPlayerId).toBe('p_gk_sub');

    // Round 2 (current active round): mainPlayerId is visible, subPlayerId is stripped!
    expect(publicView.rounds[1].mainPlayerId).toBe('p_cb');
    expect(publicView.rounds[1].subPlayerId).toBeUndefined();

    // Round 3 (future round): both mainPlayerId and subPlayerId are stripped!
    expect(publicView.rounds[2].position).toBe('ST');
    expect(publicView.rounds[2].mainPlayerId).toBeUndefined();
    expect(publicView.rounds[2].subPlayerId).toBeUndefined();
  });
});
