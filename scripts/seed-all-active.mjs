import { ConvexHttpClient } from "convex/browser";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { api } from "../convex/_generated/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://shocking-woodpecker-506.convex.cloud";
console.log(`Connecting to Convex at: ${convexUrl}`);

const client = new ConvexHttpClient(convexUrl);

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".json") && file !== "README.md") {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const activeDir = path.join(__dirname, "../data/players/active");
const jsonFiles = getAllFiles(activeDir);

const legendsPath = path.join(__dirname, "../data/players/legends/legends.json");
let allPlayers = [];

if (readdirSync(path.join(__dirname, "../data/players/legends")).includes("legends.json")) {
  const legends = JSON.parse(readFileSync(legendsPath, "utf-8"));
  allPlayers.push(...legends);
}

for (const filePath of jsonFiles) {
  const fileContent = JSON.parse(readFileSync(filePath, "utf-8"));
  if (fileContent.players && Array.isArray(fileContent.players)) {
    for (const p of fileContent.players) {
      allPlayers.push({
        name: p.name,
        position: p.position || "CM",
        club: p.club || fileContent.club?.name || "Unknown Club",
        nation: p.nation || "Unknown",
        league: fileContent.club?.league,
        tier: p.tier && p.tier.trim() ? p.tier : "GOLD",
        isLegend: !!p.isLegend,
        apiId: p.apiId ? String(p.apiId) : undefined,
        imageUrl: p.imageUrl || undefined,
        kitNumber: typeof p.kitNumber === "number" ? p.kitNumber : undefined,
      });
    }
  }
}

const sanitizedPlayers = allPlayers.map((p) => ({
  name: p.name,
  position: p.position || "CM",
  club: p.club || "Unknown Club",
  nation: p.nation || "Unknown",
  league: p.league,
  tier: p.tier && p.tier.trim() ? p.tier : "GOLD",
  isLegend: !!p.isLegend,
  apiId: p.apiId ? String(p.apiId) : undefined,
  imageUrl: p.imageUrl || undefined,
  kitNumber: typeof p.kitNumber === "number" ? p.kitNumber : undefined,
}));

console.log(`Collected ${sanitizedPlayers.length} total players across active & legends.`);
console.log("Sending complete seed payload to Convex...");

try {
  const result = await client.mutation(api.seed.seedData.seedAllData, { players: sanitizedPlayers });
  console.log("Seeding successful:", JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Seeding failed:", error);
  process.exit(1);
}
