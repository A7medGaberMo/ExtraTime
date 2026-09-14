import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const isProd = process.argv.includes('--prod');
const prodUrl = 'https://wary-pig-127.convex.cloud';
const devUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://shocking-woodpecker-506.convex.cloud';
const url = isProd ? prodUrl : devUrl;

const client = new ConvexHttpClient(url);
console.log(`\n🗑️  Clearing ONLY rankQuestions table from Convex [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
console.log('🔗 Target Convex URL:', url);
console.log('🛡️  Safety check: No other tables (users, games, stats) will be touched.\n');

async function clearRankTableOnly() {
  const startTime = Date.now();
  try {
    const res = await client.mutation('rank/mutations:clearQuestionBank', {});
    console.log(`✅ Success: Purged ONLY "rankQuestions" table.`);
    console.log(`   - Deleted questions: ${res.deleted}`);
    console.log(`   - Time taken: ${((Date.now() - startTime) / 1000).toFixed(2)}s\n`);
  } catch (err) {
    console.error('❌ Failed to clear rankQuestions:', err.message);
    process.exit(1);
  }
}

clearRankTableOnly();
