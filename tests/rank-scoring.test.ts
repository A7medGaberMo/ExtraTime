import { describe, it, expect } from "vitest";
import { scoreRoundSubmission } from "../convex/rank/scoring";
import { validateRankQuestion, validateQuestionBank } from "../convex/rank/validate";
import { allRankSeedQuestions } from "../convex/rank/seedData";
import { Id } from "../convex/_generated/dataModel";

describe("Rank Game Scoring Engine", () => {
  const sampleAnswers = [
    { answerKey: "ans_1" },
    { answerKey: "ans_2" },
    { answerKey: "ans_3" },
    { answerKey: "ans_4" },
    { answerKey: "ans_5" },
  ];

  it("should return +10 for perfect exact ordering", () => {
    const submitted = ["ans_1", "ans_2", "ans_3", "ans_4", "ans_5"];
    const result = scoreRoundSubmission(submitted, sampleAnswers, 30);

    expect(result.roundScore).toBe(10);
    expect(result.perfectCount).toBe(5);
    expect(result.isPerfect).toBe(true);
    expect(result.cardDeltas.every((d) => d.points === 2)).toBe(true);
  });

  it("should return -2 for reversed ordering with distance penalty", () => {
    const submitted = ["ans_5", "ans_4", "ans_3", "ans_2", "ans_1"];
    const result = scoreRoundSubmission(submitted, sampleAnswers, 10);
    expect(result.roundScore).toBe(-2);
  });

  it("should calculate adjacent off-by-1 offsets (+1 pt)", () => {
    const submitted = ["ans_2", "ans_1", "ans_3", "ans_4", "ans_5"];
    const result = scoreRoundSubmission(submitted, sampleAnswers, 25);

    expect(result.roundScore).toBe(8);
    expect(result.perfectCount).toBe(3);
    expect(result.isPerfect).toBe(false);
  });
});

describe("Tiebreaker Calculation Engine", () => {
  it("should calculate winner based on cumulative remaining seconds from round history", () => {
    const roundHistory = [
      {
        roundIndex: 0,
        questionId: "q1" as unknown as Id<"rankQuestions">,
        resolvedOrder: ["a", "b", "c", "d", "e"],
        results: [
          { guestId: "player1" as unknown as Id<"guestUsers">, submittedOrder: ["a"], roundScore: 8, secondsRemaining: 30, cardDeltas: [] },
          { guestId: "player2" as unknown as Id<"guestUsers">, submittedOrder: ["a"], roundScore: 8, secondsRemaining: 20, cardDeltas: [] },
        ],
      },
      {
        roundIndex: 1,
        questionId: "q2" as unknown as Id<"rankQuestions">,
        resolvedOrder: ["a", "b", "c", "d", "e"],
        results: [
          { guestId: "player1" as unknown as Id<"guestUsers">, submittedOrder: ["a"], roundScore: 6, secondsRemaining: 15, cardDeltas: [] },
          { guestId: "player2" as unknown as Id<"guestUsers">, submittedOrder: ["a"], roundScore: 6, secondsRemaining: 32, cardDeltas: [] },
        ],
      },
    ];

    const participants = [
      { guestId: "player1", totalScore: 14 },
      { guestId: "player2", totalScore: 14 },
    ];

    // Compute cumulative seconds
    const stats = participants.map((p) => {
      let totalTiebreak = 0;
      for (const r of roundHistory) {
        const res = r.results.find((x) => (x.guestId as unknown as string) === p.guestId);
        if (res) totalTiebreak += res.secondsRemaining;
      }
      return { guestId: p.guestId, totalScore: p.totalScore, totalTiebreak };
    });

    stats.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.totalTiebreak - a.totalTiebreak;
    });

    // Player 2 total tiebreak = 20 + 32 = 52. Player 1 total tiebreak = 30 + 15 = 45.
    expect(stats[0].guestId).toBe("player2");
    expect(stats[0].totalTiebreak).toBe(52);
    expect(stats[1].totalTiebreak).toBe(45);
  });
});

describe("Rank Question Validation Pipeline", () => {
  it("should validate all questions in the seedData bank without errors", () => {
    expect(allRankSeedQuestions.length).toBeGreaterThan(0);
    expect(() => validateQuestionBank(allRankSeedQuestions)).not.toThrow();
  });

  it("should reject question with duplicate answer keys", () => {
    const invalidQuestion = {
      title: { en: "Test", ar: "اختبار" },
      category: "clubs",
      answers: [
        {
          answerKey: "a1",
          name: { en: "A1", ar: "أ1" },
          media: { type: "club" as const },
          stat: { en: "10", ar: "10" },
        },
        {
          answerKey: "a1", // DUPLICATE KEY!
          name: { en: "A2", ar: "أ2" },
          media: { type: "club" as const },
          stat: { en: "8", ar: "8" },
        },
        {
          answerKey: "a3",
          name: { en: "A3", ar: "أ3" },
          media: { type: "club" as const },
          stat: { en: "6", ar: "6" },
        },
        {
          answerKey: "a4",
          name: { en: "A4", ar: "أ4" },
          media: { type: "club" as const },
          stat: { en: "4", ar: "4" },
        },
        {
          answerKey: "a5",
          name: { en: "A5", ar: "أ5" },
          media: { type: "club" as const },
          stat: { en: "2", ar: "2" },
        },
      ],
    };

    const check = validateRankQuestion(invalidQuestion);
    expect(check.valid).toBe(false);
    expect(check.error).toContain("Duplicate answer keys detected");
  });
});
