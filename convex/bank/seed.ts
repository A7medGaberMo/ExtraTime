import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import questionsData from '../../data/bank/questions.json';

export const seedBankQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('bankQuestions').collect();
    const existingMap = new Map(existing.map((q) => [q.question.en.trim().toLowerCase(), q]));

    let inserted = 0;
    let updated = 0;

    for (const q of questionsData) {
      const key = q.question.en.trim().toLowerCase();
      const existingDoc = existingMap.get(key);

      const doc = {
        question: q.question,
        options: q.options as { id: string; text: { en: string; ar: string } }[],
        correctId: q.correctId,
        type: q.type as 'mcq' | 'tf',
        category: q.category,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        isActive: true,
      };

      if (existingDoc) {
        await ctx.db.patch(existingDoc._id, doc);
        updated++;
      } else {
        await ctx.db.insert('bankQuestions', doc);
        inserted++;
      }
    }

    // Clean up questions removed from seed bank
    const validQuestions = new Set(questionsData.map((q) => q.question.en.trim().toLowerCase()));
    let deleted = 0;
    for (const dbQ of existing) {
      if (!validQuestions.has(dbQ.question.en.trim().toLowerCase())) {
        await ctx.db.delete(dbQ._id);
        deleted++;
      }
    }

    return { total: questionsData.length, inserted, updated, deleted };
  },
});

/**
 * Seeds ONLY NEW bank questions without updating or deleting existing records.
 */
export const seedNewBankQuestionsOnly = mutation({
  args: {
    questions: v.optional(
      v.array(
        v.object({
          question: v.object({ en: v.string(), ar: v.string() }),
          options: v.array(
            v.object({
              id: v.string(),
              text: v.object({ en: v.string(), ar: v.string() }),
            })
          ),
          correctId: v.string(),
          type: v.union(v.literal('mcq'), v.literal('tf')),
          category: v.optional(v.string()),
          difficulty: v.union(v.literal('easy'), v.literal('medium'), v.literal('hard')),
          isActive: v.optional(v.boolean()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listToSeed = args.questions ?? (questionsData as any[]);
    const existing = await ctx.db.query('bankQuestions').collect();
    const existingSet = new Set(existing.map((q) => q.question.en.trim().toLowerCase()));

    let inserted = 0;
    let skipped = 0;

    for (const q of listToSeed) {
      const key = q.question.en.trim().toLowerCase();
      if (existingSet.has(key)) {
        skipped++;
        continue;
      }

      const doc = {
        question: q.question,
        options: q.options as { id: string; text: { en: string; ar: string } }[],
        correctId: q.correctId,
        type: q.type as 'mcq' | 'tf',
        category: q.category,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        isActive: q.isActive ?? true,
      };

      await ctx.db.insert('bankQuestions', doc);
      existingSet.add(key);
      inserted++;
    }

    // Explicitly guarantee no deletions of existing database records
    return { totalReceived: listToSeed.length, inserted, skipped };
  },
});


export const clearBankQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('bankQuestions').collect();
    for (const q of all) {
      await ctx.db.delete(q._id);
    }
    return { deleted: all.length };
  },
});
