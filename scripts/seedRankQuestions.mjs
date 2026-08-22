import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const isProd = process.argv.includes('--prod');
const defaultProdUrl = 'https://wary-pig-127.convex.cloud';
const url = process.env.CONVEX_URL || (isProd ? (process.env.NEXT_PUBLIC_CONVEX_PROD_URL || defaultProdUrl) : process.env.NEXT_PUBLIC_CONVEX_URL);

if (!url) {
  console.error('❌ Missing Convex URL in environment variables or arguments.');
  process.exit(1);
}

const client = new ConvexHttpClient(url);
console.log(`⚡ Seeding Rank Game Questions to Convex [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]...`);
console.log('🔗 Connecting to Convex at:', url);

async function run() {
  try {
    const result = await client.mutation('rank/mutations:seedQuestionBank', {});
    console.log('✅ Rank Game Question Bank Seeded Successfully!');
    console.log('📊 Result:', result);
  } catch (err) {
    console.error('❌ Error seeding questions:', err);
    process.exit(1);
  }
}

run();
