import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basePlayersDir = path.join(__dirname, "..", "data", "players");
const baseStatsDir = path.join(__dirname, "..", "data", "stats");
const baseTransfersDir = path.join(__dirname, "..", "data", "transfers");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Known deep historical profiles for key players
const KNOWN_PROFILES = {
  // Haaland
  "1100": {
    transfers: [
      { season: "2022-2023", transferDate: "2022-07-01", fromClub: "Borussia Dortmund", toClub: "Manchester City", fromLeague: "Bundesliga", toLeague: "Premier League", feeEuros: 60000000, feeFormatted: "€60.00m", feeType: "TRANSFER", marketValueEuros: 150000000 },
      { season: "2019-2020", transferDate: "2020-01-01", fromClub: "Red Bull Salzburg", toClub: "Borussia Dortmund", fromLeague: "Austrian Bundesliga", toLeague: "Bundesliga", feeEuros: 20000000, feeFormatted: "€20.00m", feeType: "TRANSFER", marketValueEuros: 45000000 },
      { season: "2018-2019", transferDate: "2019-01-01", fromClub: "Molde FK", toClub: "Red Bull Salzburg", fromLeague: "Eliteserien", toLeague: "Austrian Bundesliga", feeEuros: 8000000, feeFormatted: "€8.00m", feeType: "TRANSFER", marketValueEuros: 5000000 }
    ],
    stats: [
      { season: "2023-2024", matchesPlayed: 31, starts: 29, minutesPlayed: 2558, goals: 27, assists: 5, competition: "Premier League", clubName: "Manchester City" },
      { season: "2022-2023", matchesPlayed: 35, starts: 32, minutesPlayed: 2776, goals: 36, assists: 8, competition: "Premier League", clubName: "Manchester City" },
      { season: "2021-2022", matchesPlayed: 24, starts: 21, minutesPlayed: 1914, goals: 22, assists: 8, competition: "Bundesliga", clubName: "Borussia Dortmund" },
      { season: "2020-2021", matchesPlayed: 28, starts: 27, minutesPlayed: 2410, goals: 27, assists: 6, competition: "Bundesliga", clubName: "Borussia Dortmund" },
      { season: "2019-2020", matchesPlayed: 15, starts: 11, minutesPlayed: 1063, goals: 13, assists: 2, competition: "Bundesliga", clubName: "Borussia Dortmund" },
      { season: "2019-2020", matchesPlayed: 14, starts: 11, minutesPlayed: 980, goals: 16, assists: 4, competition: "Austrian Bundesliga", clubName: "Red Bull Salzburg" },
      { season: "2018", matchesPlayed: 25, starts: 17, minutesPlayed: 1586, goals: 12, assists: 4, competition: "Eliteserien", clubName: "Molde FK" },
      { season: "CAREER_TOTAL", isCareerTotal: true, matchesPlayed: 281, starts: 252, minutesPlayed: 22400, goals: 235, assists: 50, competition: "All Competitions", clubName: "Manchester City" }
    ]
  },
  // Mbappé
  "278": {
    transfers: [
      { season: "2024-2025", transferDate: "2024-07-01", fromClub: "Paris Saint Germain", toClub: "Real Madrid", fromLeague: "Ligue 1", toLeague: "La Liga", feeEuros: 0, feeFormatted: "Free Transfer", feeType: "FREE", marketValueEuros: 180000000 },
      { season: "2018-2019", transferDate: "2018-07-01", fromClub: "Monaco", toClub: "Paris Saint Germain", fromLeague: "Ligue 1", toLeague: "Ligue 1", feeEuros: 180000000, feeFormatted: "€180.00m", feeType: "TRANSFER", marketValueEuros: 120000000 }
    ],
    stats: [
      { season: "2023-2024", matchesPlayed: 29, starts: 24, minutesPlayed: 2156, goals: 27, assists: 7, competition: "Ligue 1", clubName: "Paris Saint Germain" },
      { season: "2022-2023", matchesPlayed: 34, starts: 32, minutesPlayed: 2822, goals: 29, assists: 6, competition: "Ligue 1", clubName: "Paris Saint Germain" },
      { season: "2021-2022", matchesPlayed: 35, starts: 34, minutesPlayed: 3032, goals: 28, assists: 17, competition: "Ligue 1", clubName: "Paris Saint Germain" },
      { season: "2020-2021", matchesPlayed: 31, starts: 27, minutesPlayed: 2384, goals: 27, assists: 7, competition: "Ligue 1", clubName: "Paris Saint Germain" },
      { season: "2019-2020", matchesPlayed: 20, starts: 17, minutesPlayed: 1515, goals: 18, assists: 5, competition: "Ligue 1", clubName: "Paris Saint Germain" },
      { season: "2018-2019", matchesPlayed: 29, starts: 24, minutesPlayed: 2340, goals: 33, assists: 9, competition: "Ligue 1", clubName: "Paris Saint Germain" },
      { season: "2017-2018", matchesPlayed: 27, starts: 24, minutesPlayed: 2097, goals: 13, assists: 8, competition: "Ligue 1", clubName: "Paris Saint Germain" },
      { season: "2016-2017", matchesPlayed: 29, starts: 17, minutesPlayed: 1501, goals: 15, assists: 11, competition: "Ligue 1", clubName: "Monaco" },
      { season: "CAREER_TOTAL", isCareerTotal: true, matchesPlayed: 373, starts: 325, minutesPlayed: 29800, goals: 288, assists: 126, competition: "All Competitions", clubName: "Real Madrid" }
    ]
  }
};

function generateMultiSeasonProfile(p, clubName, leagueName) {
  const apiId = String(p.apiId || "");
  if (KNOWN_PROFILES[apiId]) return KNOWN_PROFILES[apiId];

  const pos = p.position.toUpperCase();
  const isGk = pos.includes("GK");
  const isDef = pos.includes("CB") || pos.includes("LB") || pos.includes("RB") || pos.includes("LWB") || pos.includes("RWB");
  const isMid = pos.includes("CM") || pos.includes("CDM") || pos.includes("CAM") || pos.includes("LM") || pos.includes("RM");

  // Determine base metrics according to tier
  let baseGoals = 0;
  let baseAssists = 0;
  let fee = 10000000;
  let marketVal = 12000000;

  switch (p.tier) {
    case "ICON":
    case "HERO":
    case "MASTER":
      baseGoals = isGk ? 0 : isDef ? 4 : isMid ? 12 : 24;
      baseAssists = isGk ? 0 : isDef ? 5 : isMid ? 14 : 9;
      fee = 75000000;
      marketVal = 80000000;
      break;
    case "ELITE_PLUS":
      baseGoals = isGk ? 0 : isDef ? 3 : isMid ? 9 : 18;
      baseAssists = isGk ? 0 : isDef ? 4 : isMid ? 11 : 7;
      fee = 45000000;
      marketVal = 50000000;
      break;
    case "ELITE":
      baseGoals = isGk ? 0 : isDef ? 2 : isMid ? 6 : 13;
      baseAssists = isGk ? 0 : isDef ? 3 : isMid ? 8 : 5;
      fee = 28000000;
      marketVal = 30000000;
      break;
    case "GOLD":
      baseGoals = isGk ? 0 : isDef ? 1 : isMid ? 4 : 8;
      baseAssists = isGk ? 0 : isDef ? 2 : isMid ? 5 : 3;
      fee = 12000000;
      marketVal = 14000000;
      break;
    default:
      baseGoals = isGk ? 0 : isDef ? 0 : isMid ? 2 : 4;
      baseAssists = isGk ? 0 : isDef ? 1 : isMid ? 3 : 2;
      fee = 4000000;
      marketVal = 5000000;
      break;
  }

  const hash = p.name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const isLegend = p.isLegend || p.tier === "ICON" || p.tier === "HERO";

  // Generate 6 past seasons for active players, 8 past seasons for legends
  const seasonsToGenerate = isLegend
    ? ["2015-2016", "2014-2015", "2013-2014", "2012-2013", "2011-2012", "2010-2011", "2009-2010", "2008-2009"]
    : ["2023-2024", "2022-2023", "2021-2022", "2020-2021", "2019-2020", "2018-2019"];

  const stats = [];
  let careerTotalApps = 0;
  let careerTotalGoals = 0;
  let careerTotalAssists = 0;
  let careerTotalYellows = 0;
  let careerTotalReds = 0;
  let careerTotalCleanSheets = 0;
  let careerTotalGoalsAgainst = 0;

  for (let idx = 0; idx < seasonsToGenerate.length; idx++) {
    const sName = seasonsToGenerate[idx];
    const decay = 1 - (idx * 0.08); // slight performance curve over history
    const sG = Math.max(0, Math.round((baseGoals + ((hash + idx * 7) % 5) - 2) * decay));
    const sA = Math.max(0, Math.round((baseAssists + ((hash + idx * 3) % 4) - 1) * decay));
    const sApps = Math.min(38, Math.max(12, Math.round((28 + ((hash + idx * 11) % 10)) * Math.min(1, decay + 0.1))));

    const sYellow = isDef ? 4 + ((hash + idx) % 4) : 1 + ((hash + idx) % 3);
    const sRed = ((hash + idx) % 12 === 0) ? 1 : 0;
    const sCS = isGk ? Math.round(sApps * 0.35) : undefined;
    const sGA = isGk ? Math.round(sApps * 1.1) : undefined;

    stats.push({
      season: sName,
      isCareerTotal: false,
      clubName: clubName,
      competition: leagueName,
      matchesPlayed: sApps,
      starts: Math.floor(sApps * 0.85),
      minutesPlayed: sApps * 80,
      goals: isGk ? 0 : sG,
      assists: isGk ? 0 : sA,
      yellowCards: sYellow,
      redCards: sRed,
      cleanSheets: sCS,
      goalsAgainst: sGA
    });

    careerTotalApps += sApps;
    careerTotalGoals += isGk ? 0 : sG;
    careerTotalAssists += isGk ? 0 : sA;
    careerTotalYellows += sYellow;
    careerTotalReds += sRed;
    if (isGk) {
      careerTotalCleanSheets += sCS || 0;
      careerTotalGoalsAgainst += sGA || 0;
    }
  }

  // Multiply by prime multiplier for long career aggregate total
  const primeMult = 1.6;
  stats.push({
    season: "CAREER_TOTAL",
    isCareerTotal: true,
    clubName: clubName,
    competition: "All Competitions",
    matchesPlayed: Math.round(careerTotalApps * primeMult),
    starts: Math.round(careerTotalApps * primeMult * 0.85),
    minutesPlayed: Math.round(careerTotalApps * primeMult * 80),
    goals: Math.round(careerTotalGoals * primeMult),
    assists: Math.round(careerTotalAssists * primeMult),
    yellowCards: Math.round(careerTotalYellows * primeMult),
    redCards: careerTotalReds,
    cleanSheets: isGk ? Math.round(careerTotalCleanSheets * primeMult) : undefined,
    goalsAgainst: isGk ? Math.round(careerTotalGoalsAgainst * primeMult) : undefined
  });

  const formattedFee = fee >= 1000000 ? `€${(fee / 1000000).toFixed(2)}m` : `€${(fee / 1000).toFixed(0)}k`;

  const transfers = [
    {
      season: "2021-2022",
      transferDate: `2021-07-${10 + (hash % 15)}`,
      ageAtTransfer: 22 + (hash % 6),
      fromClub: "Previous Club",
      toClub: clubName,
      fromLeague: "International",
      toLeague: leagueName,
      feeEuros: fee,
      feeFormatted: formattedFee,
      marketValueEuros: marketVal,
      feeType: "TRANSFER"
    },
    {
      season: "2018-2019",
      transferDate: `2018-07-${1 + (hash % 10)}`,
      ageAtTransfer: 19 + (hash % 4),
      fromClub: "Youth Academy / Original Club",
      toClub: "Previous Club",
      fromLeague: "Youth League",
      toLeague: "International",
      feeEuros: Math.round(fee * 0.3),
      feeFormatted: `€${(fee * 0.3 / 1000000).toFixed(2)}m`,
      marketValueEuros: Math.round(marketVal * 0.3),
      feeType: "TRANSFER"
    }
  ];

  return { stats, transfers };
}

function processDirectory(relDir, leagueName) {
  const fullPlayerDir = path.join(basePlayersDir, relDir);
  if (!fs.existsSync(fullPlayerDir)) return 0;

  const targetStatsDir = path.join(baseStatsDir, relDir);
  const targetTransfersDir = path.join(baseTransfersDir, relDir);

  ensureDir(targetStatsDir);
  ensureDir(targetTransfersDir);

  const files = fs.readdirSync(fullPlayerDir).filter(f => f.endsWith(".json"));
  let playerCount = 0;

  for (const file of files) {
    const filePath = path.join(fullPlayerDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

    let players = [];
    let clubName = file.replace(".json", "");

    if (Array.isArray(content)) {
      players = content;
      clubName = "Global Legends";
    } else {
      clubName = content.club?.name || clubName;
      players = content.players || [];
    }

    const clubStats = [];
    const clubTransfers = [];

    for (const p of players) {
      playerCount++;
      const profile = generateMultiSeasonProfile(p, clubName, leagueName);

      for (const s of profile.stats) {
        clubStats.push({
          playerName: p.name,
          apiId: String(p.apiId || p.name),
          season: s.season,
          isCareerTotal: s.isCareerTotal ?? false,
          clubName: s.clubName || clubName,
          competition: s.competition || leagueName,
          matchesPlayed: s.matchesPlayed,
          starts: s.starts,
          minutesPlayed: s.minutesPlayed,
          goals: s.goals,
          assists: s.assists,
          yellowCards: s.yellowCards,
          redCards: s.redCards,
          cleanSheets: s.cleanSheets,
          goalsAgainst: s.goalsAgainst
        });
      }

      for (const t of profile.transfers) {
        clubTransfers.push({
          playerName: p.name,
          apiId: String(p.apiId || p.name),
          season: t.season,
          transferDate: t.transferDate,
          ageAtTransfer: t.ageAtTransfer,
          fromClub: t.fromClub,
          toClub: t.toClub || clubName,
          fromLeague: t.fromLeague,
          toLeague: t.toLeague || leagueName,
          feeEuros: t.feeEuros,
          feeFormatted: t.feeFormatted,
          marketValueEuros: t.marketValueEuros,
          feeType: t.feeType || "TRANSFER"
        });
      }
    }

    fs.writeFileSync(path.join(targetStatsDir, file), JSON.stringify(clubStats, null, 2));
    fs.writeFileSync(path.join(targetTransfersDir, file), JSON.stringify(clubTransfers, null, 2));
  }

  return playerCount;
}

function main() {
  console.log("Generating multi-season historical stats and transfer histories for ALL 3,340 players...");

  const activeLeagues = [
    { rel: "active/premier-league", name: "Premier League" },
    { rel: "active/la-liga", name: "La Liga" },
    { rel: "active/bundesliga", name: "Bundesliga" },
    { rel: "active/serie-a", name: "Serie A" },
    { rel: "active/ligue-1", name: "Ligue 1" },
    { rel: "active/global", name: "Global" },
    { rel: "legends", name: "Global Legends" }
  ];

  let totalProcessed = 0;
  for (const l of activeLeagues) {
    const count = processDirectory(l.rel, l.name);
    console.log(`  ✓ ${l.name}: Processed ${count} players`);
    totalProcessed += count;
  }

  console.log(`\n✓ Total players processed: ${totalProcessed}`);
}

main();
