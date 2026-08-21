export interface RankAnswerInput {
  answerKey: string;
  name: { en: string; ar: string };
  subText?: { en: string; ar: string };
  media: {
    type: "player" | "club" | "nation" | "tournament" | "custom" | "stint";
    primaryUrl?: string;
    secondaryBadgeUrl?: string;
    fallbackText?: string;
    entityId?: string;
    stintBadge?: {
      clubName: string;
      season?: string;
    };
  };
  value: number;
  valueLabel: { en: string; ar: string };
  correctRank: number;
}

export interface RankQuestionInput {
  slug: string;
  scopeType: "ALL_TIME" | "PER_SEASON" | "PER_CLUB" | "PER_COMPETITION" | "PLAYER_STINTS" | "TRANSFERS_MARKET";
  title: { en: string; ar: string };
  subtitle?: { en: string; ar: string };
  metricLabel: { en: string; ar: string };
  direction: "desc" | "asc";
  difficulty: "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";
  answers: RankAnswerInput[];
  asOfDate: string;
  isActive: boolean;
  tags: string[];
}

export function validateRankQuestion(q: RankQuestionInput): { valid: boolean; error?: string } {
  // 1. Must have exactly 5 answers
  if (!q.answers || q.answers.length !== 5) {
    return { valid: false, error: `[${q.slug}] Must have exactly 5 answers, found ${q.answers?.length ?? 0}` };
  }

  // 2. Bilingual string checks
  if (!q.title?.en?.trim() || !q.title?.ar?.trim()) {
    return { valid: false, error: `[${q.slug}] Missing title in English or Arabic` };
  }
  if (q.subtitle && (!q.subtitle.en?.trim() || !q.subtitle.ar?.trim())) {
    return { valid: false, error: `[${q.slug}] Incomplete bilingual subtitle` };
  }
  if (!q.metricLabel?.en?.trim() || !q.metricLabel?.ar?.trim()) {
    return { valid: false, error: `[${q.slug}] Missing metricLabel in English or Arabic` };
  }

  for (const ans of q.answers) {
    if (!ans.name?.en?.trim() || !ans.name?.ar?.trim()) {
      return { valid: false, error: `[${q.slug}] Missing name in English or Arabic for answer key ${ans.answerKey}` };
    }
    if (!ans.valueLabel?.en?.trim() || !ans.valueLabel?.ar?.trim()) {
      return { valid: false, error: `[${q.slug}] Missing valueLabel in English or Arabic for answer key ${ans.answerKey}` };
    }
  }

  // 3. Strict Monotonicity Invariant (Zero ties allowed!)
  const values = q.answers.map((a) => a.value);
  const uniqueValues = new Set(values);
  if (uniqueValues.size !== 5) {
    const duplicates = values.filter((v, idx) => values.indexOf(v) !== idx);
    return {
      valid: false,
      error: `[${q.slug}] Invariant Violation: Found duplicate values [${duplicates.join(", ")}]. All 5 items must have strictly distinct values!`,
    };
  }

  // 4. Duplicate answer keys
  const keys = q.answers.map((a) => a.answerKey);
  if (new Set(keys).size !== 5) {
    return { valid: false, error: `[${q.slug}] Duplicate answer keys detected: ${keys.join(", ")}` };
  }

  // 5. Correct Rank Matching
  const sorted = [...q.answers].sort((a, b) =>
    q.direction === "desc" ? b.value - a.value : a.value - b.value
  );

  for (let i = 0; i < sorted.length; i++) {
    const expectedRank = i + 1;
    if (sorted[i].correctRank !== expectedRank) {
      return {
        valid: false,
        error: `[${q.slug}] Rank mismatch for answer ${sorted[i].answerKey}. Stored correctRank is ${sorted[i].correctRank}, expected ${expectedRank}.`,
      };
    }
  }

  return { valid: true };
}

export function validateQuestionBank(bank: RankQuestionInput[]): void {
  const slugs = new Set<string>();
  for (const q of bank) {
    if (slugs.has(q.slug)) {
      throw new Error(`Duplicate question slug found in bank: ${q.slug}`);
    }
    slugs.add(q.slug);

    const check = validateRankQuestion(q);
    if (!check.valid) {
      throw new Error(check.error);
    }
  }
}
