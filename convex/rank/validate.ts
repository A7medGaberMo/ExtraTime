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
  stat: { en: string; ar: string };
}

export interface RankQuestionInput {
  title: { en: string; ar: string };
  subtitle?: { en: string; ar: string };
  category?: string;
  answers: RankAnswerInput[];
  isActive?: boolean;
}

export function validateRankQuestion(q: RankQuestionInput): { valid: boolean; error?: string } {
  const identifier = q.title?.en || "Untitled Question";

  // 1. Must have exactly 5 answers
  if (!q.answers || q.answers.length !== 5) {
    return { valid: false, error: `[${identifier}] Must have exactly 5 answers, found ${q.answers?.length ?? 0}` };
  }

  // 2. Bilingual string checks
  if (!q.title?.en?.trim() || !q.title?.ar?.trim()) {
    return { valid: false, error: `[${identifier}] Missing title in English or Arabic` };
  }
  if (q.subtitle && (!q.subtitle.en?.trim() || !q.subtitle.ar?.trim())) {
    return { valid: false, error: `[${identifier}] Incomplete bilingual subtitle` };
  }

  for (const ans of q.answers) {
    if (!ans.answerKey?.trim()) {
      return { valid: false, error: `[${identifier}] Missing answerKey for answer item` };
    }
    if (!ans.name?.en?.trim() || !ans.name?.ar?.trim()) {
      return { valid: false, error: `[${identifier}] Missing name in English or Arabic for answer key ${ans.answerKey}` };
    }
    if (!ans.stat?.en?.trim() || !ans.stat?.ar?.trim()) {
      return { valid: false, error: `[${identifier}] Missing stat in English or Arabic for answer key ${ans.answerKey}` };
    }
  }

  // 3. Duplicate answer keys
  const keys = q.answers.map((a) => a.answerKey);
  if (new Set(keys).size !== 5) {
    return { valid: false, error: `[${identifier}] Duplicate answer keys detected: ${keys.join(", ")}` };
  }

  return { valid: true };
}

export function validateQuestionBank(bank: RankQuestionInput[]): void {
  const titles = new Set<string>();
  for (const q of bank) {
    const key = q.title?.en?.trim().toLowerCase();
    if (titles.has(key)) {
      throw new Error(`Duplicate question title found in bank: "${q.title.en}"`);
    }
    titles.add(key);

    const check = validateRankQuestion(q);
    if (!check.valid) {
      throw new Error(check.error);
    }
  }
}
