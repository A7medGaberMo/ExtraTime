import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const isProd = process.argv.includes('--prod');
const prodUrl = 'https://wary-pig-127.convex.cloud';
const devUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://shocking-woodpecker-506.convex.cloud';
const url = isProd ? prodUrl : devUrl;

const client = new ConvexHttpClient(url);
console.log(`\n⚡ Seeding clean Rank Question Bank to Convex [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
console.log('🔗 Target Convex URL:', url);
console.log('🛡️  Safety check: Only "rankQuestions" table will be written.\n');

async function seedRankQuestionsOnly() {
  const startTime = Date.now();
  try {
    const res = await client.mutation('rank/mutations:seedQuestionBank', {});
    console.log(`🎉 Rank Questions Synced Successfully:`);
    console.log(`   - Total in Bank: ${res.total}`);
    console.log(`   - Inserted: ${res.inserted}`);
    console.log(`   - Updated: ${res.updated}`);
    console.log(`   - Stale Removed: ${res.deleted}`);
    console.log(`   - Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)}s\n`);
  } catch (err) {
    console.error('❌ Failed to seed Rank Question Bank:', err.message);
    process.exit(1);
  }
}

seedRankQuestionsOnly();
