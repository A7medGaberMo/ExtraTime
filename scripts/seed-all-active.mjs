import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONVEX_URL = "https://shocking-woodpecker-506.convex.cloud";
const BATCH_SIZE = 200;

function collectActivePlayers(baseDir) {
  const allPlayers = [];
  const leagues = fs.readdirSync(baseDir);

  for (const league of leagues) {
    const leagueDir = path.join(baseDir, league);
    if (!fs.statSync(leagueDir).isDirectory()) continue;

    const leagueName =
      league === "premier-league" ? "Premier League" :
      league === "la-liga" ? "La Liga" :
      league === "bundesliga" ? "Bundesliga" :
      league === "serie-a" ? "Serie A" :
      league === "ligue-1" ? "Ligue 1" :
      league === "global" ? "Global" : league;

    const files = fs.readdirSync(leagueDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(leagueDir, file), "utf8"));
      const clubName = data.club?.name ?? file.replace(".json", "");
      const clubLogo = data.club?.logo ?? "";

      for (const p of data.players) {
        allPlayers.push({
          name: p.name,
          position: p.position,
          club: p.club ?? clubName,
          nation: p.nation,
          league: leagueName,
          tier: p.tier,
          isLegend: p.isLegend ?? false,
          apiId: String(p.apiId ?? ""),
          imageUrl: p.imageUrl ?? "",
          kitNumber: p.kitNumber ?? 0,
        });
      }
    }
  }
  return allPlayers;
}

function collectLegendPlayers(legendsFile) {
  const allPlayers = [];
  if (fs.existsSync(legendsFile)) {
    const data = JSON.parse(fs.readFileSync(legendsFile, "utf8"));
    for (const p of data) {
      allPlayers.push({
        name: p.name,
        position: p.position,
        club: p.club,
        nation: p.nation,
        league: "Global Legends",
        tier: p.tier,
        isLegend: true,
        apiId: String(p.apiId ?? ""),
        imageUrl: p.imageUrl ?? "",
        kitNumber: p.kitNumber ?? 0,
      });
    }
  }
  return allPlayers;
}

async function callMutation(fnName, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: `seed/seedData:${fnName}`, args }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex ${fnName} failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  if (json.status === "error") {
    throw new Error(`Convex ${fnName} error: ${json.errorMessage}`);
  }
  return json.value;
}

async function main() {
  const activeDir = path.join(__dirname, "..", "data", "players", "active");
  const legendsFile = path.join(__dirname, "..", "data", "players", "legends", "legends.json");
  
  const activePlayers = collectActivePlayers(activeDir);
  const legendPlayers = collectLegendPlayers(legendsFile);
  
  const allPlayers = [...activePlayers, ...legendPlayers];
  console.log(`Collected ${activePlayers.length} active players and ${legendPlayers.length} legends.`);
  console.log(`Collected ${allPlayers.length} players total.`);

  const batches = [];
  for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
    batches.push(allPlayers.slice(i, i + BATCH_SIZE));
  }
  console.log(`Split into ${batches.length} batches of up to ${BATCH_SIZE}.`);

  // First batch: seedAllData (clears DB)
  console.log(`\nBatch 1/${batches.length}: seedAllData (${batches[0].length} players)...`);
  const r1 = await callMutation("seedAllData", { players: batches[0] });
  console.log(`  ✓`, r1);

  // Remaining batches: appendData
  for (let i = 1; i < batches.length; i++) {
    console.log(`Batch ${i + 1}/${batches.length}: appendData (${batches[i].length} players)...`);
    const r = await callMutation("appendData", { players: batches[i] });
    console.log(`  ✓`, r);
  }

  console.log(`\nDone! Seeded ${allPlayers.length} players to Convex.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
