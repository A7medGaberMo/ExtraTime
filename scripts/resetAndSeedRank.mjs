import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const isProd = process.argv.includes('--prod');
const prodUrl = 'https://wary-pig-127.convex.cloud';
const devUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://shocking-woodpecker-506.convex.cloud';
const url = isProd ? prodUrl : devUrl;

const client = new ConvexHttpClient(url);
console.log(`\n=============================================================`);
console.log(`🔄 RESETTING & SEEDING RANK QUESTIONS [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
console.log(`🔗 Convex URL: ${url}`);
console.log(`🛡️  Target Table: "rankQuestions" ONLY (No other tables touched)`);
console.log(`=============================================================\n`);

async function resetAndSeed() {
  const overallStart = Date.now();

  try {
    // 1. Clear rankQuestions table
    console.log(`⏳ Step 1: Clearing existing rankQuestions table...`);
    const clearRes = await client.mutation('rank/mutations:clearQuestionBank', {});
    console.log(`   ✅ Cleared ${clearRes.deleted} old questions.\n`);

    // 2. Seed clean rank questions
    console.log(`⏳ Step 2: Seeding verified, clean question bank...`);
    const seedRes = await client.mutation('rank/mutations:seedQuestionBank', {});
    console.log(`   ✅ Seeded ${seedRes.total} questions (${seedRes.inserted} newly inserted).\n`);

    console.log(`=============================================================`);
    console.log(`🎉 RANK QUESTIONS RESET & SEED COMPLETED in ${((Date.now() - overallStart) / 1000).toFixed(2)}s`);
    console.log(`=============================================================\n`);
  } catch (err) {
    console.error('❌ Failed during Rank reset & seed:', err.message);
    process.exit(1);
  }
}

resetAndSeed();
