import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const isProd = process.argv.includes('--prod');
const prodUrl = 'https://wary-pig-127.convex.cloud';
const devUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://shocking-woodpecker-506.convex.cloud';
const url = isProd ? prodUrl : devUrl;

const client = new ConvexHttpClient(url);
console.log(`⚡ Seeding Rank Question Bank to Convex [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
console.log('🔗 Connecting to Convex at:', url);

async function seedRankQuestions() {
  const startTime = Date.now();
  try {
    const res = await client.mutation('rank/mutations:seedQuestionBank', {});
    console.log('\n🎉 Question Bank Synced Successfully:');
    console.log(`   - Total Questions: ${res.total}`);
    console.log(`   - Inserted: ${res.inserted}`);
    console.log(`   - Updated: ${res.updated}`);
    console.log(`   - Deleted (stale): ${res.deleted}`);
    console.log(`   - Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  } catch (err) {
    console.error('❌ Failed to seed Rank Question Bank:', err.message);
    process.exit(1);
  }
}

seedRankQuestions();
