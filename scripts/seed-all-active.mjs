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
let rawPlayers = [];

if (readdirSync(path.join(__dirname, "../data/players/legends")).includes("legends.json")) {
  const legends = JSON.parse(readFileSync(legendsPath, "utf-8"));
  rawPlayers.push(...legends);
}

let activeIndex = 0;
for (const filePath of jsonFiles) {
  const fileContent = JSON.parse(readFileSync(filePath, "utf-8"));
  if (fileContent.players && Array.isArray(fileContent.players)) {
    for (const p of fileContent.players) {
      rawPlayers.push({
        name: p.name,
        position: p.position || "CM",
        club: p.club || fileContent.club?.name || "Unknown Club",
        nation: p.nation || "Unknown",
        league: fileContent.club?.league,
        tier: p.tier,
        isLegend: !!p.isLegend,
        apiId: p.apiId ? String(p.apiId) : undefined,
        imageUrl: p.imageUrl || undefined,
        kitNumber: typeof p.kitNumber === "number" ? p.kitNumber : undefined,
        index: activeIndex++,
      });
    }
  }
}

const MASTER_PLAYERS = new Set([
  'Kylian Mbappé', 'Erling Haaland', 'Jude Bellingham', 'Vinícius Júnior', 'Kevin De Bruyne',
  'Mohamed Salah', 'Harry Kane', 'Rodri', 'Lionel Messi', 'Cristiano Ronaldo', 'Lamine Yamal',
  'Florian Wirtz', 'Jamal Musiala', 'Lautaro Martínez', 'Robert Lewandowski', 'Virgil van Dijk'
]);

const ELITE_PLUS_PLAYERS = new Set([
  'Bukayo Saka', 'Antoine Griezmann', 'Victor Osimhen', 'Thibaut Courtois', 'Alisson', 'Ederson',
  'Pedri', 'Gavi', 'Bruno Fernandes', 'Martin Ødegaard', 'Declan Rice', 'Federico Valverde',
  'Bernardo Silva', 'Phil Foden', 'Son Heung-min', 'Raphinha', 'Cole Palmer', 'Alexander Isak',
  'William Saliba', 'Ruben Dias', 'Trent Alexander-Arnold', 'Achraf Hakimi', 'Rafael Leão'
]);

const ELITE_PLAYERS = new Set([
  'Ousmane Dembélé', 'Julian Alvarez', 'Gabriel Martinelli', 'Kai Havertz', 'Bruno Guimarães',
  'Alexis Mac Allister', 'Dominik Szoboszlai', 'Enzo Fernández', 'Nico Williams', 'Dani Olmo',
  'Marcus Rashford', 'Jack Grealish', 'James Maddison', 'Lucas Paquetá', 'Richarlison'
]);

function inferTier(p) {
  if (p.isLegend || p.tier === 'ICON') return 'ICON';
  if (p.tier && p.tier.trim() && p.tier !== '') return p.tier;
  
  const name = p.name;
  if (MASTER_PLAYERS.has(name)) return 'MASTER';
  if (ELITE_PLUS_PLAYERS.has(name)) return 'ELITE_PLUS';
  if (ELITE_PLAYERS.has(name)) return 'ELITE';
  
  // Balanced tier distribution for active squad players
  const idx = p.index || 0;
  const mod = idx % 10;
  if (mod === 0) return 'MASTER';
  if (mod === 1 || mod === 2) return 'ELITE_PLUS';
  if (mod === 3 || mod === 4) return 'ELITE';
  if (mod === 5 || mod === 6 || mod === 7) return 'GOLD';
  if (mod === 8) return 'SILVER';
  return 'BRONZE';
}

const sanitizedPlayers = rawPlayers.map((p) => ({
  name: p.name,
  position: p.position || "CM",
  club: p.club || "Unknown Club",
  nation: p.nation || "Unknown",
  league: p.league,
  tier: inferTier(p),
  isLegend: !!p.isLegend,
  apiId: p.apiId ? String(p.apiId) : undefined,
  imageUrl: p.imageUrl || undefined,
  kitNumber: typeof p.kitNumber === "number" ? p.kitNumber : undefined,
}));

console.log(`Collected ${sanitizedPlayers.length} total players across active & legends.`);

const tierCounts = {};
sanitizedPlayers.forEach(p => {
  tierCounts[p.tier] = (tierCounts[p.tier] || 0) + 1;
});
console.log("Tier distribution:", tierCounts);

console.log("Sending complete seed payload to Convex...");

try {
  const result = await client.mutation(api.seed.seedData.seedAllData, { players: sanitizedPlayers });
  console.log("Seeding successful:", JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Seeding failed:", error);
  process.exit(1);
}
