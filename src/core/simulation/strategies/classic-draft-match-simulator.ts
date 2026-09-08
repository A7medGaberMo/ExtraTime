import type {
  IMatchSimulatorStrategy,
  MatchSimulationResult,
  GameType,
  SimTimelineEvent,
  SimPlayerRating,
  SimSectorAnalysis,
  SimSynergyBreakdown,
  TimelineEventType,
} from '@/core/simulation/simulation.interface';
import type { PlayerCardData } from '@/types/player';
import {
  hashSeed,
  mulberry32,
  TIER_WEIGHTS,
  type SimTier,
} from '@/core/simulation/match-simulator';

export interface DraftSimPlayer {
  id: string;
  name: string;
  tier: SimTier;
  position: string;
  club: string;
  nation: string;
  league?: string;
  rating?: number;
  isCaptain?: boolean;
}

type SectorLine = 'GK' | 'DEF' | 'MID' | 'ATT';

function getLine(posRaw: string): SectorLine {
  const p = posRaw.trim().toUpperCase();
  if (p === 'GK') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p)) return 'MID';
  return 'ATT';
}

function playerLines(pos: string): Set<SectorLine> {
  const lines = new Set<SectorLine>();
  for (const part of pos.split('/')) {
    lines.add(getLine(part));
  }
  return lines;
}

/** Pure numeric rating from player card (75-99 scale) */
function getPlayerOvr(p: { tier: string; rating?: number }): number {
  if (p.rating && p.rating >= 60 && p.rating <= 99) return p.rating;
  switch (p.tier) {
    case 'ICON':
      return 93;
    case 'HERO':
      return 89;
    case 'ULTIMATE':
      return 91;
    case 'MASTER':
      return 87;
    case 'ELITE':
      return 84;
    case 'GOLD':
      return 80;
    case 'SILVER':
      return 74;
    case 'BRONZE':
      return 68;
    default:
      return 80;
  }
}

/** Authentic FUT Chemistry calculation for a 11-player squad */
export function calculateDraftSynergy(squad: DraftSimPlayer[]): {
  chemLinks: { club: number; nation: number; league: number };
  chemPoints: { club: number; nation: number; league: number };
  totalChem: number;
  playerChem: Map<string, number>;
} {
  const clubCounts = new Map<string, number>();
  const nationCounts = new Map<string, number>();
  const leagueCounts = new Map<string, number>();

  for (const p of squad) {
    if (p.club) clubCounts.set(p.club, (clubCounts.get(p.club) ?? 0) + 1);
    if (p.nation) {
      // Icons grant +2 nation count
      const add = p.tier === 'ICON' ? 2 : 1;
      nationCounts.set(p.nation, (nationCounts.get(p.nation) ?? 0) + add);
    }
    if (p.league) {
      // Heroes grant +2 league count
      const add = p.tier === 'HERO' ? 2 : 1;
      leagueCounts.set(p.league, (leagueCounts.get(p.league) ?? 0) + add);
    }
  }

  // Authentic FUT thresholds
  // Club: 2 -> 1, 4 -> 2, 7 -> 3
  const getClubBonus = (cnt: number) => (cnt >= 7 ? 3 : cnt >= 4 ? 2 : cnt >= 2 ? 1 : 0);
  // Nation: 2 -> 1, 5 -> 2, 8 -> 3
  const getNationBonus = (cnt: number) => (cnt >= 8 ? 3 : cnt >= 5 ? 2 : cnt >= 2 ? 1 : 0);
  // League: 3 -> 1, 5 -> 2, 8 -> 3
  const getLeagueBonus = (cnt: number) => (cnt >= 8 ? 3 : cnt >= 5 ? 2 : cnt >= 3 ? 1 : 0);

  let totalClubLinks = 0;
  let totalNationLinks = 0;
  let totalLeagueLinks = 0;

  for (let i = 0; i < squad.length; i++) {
    for (let j = i + 1; j < squad.length; j++) {
      if (squad[i].club && squad[i].club === squad[j].club) totalClubLinks++;
      if (squad[i].nation && squad[i].nation === squad[j].nation) totalNationLinks++;
      if (squad[i].league && squad[j].league && squad[i].league === squad[j].league) totalLeagueLinks++;
    }
  }

  const playerChem = new Map<string, number>();
  let totalSquadChem = 0;

  for (const p of squad) {
    if (p.tier === 'ICON' || p.tier === 'HERO') {
      // Icons and Heroes always get full chemistry
      playerChem.set(p.id, 3);
      totalSquadChem += 3;
      continue;
    }

    const cPts = p.club ? getClubBonus(clubCounts.get(p.club) ?? 0) : 0;
    const nPts = p.nation ? getNationBonus(nationCounts.get(p.nation) ?? 0) : 0;
    const lPts = p.league ? getLeagueBonus(leagueCounts.get(p.league) ?? 0) : 0;

    const chem = Math.min(3, cPts + nPts + lPts);
    playerChem.set(p.id, chem);
    totalSquadChem += chem;
  }

  return {
    chemLinks: { club: totalClubLinks, nation: totalNationLinks, league: totalLeagueLinks },
    chemPoints: {
      club: Math.min(15, totalClubLinks * 1.5),
      nation: Math.min(15, totalNationLinks * 1.0),
      league: Math.min(15, totalLeagueLinks * 1.2),
    },
    totalChem: Math.min(33, totalSquadChem),
    playerChem,
  };
}

/** Sector analysis based on player OVR and positions */
function computeDraftSectors(squad: DraftSimPlayer[]): SimSectorAnalysis {
  let attackSum = 0;
  let attackCount = 0;
  let midfieldSum = 0;
  let midfieldCount = 0;
  let defenseSum = 0;
  let defenseCount = 0;

  for (const p of squad) {
    const ovr = getPlayerOvr(p);
    const lines = playerLines(p.position);
    for (const line of lines) {
      if (line === 'GK' || line === 'DEF') {
        defenseSum += line === 'GK' ? ovr * 1.05 : ovr;
        defenseCount++;
      } else if (line === 'MID') {
        midfieldSum += ovr;
        midfieldCount++;
      } else {
        attackSum += ovr;
        attackCount++;
      }
    }
  }

  const attackNorm =
    attackCount > 0 ? Math.round((attackSum / attackCount) * 10) / 10 : 80;
  const midfieldNorm =
    midfieldCount > 0 ? Math.round((midfieldSum / midfieldCount) * 10) / 10 : 80;
  const defenseNorm =
    defenseCount > 0 ? Math.round((defenseSum / defenseCount) * 10) / 10 : 80;
  const totalRating =
    Math.round(((attackNorm + midfieldNorm + defenseNorm) / 3) * 10) / 10;

  return {
    attack: attackNorm,
    midfield: midfieldNorm,
    defense: defenseNorm,
    totalRating,
  };
}

export function simulatePureDraftMatch(
  roomId: string,
  hostSquad: DraftSimPlayer[],
  guestSquad: DraftSimPlayer[],
  seed: string,
): MatchSimulationResult {
  const rng = mulberry32(hashSeed(`${seed}:${roomId}:draft`));
  const flowRng = mulberry32(hashSeed(`${seed}:${roomId}:flow:draft`));
  const matchId = `draft-${hashSeed(`${roomId}:${seed}`).toString(36)}`;

  const hostSectors = computeDraftSectors(hostSquad);
  const guestSectors = computeDraftSectors(guestSquad);

  const hostSynergy = calculateDraftSynergy(hostSquad);
  const guestSynergy = calculateDraftSynergy(guestSquad);

  // Chemistry bonus: 33 chem gives +6.6 combat rating
  const hostChemBonus = (hostSynergy.totalChem / 33) * 6.6;
  const guestChemBonus = (guestSynergy.totalChem / 33) * 6.6;

  // Midfield momentum
  const midDiff = hostSectors.midfield - guestSectors.midfield;
  const hostMomentum = midDiff >= 1.5 ? 1.5 : 0;
  const guestMomentum = -midDiff >= 1.5 ? 1.5 : 0;

  // Clutch factor: Captain presence adds +1.2 clutch rating
  const hostHasCaptain = hostSquad.some((p) => p.isCaptain);
  const guestHasCaptain = guestSquad.some((p) => p.isCaptain);
  const hostClutch = hostHasCaptain ? 1.2 : 0;
  const guestClutch = guestHasCaptain ? 1.2 : 0;

  const hostPower = hostSectors.totalRating + hostChemBonus + hostMomentum + hostClutch;
  const guestPower = guestSectors.totalRating + guestChemBonus + guestMomentum + guestClutch;

  const powerGap = hostPower - guestPower;
  const xgHost = Math.min(4.5, Math.max(0.4, 1.75 + powerGap * 0.05));
  const xgGuest = Math.min(4.5, Math.max(0.4, 1.75 - powerGap * 0.05));

  const timeline: SimTimelineEvent[] = [];
  const score = { host: 0, guest: 0 };
  const stats = new Map<string, { goals: number; assists: number; saves: number }>();

  function bump(id: string, key: 'goals' | 'assists' | 'saves') {
    const s = stats.get(id) ?? { goals: 0, assists: 0, saves: 0 };
    s[key]++;
    stats.set(id, s);
  }

  function cardUser(p: DraftSimPlayer) {
    return { id: p.id, name: p.name, tier: p.tier, position: p.position };
  }

  function pushEvent(
    minute: number,
    type: TimelineEventType,
    team: 'host' | 'guest',
    description: string,
    player?: ReturnType<typeof cardUser>,
    assistPlayer?: { id: string; name: string },
  ) {
    timeline.push({
      id: `${minute}-${type.toLowerCase()}-${timeline.length}`,
      minute,
      type,
      team,
      player,
      assistPlayer,
      description,
      scoreSnapshot: { host: score.host, guest: score.guest },
    });
  }

  // Pick scorer: Captains have +40% weighting, attackers have high weight
  function pickDraftScorer(side: 'host' | 'guest'): DraftSimPlayer {
    const squad = side === 'host' ? hostSquad : guestSquad;
    const attackers = squad.filter((p) => playerLines(p.position).has('ATT'));
    const mids = squad.filter((p) => playerLines(p.position).has('MID'));
    const pool = attackers.length > 0 ? attackers : mids.length > 0 ? mids : squad;

    const weights = pool.map((p) => {
      let w = (TIER_WEIGHTS[p.tier] ?? 3) * 2;
      if (p.isCaptain) w *= 1.4; // Captain clutch bonus
      return w;
    });

    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[0];
  }

  function pickDraftGk(side: 'host' | 'guest'): DraftSimPlayer {
    const squad = side === 'host' ? hostSquad : guestSquad;
    return squad.find((p) => playerLines(p.position).has('GK')) ?? squad[0];
  }

  pushEvent(0, 'KICKOFF', 'host', 'The whistle blows! The FUT Draft Duel is underway!');

  let minute = 1;
  while (minute <= 90) {
    // Late clutching: minutes 75-90 have higher event probability
    const isClutchTime = minute >= 75;
    const minuteBias = 0.5 + (minute / 90) * 0.7 + (isClutchTime ? 0.25 : 0);

    const pHost = (xgHost / 90) * minuteBias;
    const pGuest = (xgGuest / 90) * minuteBias;

    const roll = flowRng();
    if (roll < pHost) {
      // Host Goal
      const scorer = pickDraftScorer('host');
      const assistPool = hostSquad.filter((p) => p.id !== scorer.id);
      const assist = assistPool.length > 0 && rng() < 0.7 ? assistPool[Math.floor(rng() * assistPool.length)] : null;
      score.host++;
      bump(scorer.id, 'goals');
      if (assist) bump(assist.id, 'assists');

      const desc = scorer.isCaptain
        ? `⚡ CAPTAIN CLUTCH! ${scorer.name} smashes it into the top corner!`
        : `GOAL! ${scorer.name} finishes clinically past the keeper!`;

      pushEvent(
        minute,
        'GOAL',
        'host',
        assist ? `${desc} (${assist.name} with the assist)` : desc,
        cardUser(scorer),
        assist ? { id: assist.id, name: assist.name } : undefined,
      );
    } else if (roll < pHost + pGuest) {
      // Guest Goal
      const scorer = pickDraftScorer('guest');
      const assistPool = guestSquad.filter((p) => p.id !== scorer.id);
      const assist = assistPool.length > 0 && rng() < 0.7 ? assistPool[Math.floor(rng() * assistPool.length)] : null;
      score.guest++;
      bump(scorer.id, 'goals');
      if (assist) bump(assist.id, 'assists');

      const desc = scorer.isCaptain
        ? `⚡ CAPTAIN CLUTCH! ${scorer.name} strikes with ice in their veins!`
        : `GOAL! ${scorer.name} finds the back of the net!`;

      pushEvent(
        minute,
        'GOAL',
        'guest',
        assist ? `${desc} (${assist.name} with the assist)` : desc,
        cardUser(scorer),
        assist ? { id: assist.id, name: assist.name } : undefined,
      );
    } else if (roll > 0.94) {
      // Save
      const defendingSide = roll > 0.97 ? 'host' : 'guest';
      const gk = pickDraftGk(defendingSide);
      bump(gk.id, 'saves');
      pushEvent(minute, 'SAVE', defendingSide, `Sensational reflex save by ${gk.name}!`, cardUser(gk));
    } else if (roll > 0.91) {
      // Woodwork
      const side = roll > 0.925 ? 'host' : 'guest';
      const player = pickDraftScorer(side);
      pushEvent(minute, 'CROSSBAR', side, `${player.name} rattles the woodwork! So close!`, cardUser(player));
    }

    if (minute === 45) {
      pushEvent(45, 'HALF_TIME', 'host', `HALF-TIME: Host ${score.host} - ${score.guest} Guest`);
    }

    minute++;
  }

  pushEvent(90, 'FULL_TIME', 'host', `FULL TIME: Host ${score.host} - ${score.guest} Guest`);

  let isShootout = false;
  let shootoutScore: { host: number; guest: number } | undefined;
  let winnerId: 'host' | 'guest' | null = null;

  if (score.host === score.guest) {
    isShootout = true;
    const pkScore = { host: 0, guest: 0 };
    for (let k = 0; k < 5; k++) {
      const hShooter = hostSquad[k % hostSquad.length];
      const gShooter = guestSquad[k % guestSquad.length];

      // Clutch captains have 92% conversion
      const hProb = hShooter.isCaptain ? 0.92 : 0.78;
      const gProb = gShooter.isCaptain ? 0.92 : 0.78;

      const hScored = rng() < hProb;
      if (hScored) pkScore.host++;
      pushEvent(
        91 + k,
        'PENALTY_SHOOTOUT',
        'host',
        hScored
          ? `⚡ PENALTY SCORED! ${hShooter.name} buries it with composure! (PK: ${pkScore.host}-${pkScore.guest})`
          : `❌ PENALTY SAVED! ${hShooter.name}'s shot is denied! (PK: ${pkScore.host}-${pkScore.guest})`,
        cardUser(hShooter),
      );

      const gScored = rng() < gProb;
      if (gScored) pkScore.guest++;
      pushEvent(
        91 + k,
        'PENALTY_SHOOTOUT',
        'guest',
        gScored
          ? `⚡ PENALTY SCORED! ${gShooter.name} converts clinically! (PK: ${pkScore.host}-${pkScore.guest})`
          : `❌ PENALTY MISSED! ${gShooter.name} fails to convert! (PK: ${pkScore.host}-${pkScore.guest})`,
        cardUser(gShooter),
      );
    }

    // Sudden death if still tied
    let sudden = 0;
    while (pkScore.host === pkScore.guest && sudden < 5) {
      const hShooter = hostSquad[(5 + sudden) % hostSquad.length];
      const gShooter = guestSquad[(5 + sudden) % guestSquad.length];
      const hScored = rng() < 0.75;
      if (hScored) pkScore.host++;
      const gScored = rng() < 0.75;
      if (gScored) pkScore.guest++;

      pushEvent(
        96 + sudden,
        'PENALTY_SHOOTOUT',
        'host',
        `SUDDEN DEATH: ${hShooter.name} ${hScored ? 'SCORES!' : 'misses!'} (PK: ${pkScore.host}-${pkScore.guest})`,
        cardUser(hShooter),
      );
      pushEvent(
        96 + sudden,
        'PENALTY_SHOOTOUT',
        'guest',
        `SUDDEN DEATH: ${gShooter.name} ${gScored ? 'SCORES!' : 'misses!'} (PK: ${pkScore.host}-${pkScore.guest})`,
        cardUser(gShooter),
      );
      sudden++;
    }
    if (pkScore.host === pkScore.guest) {
      // Coin flip decider
      if (rng() < 0.5) pkScore.host++;
      else pkScore.guest++;
    }

    shootoutScore = { host: pkScore.host, guest: pkScore.guest };
    winnerId = pkScore.host > pkScore.guest ? 'host' : 'guest';

    pushEvent(
      120,
      'PENALTY_SHOOTOUT',
      winnerId,
      `SHOOTOUT COMPLETE: ${winnerId === 'host' ? 'Host' : 'Guest'} claims shootout victory ${shootoutScore.host} - ${shootoutScore.guest}!`,
    );
  } else {
    winnerId = score.host > score.guest ? 'host' : 'guest';
  }

  // Player ratings
  const makeRatings = (squad: DraftSimPlayer[]): SimPlayerRating[] =>
    squad.map((p) => {
      const s = stats.get(p.id) ?? { goals: 0, assists: 0, saves: 0 };
      const base = 6.2 + (p.isCaptain ? 0.4 : 0) + s.goals * 0.9 + s.assists * 0.4 + s.saves * 0.3;
      const chem = hostSynergy.playerChem.get(p.id) ?? guestSynergy.playerChem.get(p.id) ?? 2;
      const finalRating = Math.min(10, Math.max(6, Math.round((base + chem * 0.15) * 10) / 10));
      return {
        playerId: p.id,
        name: p.name,
        position: p.position,
        tier: p.tier,
        isSub: false,
        rating: finalRating,
        goals: s.goals,
        assists: s.assists,
        saves: s.saves > 0 ? s.saves : undefined,
      };
    });

  const synergyToSim = (syn: ReturnType<typeof calculateDraftSynergy>): SimSynergyBreakdown => ({
    clubChemLinks: syn.chemLinks.club,
    clubChemPoints: syn.chemPoints.club,
    nationChemLinks: syn.chemLinks.nation,
    nationChemPoints: syn.chemPoints.nation,
    budgetBonusPoints: 0, // No auction budget in Draft!
    totalSynergyPoints: syn.totalChem,
  });

  return {
    matchId,
    roomId,
    gameType: 'classic_draft',
    seed,
    score,
    winnerId,
    isShootout,
    shootoutScore,
    sectors: {
      host: hostSectors,
      guest: guestSectors,
    },
    synergy: {
      host: synergyToSim(hostSynergy),
      guest: synergyToSim(guestSynergy),
    },
    timeline: [...timeline].sort((a, b) => a.minute - b.minute || a.id.localeCompare(b.id)),
    playerRatings: {
      host: makeRatings(hostSquad),
      guest: makeRatings(guestSquad),
    },
    generatedAt: Date.now(),
  };
}

export class ClassicDraftMatchSimulatorStrategy implements IMatchSimulatorStrategy {
  readonly gameType: GameType = 'classic_draft';

  simulateMatch(
    roomId: string,
    hostSquad: PlayerCardData[],
    guestSquad: PlayerCardData[],
    _hostBudget: number,
    _guestBudget: number,
    seed: string,
  ): MatchSimulationResult {
    const toDraftPlayer = (p: PlayerCardData, idx: number): DraftSimPlayer => ({
      id: p.id,
      name: p.name,
      tier: p.tier as SimTier,
      position: p.position,
      club: p.club,
      nation: p.nation,
      league: (p as any).league ?? undefined,
      rating: p.rating,
      isCaptain: (p as any).isCaptain !== undefined ? (p as any).isCaptain : idx === 0,
    });

    return simulatePureDraftMatch(
      roomId,
      hostSquad.map((p, idx) => toDraftPlayer(p, idx)),
      guestSquad.map((p, idx) => toDraftPlayer(p, idx)),
      seed,
    );
  }
}
