export interface CardDelta {
  answerKey: string;
  submittedRank: number; // 1 to 5
  actualRank: number;    // 1 to 5
  delta: number;         // Math.abs(submittedRank - actualRank)
  points: number;        // +2, +1, 0, -1, -2
}

export interface RoundScoreResult {
  cardDeltas: CardDelta[];
  roundScore: number; // -10 to +10
  perfectCount: number; // 0 to 5
  isPerfect: boolean;
  secondsRemaining: number;
}

/**
 * Authoritative scoring engine for Rank Game.
 * Points per card: 2 - abs(submittedRank - actualRank)
 * Range: -10 to +10 per round.
 */
export function scoreRoundSubmission(
  submittedOrder: string[], // Array of 5 answerKeys
  answers: Array<{ answerKey: string; value: number }>,
  direction: "desc" | "asc",
  secondsRemaining: number
): RoundScoreResult {
  // 1. Sort canonical answers strictly by value according to direction
  const sorted = [...answers].sort((a, b) =>
    direction === "desc" ? b.value - a.value : a.value - b.value
  );

  const actualRankMap = new Map<string, number>();
  sorted.forEach((item, index) => {
    actualRankMap.set(item.answerKey, index + 1);
  });

  let roundScore = 0;
  let perfectCount = 0;

  const cardDeltas: CardDelta[] = submittedOrder.map((key, index) => {
    const submittedRank = index + 1;
    const actualRank = actualRankMap.get(key) ?? 1;
    const delta = Math.abs(submittedRank - actualRank);

    // Standard negative scoring formula: 2 - delta
    const points = 2 - delta;
    roundScore += points;

    if (delta === 0) {
      perfectCount++;
    }

    return {
      answerKey: key,
      submittedRank,
      actualRank,
      delta,
      points,
    };
  });

  return {
    cardDeltas,
    roundScore,
    perfectCount,
    isPerfect: perfectCount === 5,
    secondsRemaining: Math.max(0, secondsRemaining),
  };
}
