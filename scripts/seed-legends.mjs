import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { api } from "../convex/_generated/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://shocking-woodpecker-506.convex.cloud";
console.log(`Connecting to Convex at: ${convexUrl}`);

const client = new ConvexHttpClient(convexUrl);
const legendsPath = path.join(__dirname, "../data/players/legends/legends.json");
const legendsData = JSON.parse(readFileSync(legendsPath, "utf-8"));

console.log(`Found ${legendsData.length} legend players.`);
console.log("Sending seed request to Convex...");

try {
  const result = await client.mutation(api.seed.seedData.seedAllData, { players: legendsData });
  console.log("Seeding successful.", JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Seeding failed:", error);
  process.exit(1);
}
