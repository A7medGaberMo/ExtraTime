import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { DataModel, Id } from '../_generated/dataModel';
import { GenericMutationCtx } from 'convex/server';
import { verifyGuestSession } from '../lib/auth';
import {
  calculateSquadChemistry,
  ChemistryPlayerInput,
  isPositionCompatible,
} from './chemistry';
import {
  getAvailableFormationOptions,
  getFormationSlots,
  generateCandidatesForSlot,
  getNextNaturalDraftSlot,
} from './generator';
import {
  DraftSimPlayer,
  simulatePureDraftMatch,
} from '../../src/core/simulation/strategies/classic-draft-match-simulator';

const TURN_TIMEOUT_MS = 25000; // 25 seconds shot clock per pick (balanced for tactical review)

function generateDraftRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function generateUniqueDraftCode(ctx: GenericMutationCtx<DataModel>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateDraftRoomCode();
    const existing = await ctx.db
      .query('draftGames')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    if (!existing) return code;
  }
  throw new Error('Could not generate unique room code');
}

async function getGuest(ctx: GenericMutationCtx<DataModel>, guestId: Id<'guestUsers'>) {
  const guest = await ctx.db.get(guestId);
  if (!guest) throw new Error('Guest user not found');
  return guest;
}

/**
 * Builds chemistry input array for starting XI with enriched player/club/nation details
 */
async function buildStartersChemistryInput(
  ctx: GenericMutationCtx<DataModel>,
  startingXI: Array<{ slotIndex: number; position: string; playerId?: Id<'players'>; isCaptain?: boolean }>,
): Promise<ChemistryPlayerInput[]> {
  const result: ChemistryPlayerInput[] = [];

  for (const slot of startingXI) {
    if (!slot.playerId) {
      result.push({
        slotIndex: slot.slotIndex,
        slotPosition: slot.position,
        isCaptain: slot.isCaptain,
      });
      continue;
    }

    const player = await ctx.db.get(slot.playerId);
    if (!player) {
      result.push({
        slotIndex: slot.slotIndex,
        slotPosition: slot.position,
        isCaptain: slot.isCaptain,
      });
      continue;
    }

    const club = await ctx.db.get(player.clubId);
    const nation = await ctx.db.get(player.nationId);

    result.push({
      slotIndex: slot.slotIndex,
      slotPosition: slot.position,
      playerId: String(player._id),
      playerPosition: player.position,
      tier: player.tier,
      rating: player.rating,
      clubId: club ? String(club._id) : undefined,
      clubName: club?.name,
      league: club?.league,
      nationId: nation ? String(nation._id) : undefined,
      nationName: nation?.name,
      isCaptain: slot.isCaptain,
    });
  }

  return result;
}

/**
 * Flexible match helpers for Solo Draft dynamic challenges
 */
function matchesNation(playerNation?: string, targetNation?: string): boolean {
  if (!playerNation || !targetNation) return false;
  const p = playerNation.trim().toLowerCase();
  const t = targetNation.trim().toLowerCase();
  if (p === t || p.includes(t) || t.includes(p)) return true;
  if ((t === 'england' || t === 'uk' || t === 'great britain') && (p === 'england' || p === 'united kingdom' || p === 'uk')) return true;
  if ((t === 'netherlands' || t === 'holland') && (p === 'netherlands' || p === 'holland')) return true;
  return false;
}

function matchesClub(playerClub?: string, targetClub?: string): boolean {
  if (!playerClub || !targetClub) return false;
  const p = playerClub.trim().toLowerCase();
  const t = targetClub.trim().toLowerCase();
  if (p === t || p.includes(t) || t.includes(p)) return true;
  if (t.includes('madrid') && p.includes('madrid')) return true;
  if ((t.includes('barca') || t.includes('barcelona')) && (p.includes('barca') || p.includes('barcelona'))) return true;
  if ((t.includes('manchester city') || t.includes('man city')) && (p.includes('manchester city') || p.includes('man city'))) return true;
  if ((t.includes('manchester utd') || t.includes('manchester united') || t.includes('man utd')) && (p.includes('manchester') || p.includes('united'))) return true;
  if (t.includes('bayern') && p.includes('bayern')) return true;
  if (t.includes('milan') && p.includes('milan')) return true;
  return false;
}

function matchesLeague(playerLeague?: string, targetLeague?: string): boolean {
  if (!playerLeague || !targetLeague) return false;
  const p = playerLeague.trim().toLowerCase();
  const t = targetLeague.trim().toLowerCase();
  if (p === t || p.includes(t) || t.includes(p)) return true;
  if (t.includes('premier') && p.includes('premier')) return true;
  if ((t.includes('la liga') || t.includes('laliga') || t.includes('spain')) && (p.includes('liga') || p.includes('laliga'))) return true;
  if (t.includes('serie a') && p.includes('serie a')) return true;
  if (t.includes('bundesliga') && p.includes('bundesliga')) return true;
  return false;
}

/**
 * Creates an instant Solo Draft session
 */
export const createSoloDraft = mutation({
  args: {
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    challengeType: v.optional(v.string()),
    formation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const guest = await getGuest(ctx, args.guestId);
    const code = await generateUniqueDraftCode(ctx);
    const now = Date.now();

    const formationOptions = getAvailableFormationOptions();
    const chosenFormation = args.formation;

    let startingXI: Array<{
      slotIndex: number;
      position: string;
      playerId?: Id<'players'>;
      isCaptain?: boolean;
      chemistry?: number;
    }> = [];
    let initialCandidateIds: Id<'players'>[] = [];
    let initialStatus: 'formation' | 'drafting' = 'formation';
    let turnExpiresAt: number | undefined = undefined;

    // If user provided a formation (or default), skip formation page and jump directly to drafting!
    if (chosenFormation) {
      const positions = getFormationSlots(chosenFormation);
      startingXI = positions.map((pos, idx) => ({
        slotIndex: idx,
        position: pos,
        playerId: undefined,
        isCaptain: false,
        chemistry: 0,
      }));
      initialCandidateIds = await generateCandidatesForSlot(
        ctx,
        0,
        'CAPTAIN',
        new Set<string>(),
      );
      initialStatus = 'drafting';
      turnExpiresAt = undefined; // Solo mode: relaxed, unhurried tactical drafting
    }

    const gameId = await ctx.db.insert('draftGames', {
      code,
      mode: 'solo',
      challengeType: args.challengeType ?? 'high_chemistry',
      status: initialStatus,
      participants: [
        {
          guestId: args.guestId,
          name: guest.nickname,
          avatarSeed: guest.avatarSeed,
          formation: chosenFormation,
          formationOptions,
          currentSlotIndex: 0,
          currentCandidateIds: initialCandidateIds,
          turnExpiresAt,
          startingXI,
          bench: [
            { benchIndex: 0, playerId: undefined },
            { benchIndex: 1, playerId: undefined },
            { benchIndex: 2, playerId: undefined },
          ],
          squadRating: 0,
          chemistryScore: 0,
          totalDraftScore: 0,
          isReady: false,
        },
      ],
      createdAt: now,
    });

    return { gameId, code };
  },
});

/**
 * Creates a private 1v1 Draft room with a 6-character code
 */
export const createDuelPrivateRoom = mutation({
  args: {
    hostId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.hostId, args.sessionToken);
    const host = await getGuest(ctx, args.hostId);
    const code = await generateUniqueDraftCode(ctx);
    const now = Date.now();

    const gameId = await ctx.db.insert('draftGames', {
      code,
      mode: 'duel_private',
      isPublic: false,
      status: 'waiting',
      participants: [
        {
          guestId: args.hostId,
          name: host.nickname,
          avatarSeed: host.avatarSeed,
          formationOptions: getAvailableFormationOptions(),
          currentSlotIndex: 0,
          currentCandidateIds: [],
          startingXI: [],
          bench: [
            { benchIndex: 0, playerId: undefined },
            { benchIndex: 1, playerId: undefined },
            { benchIndex: 2, playerId: undefined },
          ],
          squadRating: 0,
          chemistryScore: 0,
          totalDraftScore: 0,
          isReady: false,
        },
      ],
      createdAt: now,
    });

    return { gameId, code };
  },
});

/**
 * Joins a private Draft room by code
 */
export const joinDraftByCode = mutation({
  args: {
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const guest = await getGuest(ctx, args.guestId);
    const cleanCode = args.code.trim().toUpperCase();

    const game = await ctx.db
      .query('draftGames')
      .withIndex('by_code', (q) => q.eq('code', cleanCode))
      .first();

    if (!game) throw new Error('Draft room not found. Check the room code.');

    // Rejoining allowed
    if (game.participants.some((p) => p.guestId === args.guestId)) {
      return { gameId: game._id };
    }

    if (game.status !== 'waiting') {
      throw new Error('This draft game has already begun or finished.');
    }
    if (game.participants.length >= 2) {
      throw new Error('This draft room is already full.');
    }

    const updatedParticipants = [
      ...game.participants,
      {
        guestId: args.guestId,
        name: guest.nickname,
        avatarSeed: guest.avatarSeed,
        formationOptions: getAvailableFormationOptions(),
        currentSlotIndex: 0,
        currentCandidateIds: [],
        startingXI: [],
        bench: [
          { benchIndex: 0, playerId: undefined },
          { benchIndex: 1, playerId: undefined },
          { benchIndex: 2, playerId: undefined },
        ],
        squadRating: 0,
        chemistryScore: 0,
        totalDraftScore: 0,
        isReady: false,
      },
    ];

    await ctx.db.patch(game._id, {
      status: 'formation',
      participants: updatedParticipants,
    });

    return { gameId: game._id };
  },
});

/**
 * Quick Match public queue for 1v1 Draft Duels
 */
export const findOrCreatePublicMatch = mutation({
  args: {
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const guest = await getGuest(ctx, args.guestId);
    const now = Date.now();

    const openRooms = await ctx.db
      .query('draftGames')
      .withIndex('by_public_status', (q) =>
        q.eq('isPublic', true).eq('status', 'waiting').eq('mode', 'duel_public'),
      )
      .take(20);

    // If host already has an open queue room, return it
    const existing = openRooms.find((r) => r.participants[0]?.guestId === args.guestId);
    if (existing) {
      return { gameId: existing._id, matched: false };
    }

    // Match with first valid waiting room
    for (const room of openRooms) {
      if (room.createdAt <= now - 3 * 60 * 1000) {
        await ctx.db.patch(room._id, { status: 'completed' });
        continue;
      }

      const updatedParticipants = [
        ...room.participants,
        {
          guestId: args.guestId,
          name: guest.nickname,
          avatarSeed: guest.avatarSeed,
          formationOptions: getAvailableFormationOptions(),
          currentSlotIndex: 0,
          currentCandidateIds: [],
          startingXI: [],
          bench: [
            { benchIndex: 0, playerId: undefined },
            { benchIndex: 1, playerId: undefined },
            { benchIndex: 2, playerId: undefined },
          ],
          squadRating: 0,
          chemistryScore: 0,
          totalDraftScore: 0,
          isReady: false,
        },
      ];

      await ctx.db.patch(room._id, {
        status: 'formation',
        participants: updatedParticipants,
      });

      return { gameId: room._id, matched: true };
    }

    // Otherwise, create new waiting lobby
    const code = await generateUniqueDraftCode(ctx);
    const gameId = await ctx.db.insert('draftGames', {
      code,
      mode: 'duel_public',
      isPublic: true,
      status: 'waiting',
      participants: [
        {
          guestId: args.guestId,
          name: guest.nickname,
          avatarSeed: guest.avatarSeed,
          formationOptions: getAvailableFormationOptions(),
          currentSlotIndex: 0,
          currentCandidateIds: [],
          startingXI: [],
          bench: [
            { benchIndex: 0, playerId: undefined },
            { benchIndex: 1, playerId: undefined },
            { benchIndex: 2, playerId: undefined },
          ],
          squadRating: 0,
          chemistryScore: 0,
          totalDraftScore: 0,
          isReady: false,
        },
      ],
      createdAt: now,
    });

    return { gameId, matched: false };
  },
});

/**
 * Selects formation for participant, sets starting slots, generates Captain candidates
 */
export const selectFormation = mutation({
  args: {
    gameId: v.id('draftGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    formation: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    const pIndex = game.participants.findIndex((p) => p.guestId === args.guestId);
    if (pIndex === -1) throw new Error('Participant not in game');

    const participant = game.participants[pIndex];
    const positions = getFormationSlots(args.formation);

    // Initial 11 formation slots
    const startingXI = positions.map((pos, idx) => ({
      slotIndex: idx,
      position: pos,
      playerId: undefined,
      isCaptain: false,
      chemistry: 0,
    }));

    // Generate 5 Captain candidates (Pick 0)
    const captainCandidates = await generateCandidatesForSlot(
      ctx,
      0,
      'CAPTAIN',
      new Set<string>(),
    );

    const now = Date.now();
    const updatedParticipant = {
      ...participant,
      formation: args.formation,
      currentSlotIndex: 0,
      currentCandidateIds: captainCandidates,
      turnExpiresAt: undefined, // Will be set when drafting begins
      startingXI,
    };

    const newParticipants = [...game.participants];
    newParticipants[pIndex] = updatedParticipant;

    // In 1v1: transition to 'drafting' when both chosen, or in solo: immediate
    const allFormationsChosen = newParticipants.every((p) => Boolean(p.formation));
    const nextStatus = allFormationsChosen ? 'drafting' : game.status;

    // Start 25s turn clocks for PvP participants when entering drafting
    if (nextStatus === 'drafting' && game.mode !== 'solo') {
      for (const p of newParticipants) {
        p.turnExpiresAt = now + TURN_TIMEOUT_MS;
      }
    }

    await ctx.db.patch(game._id, {
      status: nextStatus,
      participants: newParticipants,
    });

    return { success: true };
  },
});

/**
 * Makes a card pick for the active slot
 */
export const makeDraftPick = mutation({
  args: {
    gameId: v.id('draftGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    playerId: v.id('players'),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    const pIndex = game.participants.findIndex((p) => p.guestId === args.guestId);
    if (pIndex === -1) throw new Error('Participant not in game');

    const participant = game.participants[pIndex];
    if (participant.currentSlotIndex >= 14) {
      throw new Error('Drafting phase already completed');
    }

    // Verify player is among candidates (or auto-picked)
    const isValidPick = participant.currentCandidateIds.some((id) => id === args.playerId);
    if (!isValidPick && participant.currentCandidateIds.length > 0) {
      throw new Error('Selected player is not in candidate list');
    }

    return await executePickForParticipant(ctx, game, pIndex, args.playerId);
  },
});

/**
 * Common pick execution logic shared by manual picks and timeout auto-picks
 */
async function executePickForParticipant(
  ctx: GenericMutationCtx<DataModel>,
  game: any,
  pIndex: number,
  playerId: Id<'players'>,
) {
  const participant = game.participants[pIndex];
  const currentSlot = participant.currentSlotIndex;
  const updatedStarters = participant.startingXI.map((s: any) => ({ ...s }));
  const updatedBench = participant.bench.map((b: any) => ({ ...b }));

  if (currentSlot === 0) {
    // Pick 0: Captain Superstar Pick
    const pickedDoc = await ctx.db.get(playerId);
    const matchingSlot =
      updatedStarters.find(
        (s: any) => !s.playerId && isPositionCompatible(s.position, pickedDoc?.position),
      ) ?? updatedStarters.find((s: any) => !s.playerId);

    if (matchingSlot) {
      matchingSlot.playerId = playerId;
      matchingSlot.isCaptain = true;
    }
  } else if (currentSlot >= 1 && currentSlot <= 10) {
    // Picks 1..10: Fill the next natural unfilled slot (moves from GK forward!)
    const targetSlot = getNextNaturalDraftSlot(updatedStarters);
    if (targetSlot) {
      targetSlot.playerId = playerId;
    }
  } else if (currentSlot >= 11 && currentSlot <= 13) {
    // Picks 11..13: Super-Subs fill bench 0..2
    const benchIdx = currentSlot - 11;
    updatedBench[benchIdx] = {
      benchIndex: benchIdx,
      playerId,
    };
  }

  // Calculate chemistry & rating
  const startersChemInput = await buildStartersChemistryInput(ctx, updatedStarters);
  const chemResult = calculateSquadChemistry(startersChemInput);

  // Apply chemistry pips to startingXI slots
  for (const slot of updatedStarters) {
    slot.chemistry = chemResult.slotChemistry.get(slot.slotIndex) ?? 0;
  }

  // Advance slot index
  const nextSlotIndex = currentSlot + 1;
  const now = Date.now();

  let nextCandidates: Id<'players'>[] = [];
  let nextExpiresAt: number | undefined = undefined;

  // If more picks remain (up to 13)
  if (nextSlotIndex < 14) {
    const usedPlayerIds = new Set<string>();
    for (const s of updatedStarters) if (s.playerId) usedPlayerIds.add(String(s.playerId));
    for (const b of updatedBench) if (b.playerId) usedPlayerIds.add(String(b.playerId));

    let targetPos = 'BENCH';
    if (nextSlotIndex < 11) {
      // Natural EA FC progression: moves from GK forward!
      const nextUnfilled = getNextNaturalDraftSlot(updatedStarters);
      targetPos = nextUnfilled?.position ?? 'GK';
    }

    nextCandidates = await generateCandidatesForSlot(
      ctx,
      nextSlotIndex,
      targetPos,
      usedPlayerIds,
    );
    nextExpiresAt = game.mode === 'solo' ? undefined : now + TURN_TIMEOUT_MS;
  }

  const updatedParticipant = {
    ...participant,
    currentSlotIndex: nextSlotIndex,
    currentCandidateIds: nextCandidates,
    targetSlotIndex: undefined, // Reset targeted slot after pick
    turnExpiresAt: nextExpiresAt,
    startingXI: updatedStarters,
    bench: updatedBench,
    squadRating: chemResult.squadRating,
    chemistryScore: chemResult.totalChemistry,
    totalDraftScore: chemResult.totalDraftScore,
  };

  const newParticipants = [...game.participants];
  newParticipants[pIndex] = updatedParticipant;

  // Check if both players have finished all 14 picks
  const allFinishedDrafting = newParticipants.every((p: any) => p.currentSlotIndex >= 14);
  const nextGameStatus = allFinishedDrafting ? 'swapping' : game.status;

  await ctx.db.patch(game._id, {
    status: nextGameStatus,
    participants: newParticipants,
  });

  return {
    nextSlotIndex,
    chemistry: chemResult.totalChemistry,
    squadRating: chemResult.squadRating,
  };
}

/**
 * Auto-picks for a participant whose shot clock has expired (prevents stuck 1v1 rooms)
 */
export const autoPickExpiredTurn = mutation({
  args: {
    gameId: v.id('draftGames'),
    targetGuestId: v.id('guestUsers'),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    const pIndex = game.participants.findIndex((p) => p.guestId === args.targetGuestId);
    if (pIndex === -1) throw new Error('Participant not in game');

    const participant = game.participants[pIndex];
    if (participant.currentSlotIndex >= 14) {
      return { success: false, reason: 'Already finished drafting' };
    }

    // Must have candidate cards
    if (!participant.currentCandidateIds || participant.currentCandidateIds.length === 0) {
      return { success: false, reason: 'No candidate cards' };
    }

    // Auto-pick first candidate
    const autoPlayerId = participant.currentCandidateIds[0];
    return await executePickForParticipant(ctx, game, pIndex, autoPlayerId);
  },
});

/**
 * Swaps a bench super-sub with a starting XI player to tune chemistry or rating
 */
export const swapSquadPlayers = mutation({
  args: {
    gameId: v.id('draftGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    starterSlotIndex: v.number(), // 0 to 10
    benchIndex: v.number(), // 0 to 2
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    const pIndex = game.participants.findIndex((p) => p.guestId === args.guestId);
    if (pIndex === -1) throw new Error('Participant not in game');

    const participant = game.participants[pIndex];
    const starterSlot = participant.startingXI.find((s) => s.slotIndex === args.starterSlotIndex);
    const benchSlot = participant.bench.find((b) => b.benchIndex === args.benchIndex);

    if (!starterSlot || !benchSlot) throw new Error('Invalid slot indices for swap');
    if (!starterSlot.playerId || !benchSlot.playerId) {
      throw new Error('Both slots must be filled to perform swap');
    }

    // Perform swap
    const tempPlayerId = starterSlot.playerId;
    starterSlot.playerId = benchSlot.playerId;
    benchSlot.playerId = tempPlayerId;

    // Recalculate chemistry & rating
    const chemInput = await buildStartersChemistryInput(ctx, participant.startingXI);
    const chemResult = calculateSquadChemistry(chemInput);

    for (const slot of participant.startingXI) {
      slot.chemistry = chemResult.slotChemistry.get(slot.slotIndex) ?? 0;
    }

    participant.squadRating = chemResult.squadRating;
    participant.chemistryScore = chemResult.totalChemistry;
    participant.totalDraftScore = chemResult.totalDraftScore;

    const newParticipants = [...game.participants];
    newParticipants[pIndex] = participant;

    await ctx.db.patch(game._id, {
      participants: newParticipants,
    });

    return {
      chemistry: chemResult.totalChemistry,
      squadRating: chemResult.squadRating,
      totalDraftScore: chemResult.totalDraftScore,
    };
  },
});

/**
 * Swaps two starting XI players with each other on the tactical pitch
 */
export const swapStarters = mutation({
  args: {
    gameId: v.id('draftGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    slotIndexA: v.number(), // 0 to 10
    slotIndexB: v.number(), // 0 to 10
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    const pIndex = game.participants.findIndex((p) => p.guestId === args.guestId);
    if (pIndex === -1) throw new Error('Participant not in game');

    const participant = game.participants[pIndex];
    const slotA = participant.startingXI.find((s) => s.slotIndex === args.slotIndexA);
    const slotB = participant.startingXI.find((s) => s.slotIndex === args.slotIndexB);

    if (!slotA || !slotB) throw new Error('Invalid starter slot indices for swap');
    if (!slotA.playerId || !slotB.playerId) {
      throw new Error('Both slots must be filled to perform starter swap');
    }

    // Perform swap of player IDs & captaincy
    const tempPlayerId = slotA.playerId;
    const tempIsCaptain = slotA.isCaptain;

    slotA.playerId = slotB.playerId;
    slotA.isCaptain = slotB.isCaptain;

    slotB.playerId = tempPlayerId;
    slotB.isCaptain = tempIsCaptain;

    // Recalculate chemistry & rating with new positions
    const chemInput = await buildStartersChemistryInput(ctx, participant.startingXI);
    const chemResult = calculateSquadChemistry(chemInput);

    for (const slot of participant.startingXI) {
      slot.chemistry = chemResult.slotChemistry.get(slot.slotIndex) ?? 0;
    }

    participant.squadRating = chemResult.squadRating;
    participant.chemistryScore = chemResult.totalChemistry;
    participant.totalDraftScore = chemResult.totalDraftScore;

    const newParticipants = [...game.participants];
    newParticipants[pIndex] = participant;

    await ctx.db.patch(game._id, {
      participants: newParticipants,
    });

    return {
      chemistry: chemResult.totalChemistry,
      squadRating: chemResult.squadRating,
      totalDraftScore: chemResult.totalDraftScore,
    };
  },
});

/**
 * Deprecated: Draft slots are strictly drafted once per turn in natural EA FC order.
 * Rerolling or changing candidate cards mid-turn is disabled.
 */
export const changeTargetDraftSlot = mutation({
  args: {
    gameId: v.id('draftGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    targetSlotIndex: v.number(),
  },
  handler: async () => {
    return { success: false };
  },
});

/**
 * Participant marks ready. In Solo or when both in 1v1 are ready, triggers showdown simulation.
 */
export const finishDraft = mutation({
  args: {
    gameId: v.id('draftGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    const pIndex = game.participants.findIndex((p) => p.guestId === args.guestId);
    if (pIndex === -1) throw new Error('Participant not in game');

    const newParticipants = [...game.participants];
    newParticipants[pIndex] = {
      ...newParticipants[pIndex],
      isReady: true,
    };

    const allReady = newParticipants.every((p) => p.isReady);

    if (game.mode === 'solo') {
      const participant = newParticipants[0];

      // If user specifically picked 'boss_match', simulate match against boss squad
      if (game.challengeType === 'boss_match') {
        const toDraftPlayer = async (
          slot: (typeof participant.startingXI)[0],
        ): Promise<DraftSimPlayer> => {
          const p = slot.playerId ? await ctx.db.get(slot.playerId) : null;
          const c = p?.clubId ? await ctx.db.get(p.clubId) : null;
          const n = p?.nationId ? await ctx.db.get(p.nationId) : null;
          return {
            id: p ? String(p._id) : slot.position,
            name: p?.name ?? slot.position,
            tier: (p?.tier as any) ?? 'GOLD',
            position: slot.position,
            club: c?.name ?? '',
            nation: n?.name ?? '',
            league: c?.league,
            rating: p?.rating,
            isCaptain: slot.isCaptain,
          };
        };

        const hostSquad: DraftSimPlayer[] = [];
        for (const s of participant.startingXI) hostSquad.push(await toDraftPlayer(s));

        const bossSquad: DraftSimPlayer[] = [
          { id: 'b1', name: 'Pelé', tier: 'ICON', position: 'ST', club: 'Santos', nation: 'Brazil', rating: 98, isCaptain: true },
          { id: 'b2', name: 'Ronaldo Nazário', tier: 'ICON', position: 'CF', club: 'Real Madrid', nation: 'Brazil', rating: 96 },
          { id: 'b3', name: 'Zinédine Zidane', tier: 'ICON', position: 'CAM', club: 'Real Madrid', nation: 'France', rating: 96 },
          { id: 'b4', name: 'Ronaldinho', tier: 'ICON', position: 'LW', club: 'Barcelona', nation: 'Brazil', rating: 95 },
          { id: 'b5', name: 'Ruud Gullit', tier: 'ICON', position: 'CM', club: 'AC Milan', nation: 'Netherlands', rating: 93 },
          { id: 'b6', name: 'Patrick Vieira', tier: 'ICON', position: 'CDM', club: 'Arsenal', nation: 'France', rating: 91 },
          { id: 'b7', name: 'Roberto Carlos', tier: 'ICON', position: 'LB', club: 'Real Madrid', nation: 'Brazil', rating: 91 },
          { id: 'b8', name: 'Paolo Maldini', tier: 'ICON', position: 'CB', club: 'AC Milan', nation: 'Italy', rating: 95 },
          { id: 'b9', name: 'Franco Baresi', tier: 'ICON', position: 'CB', club: 'AC Milan', nation: 'Italy', rating: 93 },
          { id: 'b10', name: 'Cafu', tier: 'ICON', position: 'RB', club: 'AC Milan', nation: 'Brazil', rating: 92 },
          { id: 'b11', name: 'Lev Yashin', tier: 'ICON', position: 'GK', club: 'Dynamo Moscow', nation: 'Russia', rating: 94 },
        ];

        const simResult = simulatePureDraftMatch(
          String(game._id),
          hostSquad,
          bossSquad,
          `${game.code}:solo:showdown`,
        );

        const winnerId = simResult.winnerId === 'host' ? participant.guestId : undefined;

        const showdownResult = {
          score: simResult.score,
          winnerId,
          isShootout: simResult.isShootout,
          shootoutScore: simResult.shootoutScore,
          sectors: {
            host: simResult.sectors.host,
            guest: simResult.sectors.guest,
          },
          timeline: simResult.timeline.map((t) => ({
            id: t.id,
            minute: t.minute,
            type: t.type,
            team: t.team,
            playerName: t.player?.name,
            playerTier: t.player?.tier,
            assistName: t.assistPlayer?.name,
            description: t.description,
            scoreSnapshot: t.scoreSnapshot,
          })),
          simulatedAt: Date.now(),
        };

        await ctx.db.patch(game._id, {
          status: 'showdown',
          completedAt: Date.now(),
          participants: newParticipants,
          winnerId,
          showdownResult,
        });

        return { status: 'showdown' };
      }

      // For all dynamic challenges (Nations, Clubs, Leagues, Hybrids, Synergy, Lucky Quests):
      // Evaluate objectives directly without forced default squad simulation!
      const playerDetails = await Promise.all(
        participant.startingXI.map(async (slot) => {
          if (!slot.playerId) return null;
          const p = await ctx.db.get(slot.playerId);
          if (!p) return null;
          const club = p.clubId ? await ctx.db.get(p.clubId) : null;
          const nation = p.nationId ? await ctx.db.get(p.nationId) : null;
          return {
            name: p.name,
            clubName: club?.name ?? '',
            nationName: nation?.name ?? '',
            league: club?.league ?? '',
          };
        }),
      );
      const players = playerDetails.filter(Boolean);

      const chType = game.challengeType || 'high_chemistry';
      let title = 'Solo Challenge';
      let rewardXp = 500;
      const requirements: Array<{
        id: string;
        label: string;
        target: string;
        actual: string;
        met: boolean;
      }> = [];

      const chem = participant.chemistryScore;
      const rating = participant.squadRating;

      if (chType.startsWith('lucky:')) {
        const parts = chType.split(':');
        const kind = parts[1];

        if (kind === 'nation') {
          const targetNation = parts[2] || 'Brazil';
          const targetCount = parseInt(parts[3], 10) || 4;
          const targetChem = parseInt(parts[4], 10) || 24;
          rewardXp = parseInt(parts[5], 10) || 700;
          title = `Lucky Quest: ${targetNation} Pride`;

          const count = players.filter((p) => matchesNation(p?.nationName, targetNation)).length;
          requirements.push({
            id: 'req_1',
            label: `${targetNation} Players in XI`,
            target: `${targetCount}+`,
            actual: `${count}`,
            met: count >= targetCount,
          });
          requirements.push({
            id: 'req_2',
            label: 'Minimum Chemistry',
            target: `${targetChem}`,
            actual: `${chem}`,
            met: chem >= targetChem,
          });
        } else if (kind === 'club') {
          const targetClub = parts[2] || 'Real Madrid';
          const targetCount = parseInt(parts[3], 10) || 2;
          const targetRating = parseInt(parts[4], 10) || 84;
          rewardXp = parseInt(parts[5], 10) || 800;
          title = `Lucky Quest: ${targetClub} Core`;

          const count = players.filter((p) => matchesClub(p?.clubName, targetClub)).length;
          requirements.push({
            id: 'req_1',
            label: `${targetClub} Players in XI`,
            target: `${targetCount}+`,
            actual: `${count}`,
            met: count >= targetCount,
          });
          requirements.push({
            id: 'req_2',
            label: 'Minimum Squad Rating',
            target: `${targetRating}`,
            actual: `${rating}`,
            met: rating >= targetRating,
          });
        } else if (kind === 'league') {
          const targetLeague = parts[2] || 'Premier League';
          const targetCount = parseInt(parts[3], 10) || 4;
          const targetChem = parseInt(parts[4], 10) || 25;
          rewardXp = parseInt(parts[5], 10) || 750;
          title = `Lucky Quest: ${targetLeague} Run`;

          const count = players.filter((p) => matchesLeague(p?.league, targetLeague)).length;
          requirements.push({
            id: 'req_1',
            label: `${targetLeague} Players in XI`,
            target: `${targetCount}+`,
            actual: `${count}`,
            met: count >= targetCount,
          });
          requirements.push({
            id: 'req_2',
            label: 'Minimum Chemistry',
            target: `${targetChem}`,
            actual: `${chem}`,
            met: chem >= targetChem,
          });
        }
      } else if (chType === 'nation_brazil') {
        title = 'Samba Magic';
        rewardXp = 500;
        const count = players.filter((p) => matchesNation(p?.nationName, 'Brazil')).length;
        requirements.push({ id: 'req_1', label: 'Brazilian Players in XI', target: '4+', actual: `${count}`, met: count >= 4 });
        requirements.push({ id: 'req_2', label: 'Minimum Chemistry', target: '24', actual: `${chem}`, met: chem >= 24 });
      } else if (chType === 'nation_spain') {
        title = 'La Furia Roja';
        rewardXp = 500;
        const count = players.filter((p) => matchesNation(p?.nationName, 'Spain')).length;
        requirements.push({ id: 'req_1', label: 'Spanish Players in XI', target: '4+', actual: `${count}`, met: count >= 4 });
        requirements.push({ id: 'req_2', label: 'Minimum Chemistry', target: '25', actual: `${chem}`, met: chem >= 25 });
      } else if (chType === 'nation_england') {
        title = 'Three Lions Core';
        rewardXp = 500;
        const count = players.filter((p) => matchesNation(p?.nationName, 'England')).length;
        requirements.push({ id: 'req_1', label: 'English Players in XI', target: '4+', actual: `${count}`, met: count >= 4 });
        requirements.push({ id: 'req_2', label: 'Minimum Chemistry', target: '24', actual: `${chem}`, met: chem >= 24 });
      } else if (chType === 'nation_france') {
        title = 'Les Bleus Armada';
        rewardXp = 500;
        const count = players.filter((p) => matchesNation(p?.nationName, 'France')).length;
        requirements.push({ id: 'req_1', label: 'French Players in XI', target: '4+', actual: `${count}`, met: count >= 4 });
        requirements.push({ id: 'req_2', label: 'Minimum Chemistry', target: '25', actual: `${chem}`, met: chem >= 25 });
      } else if (chType === 'nation_argentina') {
        title = 'Albiceleste Tango';
        rewardXp = 650;
        const count = players.filter((p) => matchesNation(p?.nationName, 'Argentina')).length;
        requirements.push({ id: 'req_1', label: 'Argentinian Players in XI', target: '3+', actual: `${count}`, met: count >= 3 });
        requirements.push({ id: 'req_2', label: 'Minimum Squad Rating', target: '84', actual: `${rating}`, met: rating >= 84 });
      } else if (chType === 'club_clasico') {
        title = 'El Clásico Royale';
        rewardXp = 750;
        const realCount = players.filter((p) => matchesClub(p?.clubName, 'Real Madrid')).length;
        const barcaCount = players.filter((p) => matchesClub(p?.clubName, 'Barcelona')).length;
        requirements.push({ id: 'req_1', label: 'Real Madrid Stars', target: '2+', actual: `${realCount}`, met: realCount >= 2 });
        requirements.push({ id: 'req_2', label: 'Barcelona Stars', target: '2+', actual: `${barcaCount}`, met: barcaCount >= 2 });
        requirements.push({ id: 'req_3', label: 'Minimum Squad Rating', target: '84', actual: `${rating}`, met: rating >= 84 });
      } else if (chType === 'club_real_madrid') {
        title = 'Los Blancos Dynasty';
        rewardXp = 650;
        const count = players.filter((p) => matchesClub(p?.clubName, 'Real Madrid')).length;
        requirements.push({ id: 'req_1', label: 'Real Madrid Players', target: '3+', actual: `${count}`, met: count >= 3 });
        requirements.push({ id: 'req_2', label: 'Minimum Squad Rating', target: '85', actual: `${rating}`, met: rating >= 85 });
      } else if (chType === 'club_barcelona') {
        title = 'Blaugrana Tiki-Taka';
        rewardXp = 650;
        const count = players.filter((p) => matchesClub(p?.clubName, 'Barcelona')).length;
        requirements.push({ id: 'req_1', label: 'Barcelona Players', target: '3+', actual: `${count}`, met: count >= 3 });
        requirements.push({ id: 'req_2', label: 'Minimum Chemistry', target: '26', actual: `${chem}`, met: chem >= 26 });
      } else if (chType === 'club_single_core') {
        title = 'One Club Core';
        rewardXp = 700;
        const clubMap: Record<string, number> = {};
        for (const p of players) {
          if (p?.clubName) clubMap[p.clubName] = (clubMap[p.clubName] || 0) + 1;
        }
        const maxFromOne = Math.max(0, ...Object.values(clubMap));
        requirements.push({ id: 'req_1', label: 'Players from 1 Single Club', target: '4+', actual: `${maxFromOne}`, met: maxFromOne >= 4 });
        requirements.push({ id: 'req_2', label: 'Minimum Chemistry', target: '24', actual: `${chem}`, met: chem >= 24 });
      } else if (chType === 'league_epl') {
        title = 'Premier League Fortress';
        rewardXp = 600;
        const count = players.filter((p) => matchesLeague(p?.league, 'Premier League')).length;
        requirements.push({ id: 'req_1', label: 'Premier League Players', target: '5+', actual: `${count}`, met: count >= 5 });
        requirements.push({ id: 'req_2', label: 'Minimum Squad Rating', target: '85', actual: `${rating}`, met: rating >= 85 });
      } else if (chType === 'league_la_liga') {
        title = 'La Liga Maestros';
        rewardXp = 600;
        const count = players.filter((p) => matchesLeague(p?.league, 'La Liga')).length;
        requirements.push({ id: 'req_1', label: 'La Liga Players', target: '5+', actual: `${count}`, met: count >= 5 });
        requirements.push({ id: 'req_2', label: 'Minimum Chemistry', target: '26', actual: `${chem}`, met: chem >= 26 });
      } else if (chType === 'hybrid_3leagues') {
        title = 'Tri-League Hybrid';
        rewardXp = 850;
        const leagues = new Set(players.map((p) => p?.league).filter(Boolean));
        requirements.push({ id: 'req_1', label: 'Distinct Leagues in XI', target: '3', actual: `${leagues.size}`, met: leagues.size === 3 });
        requirements.push({ id: 'req_2', label: 'Minimum Chemistry', target: '27', actual: `${chem}`, met: chem >= 27 });
      } else if (chType === 'high_chemistry') {
        title = 'Chemistry Wizard';
        rewardXp = 650;
        requirements.push({ id: 'req_1', label: 'Squad Chemistry', target: '30', actual: `${chem}`, met: chem >= 30 });
      } else if (chType === 'target_rating') {
        title = 'Galácticos 87+';
        rewardXp = 750;
        requirements.push({ id: 'req_1', label: 'Overall Squad Rating', target: '87', actual: `${rating}`, met: rating >= 87 });
      } else {
        // Default high_chemistry / lucky quest
        title = 'Chemistry Master';
        rewardXp = 650;
        requirements.push({ id: 'req_1', label: 'Squad Chemistry', target: '28', actual: `${chem}`, met: chem >= 28 });
        requirements.push({ id: 'req_2', label: 'Squad Rating', target: '82', actual: `${rating}`, met: rating >= 82 });
      }

      const passed = requirements.every((r) => r.met);
      const challengeEvaluation = {
        passed,
        challengeId: chType,
        title,
        requirements,
        rewardXp: passed ? rewardXp : 100,
        completedAt: Date.now(),
      };

      await ctx.db.patch(game._id, {
        status: 'completed',
        completedAt: Date.now(),
        participants: newParticipants,
        challengeEvaluation,
      });

      return { status: 'completed', challengeEvaluation };
    }

    if (allReady && newParticipants.length >= 2) {
      // 1v1 Showdown: run match simulation
      const host = newParticipants[0];
      const guest = newParticipants[1];

      const toDraftPlayer = async (
        slot: (typeof host.startingXI)[0],
      ): Promise<DraftSimPlayer> => {
        const p = slot.playerId ? await ctx.db.get(slot.playerId) : null;
        const c = p?.clubId ? await ctx.db.get(p.clubId) : null;
        const n = p?.nationId ? await ctx.db.get(p.nationId) : null;
        return {
          id: p ? String(p._id) : slot.position,
          name: p?.name ?? slot.position,
          tier: (p?.tier as any) ?? 'GOLD',
          position: slot.position,
          club: c?.name ?? '',
          nation: n?.name ?? '',
          league: c?.league,
          rating: p?.rating,
          isCaptain: slot.isCaptain,
        };
      };

      const hostSquad: DraftSimPlayer[] = [];
      for (const s of host.startingXI) hostSquad.push(await toDraftPlayer(s));

      const guestSquad: DraftSimPlayer[] = [];
      for (const s of guest.startingXI) guestSquad.push(await toDraftPlayer(s));

      const simResult = simulatePureDraftMatch(
        String(game._id),
        hostSquad,
        guestSquad,
        game.code,
      );

      const winnerId =
        simResult.winnerId === 'host'
          ? host.guestId
          : simResult.winnerId === 'guest'
            ? guest.guestId
            : undefined;

      await ctx.db.patch(game._id, {
        status: 'showdown',
        completedAt: Date.now(),
        participants: newParticipants,
        winnerId,
        showdownResult: {
          score: simResult.score,
          winnerId,
          isShootout: simResult.isShootout,
          shootoutScore: simResult.shootoutScore,
          sectors: {
            host: simResult.sectors.host,
            guest: simResult.sectors.guest,
          },
          timeline: simResult.timeline.map((t) => ({
            id: t.id,
            minute: t.minute,
            type: t.type,
            team: t.team,
            playerName: t.player?.name,
            playerTier: t.player?.tier,
            assistName: t.assistPlayer?.name,
            description: t.description,
            scoreSnapshot: t.scoreSnapshot,
          })),
          simulatedAt: Date.now(),
        },
      });

      return { status: 'showdown' };
    }

    await ctx.db.patch(game._id, {
      participants: newParticipants,
    });

    return { status: 'swapping' };
  },
});

/**
 * Solo Boss Match: simulates match against a Legendary CPU Boss XI
 */
export const simulateBossMatch = mutation({
  args: {
    gameId: v.id('draftGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    const participant = game.participants.find((p) => p.guestId === args.guestId);
    if (!participant) throw new Error('Participant not in game');

    // Build player squad
    const hostSquad: DraftSimPlayer[] = [];
    for (const slot of participant.startingXI) {
      const p = slot.playerId ? await ctx.db.get(slot.playerId) : null;
      const c = p?.clubId ? await ctx.db.get(p.clubId) : null;
      const n = p?.nationId ? await ctx.db.get(p.nationId) : null;
      hostSquad.push({
        id: p ? String(p._id) : slot.position,
        name: p?.name ?? slot.position,
        tier: (p?.tier as any) ?? 'GOLD',
        position: slot.position,
        club: c?.name ?? '',
        nation: n?.name ?? '',
        league: c?.league,
        rating: p?.rating,
        isCaptain: slot.isCaptain,
      });
    }

    // Legendary Boss XI
    const bossSquad: DraftSimPlayer[] = [
      { id: 'b1', name: 'Pelé', tier: 'ICON', position: 'ST', club: 'Santos', nation: 'Brazil', rating: 98, isCaptain: true },
      { id: 'b2', name: 'Ronaldo Nazário', tier: 'ICON', position: 'CF', club: 'Real Madrid', nation: 'Brazil', rating: 96 },
      { id: 'b3', name: 'Zinédine Zidane', tier: 'ICON', position: 'CAM', club: 'Real Madrid', nation: 'France', rating: 96 },
      { id: 'b4', name: 'Ronaldinho', tier: 'ICON', position: 'LW', club: 'Barcelona', nation: 'Brazil', rating: 95 },
      { id: 'b5', name: 'Ruud Gullit', tier: 'ICON', position: 'CM', club: 'AC Milan', nation: 'Netherlands', rating: 93 },
      { id: 'b6', name: 'Patrick Vieira', tier: 'ICON', position: 'CDM', club: 'Arsenal', nation: 'France', rating: 91 },
      { id: 'b7', name: 'Roberto Carlos', tier: 'ICON', position: 'LB', club: 'Real Madrid', nation: 'Brazil', rating: 91 },
      { id: 'b8', name: 'Paolo Maldini', tier: 'ICON', position: 'CB', club: 'AC Milan', nation: 'Italy', rating: 95 },
      { id: 'b9', name: 'Franco Baresi', tier: 'ICON', position: 'CB', club: 'AC Milan', nation: 'Italy', rating: 93 },
      { id: 'b10', name: 'Cafu', tier: 'ICON', position: 'RB', club: 'AC Milan', nation: 'Brazil', rating: 92 },
      { id: 'b11', name: 'Lev Yashin', tier: 'ICON', position: 'GK', club: 'Dynamo Moscow', nation: 'Russia', rating: 94 },
    ];

    const simResult = simulatePureDraftMatch(
      String(game._id),
      hostSquad,
      bossSquad,
      `${game.code}:boss`,
    );

    const winnerId = simResult.winnerId === 'host' ? participant.guestId : undefined;

    const showdownResult = {
      score: simResult.score,
      winnerId,
      isShootout: simResult.isShootout,
      shootoutScore: simResult.shootoutScore,
      sectors: {
        host: simResult.sectors.host,
        guest: simResult.sectors.guest,
      },
      timeline: simResult.timeline.map((t) => ({
        id: t.id,
        minute: t.minute,
        type: t.type,
        team: t.team,
        playerName: t.player?.name,
        playerTier: t.player?.tier,
        assistName: t.assistPlayer?.name,
        description: t.description,
        scoreSnapshot: t.scoreSnapshot,
      })),
      simulatedAt: Date.now(),
    };

    await ctx.db.patch(game._id, {
      status: 'showdown',
      winnerId,
      showdownResult,
    });

    return showdownResult;
  },
});
