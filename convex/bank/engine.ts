import { GenericMutationCtx } from 'convex/server';
import { DataModel, Id, Doc } from '../_generated/dataModel';

export const RECENT_QUESTION_HISTORY_CAP = 120;
export const RUN_DURATION_MS = 90_000;
export const SUDDEN_DEATH_DURATION_MS = 15_000;

export function calculateLadderPoints(streak: number): number {
  if (streak <= 0) return 0;
  return Math.pow(2, streak - 1);
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface RunQuestionsPartition {
  run1: Id<'bankQuestions'>[];
  run2?: Id<'bankQuestions'>[];
  run3?: Id<'bankQuestions'>[];
  run4?: Id<'bankQuestions'>[];
}

/**
 * Formats a 12-question run:
 * 4 Easy (3 MCQ, 1 TF), 4 Medium (3 MCQ, 1 TF), 4 Hard (3 MCQ, 1 TF)
 * Shuffles ALL 12 questions together so difficulty is dynamically intermingled and exciting.
 */
export function assemble12QuestionRun(
  easyMcq: Id<'bankQuestions'>[],
  easyTf: Id<'bankQuestions'>[],
  medMcq: Id<'bankQuestions'>[],
  medTf: Id<'bankQuestions'>[],
  hardMcq: Id<'bankQuestions'>[],
  hardTf: Id<'bankQuestions'>[]
): Id<'bankQuestions'>[] {
  const combined = [
    ...easyMcq,
    ...easyTf,
    ...medMcq,
    ...medTf,
    ...hardMcq,
    ...hardTf,
  ];
  if (combined.length === 0) return [];
  // Ensure array is padded to exactly 12 questions if underfilled
  while (combined.length < 12) {
    combined.push(combined[combined.length % combined.length]);
  }
  return shuffleArray(combined.slice(0, 12));
}

/**
 * Stratified Question Allocation Engine.
 * Ensures disjoint sets of questions adhering to difficulty & type template.
 * Leverages guestSeenQuestionsTable to prevent repeats within 120-question window.
 */
export async function allocateStratifiedQuestions(
  ctx: GenericMutationCtx<DataModel>,
  participantIds: Id<'guestUsers'>[],
  isDuel: boolean
): Promise<{ runs: Id<'bankQuestions'>[][]; allSelectedIds: Id<'bankQuestions'>[] }> {
  // 1. Gather recently seen questions for all participants
  const seenQuestionIds = new Set<string>();
  for (const guestId of participantIds) {
    const history = await ctx.db
      .query('guestQuestionHistory')
      .withIndex('by_guest', (q) => q.eq('guestId', guestId))
      .first();

    if (history?.bankSeenIds) {
      for (const id of history.bankSeenIds) {
        seenQuestionIds.add(id);
      }
    }
  }

  // 2. Fetch active questions by bucket (bounded limit to prevent unbounded memory scans)
  const fetchBucket = async (difficulty: 'easy' | 'medium' | 'hard', type: 'mcq' | 'tf') => {
    const r = Math.random();
    let questions = await ctx.db
      .query('bankQuestions')
      .withIndex('by_difficulty_type_random', (q) =>
        q.eq('isActive', true).eq('difficulty', difficulty).eq('type', type).gte('randomKey', r)
      )
      .take(80);

    if (questions.length < 80) {
      const wrapAround = await ctx.db
        .query('bankQuestions')
        .withIndex('by_difficulty_type_random', (q) =>
          q.eq('isActive', true).eq('difficulty', difficulty).eq('type', type).lt('randomKey', r)
        )
        .take(80 - questions.length);
      questions = [...questions, ...wrapAround];
    }
    return questions;
  };

  const [easyMcqAll, easyTfAll, medMcqAll, medTfAll, hardMcqAll, hardTfAll] = await Promise.all([
    fetchBucket('easy', 'mcq'),
    fetchBucket('easy', 'tf'),
    fetchBucket('medium', 'mcq'),
    fetchBucket('medium', 'tf'),
    fetchBucket('hard', 'mcq'),
    fetchBucket('hard', 'tf'),
  ]);

  const runsCount = isDuel ? 4 : 1;
  const reqEasyMcq = 3 * runsCount;
  const reqEasyTf = 1 * runsCount;
  const reqMedMcq = 3 * runsCount;
  const reqMedTf = 1 * runsCount;
  const reqHardMcq = 3 * runsCount;
  const reqHardTf = 1 * runsCount;

  // Helper to pick candidates prioritizing unseen with safe looping fallback
  const pickBucketItems = (
    pool: Doc<'bankQuestions'>[],
    neededCount: number
  ): Id<'bankQuestions'>[] => {
    if (pool.length === 0) return [];
    const unseen = pool.filter((q) => !seenQuestionIds.has(q._id));
    const shuffledUnseen = shuffleArray(unseen);

    if (shuffledUnseen.length >= neededCount) {
      return shuffledUnseen.slice(0, neededCount).map((q) => q._id);
    }

    // Fallback: blend unseen with least recently seen
    const seen = pool.filter((q) => seenQuestionIds.has(q._id));
    const shuffledSeen = shuffleArray(seen);
    const combined = [...shuffledUnseen, ...shuffledSeen];
    if (combined.length >= neededCount) {
      return combined.slice(0, neededCount).map((q) => q._id);
    }

    // Pool smaller than needed: wrap around to guarantee neededCount
    const result: Id<'bankQuestions'>[] = combined.map((q) => q._id);
    while (result.length < neededCount && pool.length > 0) {
      result.push(pool[result.length % pool.length]._id);
    }
    return result;
  };

  const pickedEasyMcq = pickBucketItems(easyMcqAll, reqEasyMcq);
  const pickedEasyTf = pickBucketItems(easyTfAll, reqEasyTf);
  const pickedMedMcq = pickBucketItems(medMcqAll, reqMedMcq);
  const pickedMedTf = pickBucketItems(medTfAll, reqMedTf);
  const pickedHardMcq = pickBucketItems(hardMcqAll, reqHardMcq);
  const pickedHardTf = pickBucketItems(hardTfAll, reqHardTf);

  const runs: Id<'bankQuestions'>[][] = [];
  const allSelectedIds: Id<'bankQuestions'>[] = [];

  for (let r = 0; r < runsCount; r++) {
    const runEasyMcq = pickedEasyMcq.slice(r * 3, (r + 1) * 3);
    const runEasyTf = pickedEasyTf.slice(r * 1, (r + 1) * 1);
    const runMedMcq = pickedMedMcq.slice(r * 3, (r + 1) * 3);
    const runMedTf = pickedMedTf.slice(r * 1, (r + 1) * 1);
    const runHardMcq = pickedHardMcq.slice(r * 3, (r + 1) * 3);
    const runHardTf = pickedHardTf.slice(r * 1, (r + 1) * 1);

    const runQuestions = assemble12QuestionRun(
      runEasyMcq,
      runEasyTf,
      runMedMcq,
      runMedTf,
      runHardMcq,
      runHardTf
    );

    runs.push(runQuestions);
    allSelectedIds.push(...runQuestions);
  }

  // Record questions seen for participants and prune history past 120
  for (const guestId of participantIds) {
    const history = await ctx.db
      .query('guestQuestionHistory')
      .withIndex('by_guest', (q) => q.eq('guestId', guestId))
      .first();

    const currentSeen = history?.bankSeenIds || [];
    const merged = Array.from(new Set([...allSelectedIds, ...currentSeen]));
    const trimmed = merged.slice(0, RECENT_QUESTION_HISTORY_CAP);

    if (history) {
      await ctx.db.patch(history._id, { bankSeenIds: trimmed });
    } else {
      await ctx.db.insert('guestQuestionHistory', {
        guestId,
        bankSeenIds: trimmed,
        rankSeenIds: [],
      });
    }
  }

  return { runs, allSelectedIds };
}

/**
 * Generates a 6-character room code.
 */
export function generateBankRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function normalizeBankRoomCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
}
