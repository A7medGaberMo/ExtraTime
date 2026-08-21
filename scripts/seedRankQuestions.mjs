import { ConvexHttpClient } from 'convex/browser';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  console.error('❌ Missing NEXT_PUBLIC_CONVEX_URL in .env.local');
  process.exit(1);
}

const client = new ConvexHttpClient(url);
console.log('⚡ Seeding Rank Game Questions to Convex...');
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
