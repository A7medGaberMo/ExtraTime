/**
 * Rich Dynamic Challenges Engine for Solo FUT Draft
 * Supports Nations, Clubs, Leagues, Hybrids, Pure Synergy, and Procedural Lucky Quests.
 */

export type ChallengeCategory = 'nation' | 'club' | 'league' | 'hybrid' | 'synergy' | 'boss' | 'lucky';

export interface ChallengeRequirementDef {
  id: string;
  label: string;
  type:
    | 'nation_count'
    | 'club_count'
    | 'league_count'
    | 'min_chem'
    | 'min_rating'
    | 'distinct_leagues'
    | 'single_club_count';
  targetName?: string;
  targetValue: number;
}

export interface DraftChallenge {
  id: string;
  title: string;
  subtitle: string;
  category: ChallengeCategory;
  categoryLabel: string;
  badgeColor: string; // Hex or gradient
  icon: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
  rewardXp: number;
  description: string;
  requirements: ChallengeRequirementDef[];
}

export interface EvaluatedRequirement {
  id: string;
  label: string;
  target: string;
  actual: string;
  met: boolean;
}

export interface ChallengeEvaluationResult {
  passed: boolean;
  challengeId: string;
  title: string;
  rewardXp: number;
  completedAt: number;
  requirements: EvaluatedRequirement[];
}

// ── CATALOG OF DRAFT CHALLENGES ─────────────────────────────

export const DRAFT_CHALLENGES: DraftChallenge[] = [
  // ── 1. NATIONS ───────────────────────────────────────────
  {
    id: 'nation_brazil',
    title: 'Samba Magic',
    subtitle: 'Draft 4+ Brazilians & 24+ Chem',
    category: 'nation',
    categoryLabel: 'Nations',
    badgeColor: '#10B981',
    icon: '🇧🇷',
    difficulty: 'MEDIUM',
    rewardXp: 500,
    description: 'Channel the Joga Bonito spirit by drafting 4 or more Brazilian stars into your Starting XI with at least 24 Chemistry.',
    requirements: [
      { id: 'brazil_req', label: 'Brazilian Players in XI', type: 'nation_count', targetName: 'Brazil', targetValue: 4 },
      { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 24 },
    ],
  },
  {
    id: 'nation_spain',
    title: 'La Furia Roja',
    subtitle: 'Draft 4+ Spaniards & 25+ Chem',
    category: 'nation',
    categoryLabel: 'Nations',
    badgeColor: '#EF4444',
    icon: '🇪🇸',
    difficulty: 'MEDIUM',
    rewardXp: 500,
    description: 'Assemble a Spanish midfield and defense core with pinpoint passing accuracy and 25+ synergy points.',
    requirements: [
      { id: 'spain_req', label: 'Spanish Players in XI', type: 'nation_count', targetName: 'Spain', targetValue: 4 },
      { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 25 },
    ],
  },
  {
    id: 'nation_england',
    title: 'Three Lions Core',
    subtitle: 'Draft 4+ English Stars & 24+ Chem',
    category: 'nation',
    categoryLabel: 'Nations',
    badgeColor: '#3B82F6',
    icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    difficulty: 'MEDIUM',
    rewardXp: 500,
    description: 'Build a formidable English backbone with Premier League grit and world-class talent.',
    requirements: [
      { id: 'england_req', label: 'English Players in XI', type: 'nation_count', targetName: 'England', targetValue: 4 },
      { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 24 },
    ],
  },
  {
    id: 'nation_france',
    title: 'Les Bleus Armada',
    subtitle: 'Draft 4+ French Stars & 25+ Chem',
    category: 'nation',
    categoryLabel: 'Nations',
    badgeColor: '#6366F1',
    icon: '🇫🇷',
    difficulty: 'MEDIUM',
    rewardXp: 500,
    description: 'Harness the elite speed, flair, and strength of France’s golden generation.',
    requirements: [
      { id: 'france_req', label: 'French Players in XI', type: 'nation_count', targetName: 'France', targetValue: 4 },
      { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 25 },
    ],
  },
  {
    id: 'nation_argentina',
    title: 'Albiceleste Tango',
    subtitle: 'Draft 3+ Argentinians & 84+ OVR',
    category: 'nation',
    categoryLabel: 'Nations',
    badgeColor: '#38BDF8',
    icon: '🇦🇷',
    difficulty: 'HARD',
    rewardXp: 650,
    description: 'Unleash World Champion flair by drafting 3+ Argentinian maestros while maintaining an 84+ overall squad rating.',
    requirements: [
      { id: 'arg_req', label: 'Argentinian Players in XI', type: 'nation_count', targetName: 'Argentina', targetValue: 3 },
      { id: 'rating_req', label: 'Minimum Squad Rating', type: 'min_rating', targetValue: 84 },
    ],
  },
  {
    id: 'nation_germany',
    title: 'Die Mannschaft Engine',
    subtitle: 'Draft 4+ Germans & 24+ Chem',
    category: 'nation',
    categoryLabel: 'Nations',
    badgeColor: '#F59E0B',
    icon: '🇩🇪',
    difficulty: 'MEDIUM',
    rewardXp: 550,
    description: 'Structure your squad around German tactical discipline, precise distribution, and high chemistry.',
    requirements: [
      { id: 'germany_req', label: 'German Players in XI', type: 'nation_count', targetName: 'Germany', targetValue: 4 },
      { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 24 },
    ],
  },
  {
    id: 'nation_portugal',
    title: 'Seleção das Quinas',
    subtitle: 'Draft 3+ Portuguese Stars & 25+ Chem',
    category: 'nation',
    categoryLabel: 'Nations',
    badgeColor: '#DC2626',
    icon: '🇵🇹',
    difficulty: 'MEDIUM',
    rewardXp: 550,
    description: 'Field explosive Portuguese wingers and playmakers to dominate the pitch.',
    requirements: [
      { id: 'portugal_req', label: 'Portuguese Players in XI', type: 'nation_count', targetName: 'Portugal', targetValue: 3 },
      { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 25 },
    ],
  },
  {
    id: 'nation_italy',
    title: 'Azzurri Fortress',
    subtitle: 'Draft 3+ Italians & 84+ OVR',
    category: 'nation',
    categoryLabel: 'Nations',
    badgeColor: '#2563EB',
    icon: '🇮🇹',
    difficulty: 'HARD',
    rewardXp: 650,
    description: 'Impenetrable tactical mastery! Anchor your team with 3+ Italian leaders and achieve 84+ OVR.',
    requirements: [
      { id: 'italy_req', label: 'Italian Players in XI', type: 'nation_count', targetName: 'Italy', targetValue: 3 },
      { id: 'rating_req', label: 'Minimum Squad Rating', type: 'min_rating', targetValue: 84 },
    ],
  },

  // ── 2. CLUBS & TEAMS ─────────────────────────────────────
  {
    id: 'club_clasico',
    title: 'El Clásico Royale',
    subtitle: '2+ Real Madrid & 2+ Barcelona Players',
    category: 'club',
    categoryLabel: 'Clubs',
    badgeColor: '#F59E0B',
    icon: '⚔️',
    difficulty: 'HARD',
    rewardXp: 750,
    description: 'Unite the greatest historic rivals! Slot at least 2 Real Madrid and 2 FC Barcelona superstars in the same Starting XI with 84+ OVR.',
    requirements: [
      { id: 'real_req', label: 'Real Madrid Stars', type: 'club_count', targetName: 'Real Madrid', targetValue: 2 },
      { id: 'barca_req', label: 'FC Barcelona Stars', type: 'club_count', targetName: 'Barcelona', targetValue: 2 },
      { id: 'rating_req', label: 'Minimum Squad Rating', type: 'min_rating', targetValue: 84 },
    ],
  },
  {
    id: 'club_real_madrid',
    title: 'Los Blancos Dynasty',
    subtitle: 'Draft 3+ Real Madrid & 85+ OVR',
    category: 'club',
    categoryLabel: 'Clubs',
    badgeColor: '#FCD34D',
    icon: '👑',
    difficulty: 'HARD',
    rewardXp: 650,
    description: 'Build around European royalty. Slot 3 or more Real Madrid galácticos and achieve 85+ OVR.',
    requirements: [
      { id: 'madrid_req', label: 'Real Madrid Players', type: 'club_count', targetName: 'Real Madrid', targetValue: 3 },
      { id: 'rating_req', label: 'Minimum Squad Rating', type: 'min_rating', targetValue: 85 },
    ],
  },
  {
    id: 'club_barcelona',
    title: 'Blaugrana Tiki-Taka',
    subtitle: 'Draft 3+ Barcelona & 26+ Chem',
    category: 'club',
    categoryLabel: 'Clubs',
    badgeColor: '#BE185D',
    icon: '🔴🔵',
    difficulty: 'HARD',
    rewardXp: 650,
    description: 'Bring positional play to life with 3+ FC Barcelona technicians and 26+ chemistry.',
    requirements: [
      { id: 'barca_req', label: 'Barcelona Players', type: 'club_count', targetName: 'Barcelona', targetValue: 3 },
      { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 26 },
    ],
  },
  {
    id: 'club_single_core',
    title: 'One Club Core',
    subtitle: '4+ Players from the Same Club',
    category: 'club',
    categoryLabel: 'Clubs',
    badgeColor: '#10B981',
    icon: '🏰',
    difficulty: 'HARD',
    rewardXp: 700,
    description: 'True dressing room chemistry! Have at least 4 starting players from the exact same club.',
    requirements: [
      { id: 'single_club_req', label: 'Players from 1 Single Club', type: 'single_club_count', targetValue: 4 },
      { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 24 },
    ],
  },
  {
    id: 'club_man_city',
    title: 'Cityzens Dominance',
    subtitle: 'Draft 3+ Manchester City & 85+ OVR',
    category: 'club',
    categoryLabel: 'Clubs',
    badgeColor: '#38BDF8',
    icon: '⚡',
    difficulty: 'HARD',
    rewardXp: 700,
    description: 'Harness relentless tactical possession by slotting 3+ Manchester City maestros with 85+ squad OVR.',
    requirements: [
      { id: 'mancity_req', label: 'Man City Players', type: 'club_count', targetName: 'Manchester City', targetValue: 3 },
      { id: 'rating_req', label: 'Minimum Squad Rating', type: 'min_rating', targetValue: 85 },
    ],
  },
  {
    id: 'club_arsenal',
    title: 'Gunners Vanguard',
    subtitle: 'Draft 3+ Arsenal Stars & 25+ Chem',
    category: 'club',
    categoryLabel: 'Clubs',
    badgeColor: '#EF4444',
    icon: '🔴',
    difficulty: 'MEDIUM',
    rewardXp: 600,
    description: 'Draft the core of North London with 3+ Arsenal stars and 25+ squad chemistry.',
    requirements: [
      { id: 'arsenal_req', label: 'Arsenal Players', type: 'club_count', targetName: 'Arsenal', targetValue: 3 },
      { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 25 },
    ],
  },
  {
    id: 'club_liverpool',
    title: 'Anfield Heavy Metal',
    subtitle: 'Draft 3+ Liverpool Stars & 25+ Chem',
    category: 'club',
    categoryLabel: 'Clubs',
    badgeColor: '#B91C1C',
    icon: '🦅',
    difficulty: 'MEDIUM',
    rewardXp: 600,
    description: 'High-octane Gegenpressing! Draft 3+ Liverpool standouts and hit 25+ chemistry.',
    requirements: [
      { id: 'liverpool_req', label: 'Liverpool Players', type: 'club_count', targetName: 'Liverpool', targetValue: 3 },
      { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 25 },
    ],
  },
  {
    id: 'club_bayern',
    title: 'Bavarian Machine',
    subtitle: 'Draft 3+ Bayern Munich & 85+ OVR',
    category: 'club',
    categoryLabel: 'Clubs',
    badgeColor: '#DC2626',
    icon: '🛡️',
    difficulty: 'HARD',
    rewardXp: 700,
    description: 'Channel powerhouse German efficiency with 3+ Bayern Munich players and 85+ squad rating.',
    requirements: [
      { id: 'bayern_req', label: 'Bayern Munich Players', type: 'club_count', targetName: 'Bayern', targetValue: 3 },
      { id: 'rating_req', label: 'Minimum Squad Rating', type: 'min_rating', targetValue: 85 },
    ],
  },
];

// ── PROCEDURAL LUCKY QUEST GENERATOR ─────────────────────────

const LUCKY_NATIONS = ['Brazil', 'Spain', 'England', 'France', 'Germany', 'Argentina', 'Portugal', 'Netherlands'];
const LUCKY_CLUBS = ['Real Madrid', 'Barcelona', 'Manchester City', 'Arsenal', 'Liverpool', 'Bayern Munich', 'AC Milan'];
const LUCKY_LEAGUES = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga'];

/**
 * Generates a completely randomized, unique lucky quest on demand (Nation or Club)
 */
export function generateLuckyChallenge(): DraftChallenge {
  const seed = Date.now();
  const roll = seed % 2; // 0 = Lucky Nation, 1 = Lucky Club

  if (roll === 0) {
    // Lucky Nation Quest
    const nation = LUCKY_NATIONS[Math.floor(Math.random() * LUCKY_NATIONS.length)];
    const targetCount = 3 + Math.floor(Math.random() * 2); // 3 or 4
    const targetChem = 22 + Math.floor(Math.random() * 5); // 22 to 26
    const rewardXp = 700;

    return {
      id: `lucky:nation:${nation}:${targetCount}:${targetChem}:${rewardXp}`,
      title: `Lucky Quest: ${nation} Pride`,
      subtitle: `Draft ${targetCount}+ ${nation} & ${targetChem}+ Chem`,
      category: 'lucky',
      categoryLabel: 'Lucky Roll',
      badgeColor: '#00F0FF',
      icon: '🎲',
      difficulty: 'MEDIUM',
      rewardXp,
      description: `Luck of the draw! Slot at least ${targetCount} players from ${nation} with a minimum of ${targetChem} squad chemistry.`,
      requirements: [
        { id: 'nation_req', label: `${nation} Players in XI`, type: 'nation_count', targetName: nation, targetValue: targetCount },
        { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: targetChem },
      ],
    };
  }

  // Lucky Club Quest
  const club = LUCKY_CLUBS[Math.floor(Math.random() * LUCKY_CLUBS.length)];
  const targetCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
  const targetRating = 83 + Math.floor(Math.random() * 3); // 83 to 85
  const rewardXp = 800;

  return {
    id: `lucky:club:${club}:${targetCount}:${targetRating}:${rewardXp}`,
    title: `Lucky Quest: ${club} Core`,
    subtitle: `Draft ${targetCount}+ ${club} & ${targetRating}+ OVR`,
    category: 'lucky',
    categoryLabel: 'Lucky Roll',
    badgeColor: '#F59E0B',
    icon: '🎲',
    difficulty: 'HARD',
    rewardXp,
    description: `Can fortune favor you? Draft ${targetCount}+ stars from ${club} and reach an overall rating of ${targetRating}+.`,
    requirements: [
      { id: 'club_req', label: `${club} Players in XI`, type: 'club_count', targetName: club, targetValue: targetCount },
      { id: 'rating_req', label: 'Minimum Squad Rating', type: 'min_rating', targetValue: targetRating },
    ],
  };
}

// ── EVALUATION ENGINE ────────────────────────────────────────

interface PlayerItemForEval {
  name?: string;
  nationName?: string;
  clubName?: string;
  league?: string;
}

/**
 * Checks whether a drafted Starting XI meets the objectives of a given challenge
 */
export function evaluateDraftChallenge(
  challenge: DraftChallenge,
  starters: Array<{ player: PlayerItemForEval | null }>,
  chemistryScore: number,
  squadRating: number,
): ChallengeEvaluationResult {
  const filledStarters = starters.map((s) => s.player).filter((p): p is PlayerItemForEval => Boolean(p));

  const evaluatedReqs: EvaluatedRequirement[] = challenge.requirements.map((req) => {
    switch (req.type) {
      case 'nation_count': {
        const count = filledStarters.filter(
          (p) => p.nationName?.toLowerCase() === req.targetName?.toLowerCase(),
        ).length;
        return {
          id: req.id,
          label: req.label,
          target: `${req.targetValue}+`,
          actual: `${count}`,
          met: count >= req.targetValue,
        };
      }
      case 'club_count': {
        const count = filledStarters.filter(
          (p) => p.clubName?.toLowerCase().includes((req.targetName || '').toLowerCase()),
        ).length;
        return {
          id: req.id,
          label: req.label,
          target: `${req.targetValue}+`,
          actual: `${count}`,
          met: count >= req.targetValue,
        };
      }
      case 'league_count': {
        const count = filledStarters.filter(
          (p) => p.league?.toLowerCase().includes((req.targetName || '').toLowerCase()),
        ).length;
        return {
          id: req.id,
          label: req.label,
          target: `${req.targetValue}+`,
          actual: `${count}`,
          met: count >= req.targetValue,
        };
      }
      case 'min_chem': {
        return {
          id: req.id,
          label: req.label,
          target: `${req.targetValue}`,
          actual: `${chemistryScore}`,
          met: chemistryScore >= req.targetValue,
        };
      }
      case 'min_rating': {
        return {
          id: req.id,
          label: req.label,
          target: `${req.targetValue}`,
          actual: `${squadRating}`,
          met: squadRating >= req.targetValue,
        };
      }
      case 'distinct_leagues': {
        const uniqueLeagues = new Set(filledStarters.map((p) => p.league).filter(Boolean));
        const count = uniqueLeagues.size;
        return {
          id: req.id,
          label: req.label,
          target: `${req.targetValue} Leagues`,
          actual: `${count} Leagues`,
          met: count === req.targetValue,
        };
      }
      case 'single_club_count': {
        const clubCounts: Record<string, number> = {};
        for (const p of filledStarters) {
          if (p.clubName) {
            clubCounts[p.clubName] = (clubCounts[p.clubName] || 0) + 1;
          }
        }
        const maxFromOneClub = Math.max(0, ...Object.values(clubCounts));
        return {
          id: req.id,
          label: req.label,
          target: `${req.targetValue}+ from 1 Club`,
          actual: `${maxFromOneClub}`,
          met: maxFromOneClub >= req.targetValue,
        };
      }
      default:
        return {
          id: req.id,
          label: req.label,
          target: `${req.targetValue}`,
          actual: '0',
          met: false,
        };
    }
  });

  const passed = evaluatedReqs.every((r) => r.met);

  return {
    passed,
    challengeId: challenge.id,
    title: challenge.title,
    rewardXp: challenge.rewardXp,
    completedAt: Date.now(),
    requirements: evaluatedReqs,
  };
}

/**
 * Finds challenge by ID or generates from lucky ID
 */
export function getChallengeById(challengeId?: string): DraftChallenge {
  if (!challengeId) return DRAFT_CHALLENGES[0];
  const found = DRAFT_CHALLENGES.find((c) => c.id === challengeId);
  if (found) return found;

  // If lucky generated id, reconstruct template
  if (challengeId.startsWith('lucky:')) {
    const parts = challengeId.split(':');
    const kind = parts[1];

    if (kind === 'nation') {
      const nation = parts[2] || 'Brazil';
      const targetCount = parseInt(parts[3], 10) || 4;
      const targetChem = parseInt(parts[4], 10) || 24;
      const rewardXp = parseInt(parts[5], 10) || 700;
      return {
        id: challengeId,
        title: `Lucky Quest: ${nation} Pride`,
        subtitle: `Draft ${targetCount}+ ${nation} & ${targetChem}+ Chem`,
        category: 'lucky',
        categoryLabel: 'Lucky Roll',
        badgeColor: '#00F0FF',
        icon: '🎲',
        difficulty: 'MEDIUM',
        rewardXp,
        description: `Luck of the draw! Slot at least ${targetCount} players from ${nation} with a minimum of ${targetChem} squad chemistry.`,
        requirements: [
          { id: 'nation_req', label: `${nation} Players in XI`, type: 'nation_count', targetName: nation, targetValue: targetCount },
          { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: targetChem },
        ],
      };
    }

    if (kind === 'club') {
      const club = parts[2] || 'Real Madrid';
      const targetCount = parseInt(parts[3], 10) || 2;
      const targetRating = parseInt(parts[4], 10) || 84;
      const rewardXp = parseInt(parts[5], 10) || 800;
      return {
        id: challengeId,
        title: `Lucky Quest: ${club} Core`,
        subtitle: `Draft ${targetCount}+ ${club} & ${targetRating}+ OVR`,
        category: 'lucky',
        categoryLabel: 'Lucky Roll',
        badgeColor: '#F59E0B',
        icon: '🎲',
        difficulty: 'HARD',
        rewardXp,
        description: `Can fortune favor you? Draft ${targetCount}+ stars from ${club} and reach an overall rating of ${targetRating}+.`,
        requirements: [
          { id: 'club_req', label: `${club} Players in XI`, type: 'club_count', targetName: club, targetValue: targetCount },
          { id: 'rating_req', label: 'Minimum Squad Rating', type: 'min_rating', targetValue: targetRating },
        ],
      };
    }

    if (kind === 'league') {
      const league = parts[2] || 'Premier League';
      const targetCount = parseInt(parts[3], 10) || 4;
      const targetChem = parseInt(parts[4], 10) || 25;
      const rewardXp = parseInt(parts[5], 10) || 750;
      return {
        id: challengeId,
        title: `Lucky Quest: ${league} Run`,
        subtitle: `Draft ${targetCount}+ ${league} & ${targetChem}+ Chem`,
        category: 'lucky',
        categoryLabel: 'Lucky Roll',
        badgeColor: '#10B981',
        icon: '🎲',
        difficulty: 'HARD',
        rewardXp,
        description: `Spin of destiny: draft ${targetCount}+ players from ${league} while keeping squad chemistry above ${targetChem}.`,
        requirements: [
          { id: 'league_req', label: `${league} Players in XI`, type: 'league_count', targetName: league, targetValue: targetCount },
          { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: targetChem },
        ],
      };
    }
  }

  if (challengeId.startsWith('lucky_')) {
    return {
      id: challengeId,
      title: 'Lucky Custom Quest',
      subtitle: 'Procedural Luck of the Draw',
      category: 'lucky',
      categoryLabel: 'Lucky Roll',
      badgeColor: '#00F0FF',
      icon: '🎲',
      difficulty: 'MEDIUM',
      rewardXp: 750,
      description: 'Procedural lucky challenge based on dynamic conditions.',
      requirements: [
        { id: 'chem_req', label: 'Minimum Chemistry', type: 'min_chem', targetValue: 24 },
        { id: 'rating_req', label: 'Minimum Squad Rating', type: 'min_rating', targetValue: 83 },
      ],
    };
  }

  return DRAFT_CHALLENGES[0];
}
