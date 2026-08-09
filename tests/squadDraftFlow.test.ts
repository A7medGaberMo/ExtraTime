import { describe, it, expect } from "vitest";
import { FakeConvexDb, makeCtx } from "./fake-convex-db";
import { seedPlayerPool, seedGuest } from "./fixtures/playerFixtures";
import {
  create,
  createSolo,
  join,
  submitPick,
  reroll,
  autoPlaceExpired,
  finalizeSquad,
} from "../convex/squadDraft/mutations";
import {
  getLobbyByCode,
  getDraftState,
  getMyPicks,
  getMySquad,
  getMatchResultByRoom,
} from "../convex/squadDraft/queries";
import { getNodeForRound, roundCountFor } from "../convex/squadDraft/draftEngine";

const FORMATION = "4-3-3";
const ROUNDS = roundCountFor(FORMATION, true);

async function setupDb() {
  const db = new FakeConvexDb();
  seedPlayerPool(db);
  const ctx = makeCtx(db);
  const hostId = seedGuest(db, "host");
  const guestId = seedGuest(db, "guest");
  const outsiderId = seedGuest(db, "outsider");
  return { db, ctx, hostId, guestId, outsiderId };
}

/** Create a duo room and join the guest — host active on round 1. */
async function makeDuoRoom() {
  const { db, ctx, hostId, guestId } = await setupDb();
  const created = await create(ctx, { hostId, formation: FORMATION, poolMode: "GLOBAL" });
  const joinResult = await join(ctx, { roomId: created.roomId, guestId });
  expect(joinResult.activeUserId).toBe(hostId);
  return { db, ctx, hostId, guestId, roomId: created.roomId };
}

const slotForRound = (round: number) => getNodeForRound(FORMATION, round, true).slotIndex;

describe("room lifecycle", () => {
  it("create publishes a waiting lobby; join starts the draft", async () => {
    const { db, ctx, hostId, guestId } = await setupDb();
    const created = await create(ctx, { hostId, formation: FORMATION });
    expect(created.code).toHaveLength(6);
    expect(created.matched).toBe(false);

    const lobby = await getLobbyByCode(ctx, { code: created.code });
    expect(lobby?.roomId).toBe(created.roomId);
    expect(lobby?.status).toBe("waiting");
    expect(lobby?.guestId).toBeUndefined();
    expect(lobby?.formation).toBe(FORMATION);

    const draftRows = db.rows("squadDraftRooms");
    expect(draftRows).toHaveLength(1);
    expect(draftRows[0].status).toBe("waiting");
    expect(draftRows[0].currentRound).toBe(1);
    expect(draftRows[0].timerExpiresAt).toBeUndefined();

    await join(ctx, { roomId: created.roomId, guestId });
    const after = await getLobbyByCode(ctx, { code: created.code });
    expect(after?.status).toBe("in_progress");
    expect(after?.guestId).toBe(guestId);

    const state = await getDraftState(ctx, { roomId: created.roomId, userId: hostId });
    expect(state.status).toBe("drafting");
    expect(state.activeUserId).toBe(hostId);
    expect(state.maxRounds).toBe(ROUNDS);
    expect(state.players.guest?.id).toBe(guestId);
    expect(state.timerExpiresAt).toBeTypeOf("number");
  });

  it("rejects self-join and double-join", async () => {
    const { db, ctx, hostId, guestId, outsiderId } = await setupDb();
    const created = await create(ctx, { hostId, formation: FORMATION });
    const { roomId } = created;

    await expect(join(ctx, { roomId, guestId: hostId })).rejects.toThrow("own room");
    await join(ctx, { roomId, guestId });
    await expect(join(ctx, { roomId, guestId: outsiderId })).rejects.toThrow("Room is full");
    await expect(join(ctx, { roomId, guestId })).rejects.toThrow("open"); // no longer waiting
  });

  it("hides draft state from strangers", async () => {
    const { db, ctx, hostId, guestId, outsiderId } = await setupDb();
    const created = await create(ctx, { hostId, formation: FORMATION });
    await join(ctx, { roomId: created.roomId, guestId });
    await expect(getDraftState(ctx, { roomId: created.roomId, userId: outsiderId })).rejects.toThrow(
      "not in this room"
    );
  });
});

describe("duo draft (11 rounds)", () => {
  it("alternates turns and finishes into one completed match", async () => {
    const { db, ctx, hostId, guestId, roomId } = await makeDuoRoom();

    for (let round = 1; round <= ROUNDS; round++) {
      const state = await getDraftState(ctx, { roomId, userId: hostId });
      const active = String(state.activeUserId);
      expect([hostId, guestId]).toContain(active);

      const picks = await getMyPicks(ctx, { roomId, userId: active });
      const activePick = picks.find((p) => p.roundNumber === round);
      expect(activePick).toBeDefined();
      expect(activePick!.options).toHaveLength(5);

      const response = await submitPick(ctx, {
        roomId,
        userId: active,
        playerId: activePick!.options[0].playerId,
        slotIndex: slotForRound(round),
      });

      if (round < ROUNDS) {
        expect(response.activeUserId).toBe(active === hostId ? guestId : hostId);
        expect(response.nextRound).toBe(round + 1);
      } else {
        expect(response.phase).toBe("submission");
        expect(response.nextRound).toBe(ROUNDS + 1);
      }
    }

    // Submission phase — no match until finalize.
    const mid = await getDraftState(ctx, { roomId, userId: hostId });
    expect(mid.status).toBe("drafting");
    expect(mid.currentRound).toBe(ROUNDS + 1);
    expect(db.rows("matches")).toHaveLength(0);

    const hostFinal = await finalizeSquad(ctx, { roomId, userId: hostId });
    expect(hostFinal.submitted).toBe(true);
    expect(hostFinal.matchReady).toBe(false);
    expect(db.rows("matches")).toHaveLength(0);

    const guestFinal = await finalizeSquad(ctx, { roomId, userId: guestId });
    expect(guestFinal.matchReady).toBe(true);
    expect(guestFinal.matchId).toBeTypeOf("string");
    expect(db.rows("matches")).toHaveLength(1);

    // Race guard: re-finalize returns the existing match untouched.
    const hostAgain = await finalizeSquad(ctx, { roomId, userId: hostId });
    expect(hostAgain.matchId).toBe(guestFinal.matchId);
    expect(db.rows("matches")).toHaveLength(1);

    const result = await getMatchResultByRoom(ctx, { roomId });
    expect(result?.winnerId).toBeDefined();
    expect(["host", "guest"]).toContain(result!.winnerSide);
    expect(result?.seeded).toBe(`squad:${roomId}`);
    expect(result?.squads.host).toBeDefined();
    expect(result?.squads.guest).toBeDefined();

    const done = await getDraftState(ctx, { roomId, userId: hostId });
    expect(done.status).toBe("completed");

    const hostSquad = await getMySquad(ctx, { roomId, userId: hostId });
    expect(hostSquad?.isSubmitted).toBe(true);
    expect(hostSquad?.slots).toHaveLength(11);
    expect(hostSquad!.totalChem).toBeGreaterThanOrEqual(0);
    expect(hostSquad!.totalChem).toBeLessThanOrEqual(33);
    expect(hostSquad!.totalOvr).toBeGreaterThan(50);
  });

  it("enforces turn order and option validity", async () => {
    const { db, ctx, hostId, guestId, roomId } = await makeDuoRoom();
    const hostPicks = await getMyPicks(ctx, { roomId, userId: hostId });
    const pickPlayer = hostPicks[0].options[0].playerId;

    await expect(
      submitPick(ctx, { roomId, userId: guestId, playerId: pickPlayer, slotIndex: 0 })
    ).rejects.toThrow("not your turn");

    await expect(
      submitPick(ctx, { roomId, userId: hostId, playerId: pickPlayer, slotIndex: 1 })
    ).rejects.toThrow(/slot 0/);

    const alienId = db.seed("players", {
      name: "Alien",
      position: "ST",
      clubId: "",
      nationId: "",
      tier: "GOLD",
      isLegend: false,
      isSynthetic: false,
      seasonYear: undefined,
    });
    await expect(
      submitPick(ctx, { roomId, userId: hostId, playerId: alienId, slotIndex: 0 })
    ).rejects.toThrow("not one of your options");

    await submitPick(ctx, { roomId, userId: hostId, playerId: pickPlayer, slotIndex: 0 });
    await expect(
      submitPick(ctx, { roomId, userId: hostId, playerId: pickPlayer, slotIndex: 0 })
    ).rejects.toThrow("not your turn");
  });

  it("allows exactly one reroll, excluding the old five", async () => {
    const { db, ctx, hostId, roomId } = await makeDuoRoom();
    const before = await getMyPicks(ctx, { roomId, userId: hostId });
    const oldIds = new Set(before[0].options.map((o) => o.playerId));

    const rolled = await reroll(ctx, { roomId, userId: hostId });
    expect(rolled.options).toHaveLength(5);
    expect(rolled.options.every((o) => !oldIds.has(o.playerId))).toBe(true);

    const state = await getDraftState(ctx, { roomId, userId: hostId });
    expect(state.hostRerollsLeft).toBe(0);

    await expect(reroll(ctx, { roomId, userId: hostId })).rejects.toThrow("No rerolls");
  });

  it("auto-places the best card after the timer expires", async () => {
    const { db, ctx, hostId, roomId } = await makeDuoRoom();

    await expect(autoPlaceExpired(ctx, { roomId, userId: hostId })).rejects.toThrow("has not expired");

    const hotDraft = db.rows("squadDraftRooms")[0];
    await db.patch(hotDraft._id, { timerExpiresAt: Date.now() - 30_000 });

    const placed = await autoPlaceExpired(ctx, { roomId, userId: hostId });
    expect(placed.autoPlaced).toBe(true);
    expect(placed.nextRound).toBe(2);

    const hostPicks = await getMyPicks(ctx, { roomId, userId: hostId });
    expect(hostPicks[0].selectedSlotIndex).toBe(0);
    expect(hostPicks[0].selected).toBeDefined();

    await expect(autoPlaceExpired(ctx, { roomId, userId: hostId })).rejects.toThrow("not your turn");
  });
});

describe("solo draft", () => {
  it("finalizes on the last pick and persists one match", async () => {
    const { db, ctx, hostId } = await setupDb();
    const created = await createSolo(ctx, { userId: hostId, formation: FORMATION });
    expect(created.matched).toBe(true);

    const draft = db.rows("squadDraftRooms")[0];
    expect(draft.status).toBe("drafting");
    expect(draft.currentRound).toBe(1);
    expect(db.rows("squadDraftPicks")).toHaveLength(1);

    for (let round = 1; round <= 11; round++) {
      const picks = await getMyPicks(ctx, { roomId: created.roomId, userId: hostId });
      const activePick = picks.find((p) => p.roundNumber === round);
      expect(activePick?.options).toHaveLength(5);

      const response = await submitPick(ctx, {
        roomId: created.roomId,
        userId: hostId,
        playerId: activePick!.options[0].playerId,
        slotIndex: getNodeForRound(FORMATION, round, false).slotIndex,
      });
      if (round < 11) expect(response.activeUserId).toBe(hostId);
      else expect(response.phase).toBe("submission");
    }

    const matches = db.rows("matches");
    expect(matches).toHaveLength(1);
    expect(matches[0].winnerId).toBe(hostId);
    expect(matches[0].guestSquad).toHaveLength(0);

    const squad = await getMySquad(ctx, { roomId: created.roomId, userId: String(hostId) });
    expect(squad?.slots).toHaveLength(11);
    expect(squad!.totalChem).toBeGreaterThanOrEqual(0);
    expect(squad!.totalOvr).toBeGreaterThan(50);

    const state = await getDraftState(ctx, { roomId: created.roomId, userId: hostId });
    expect(state.status).toBe("completed");
  });
});