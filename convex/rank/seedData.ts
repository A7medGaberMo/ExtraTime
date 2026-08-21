import { RankQuestionInput, validateQuestionBank } from "./validate";
import { initialRankQuestions } from "../seed/rankQuestions";

// Import all modular question categories
import championsLeagueClubs from "../../data/rank/clubs/champions-league.json";
import championsLeagueStats from "../../data/rank/clubs/champions-league-stats.json";
import europaLeagueTitles from "../../data/rank/clubs/europa-league-titles.json";
import domesticTitles from "../../data/rank/clubs/domestic-titles.json";
import europeanRecords from "../../data/rank/clubs/european-records.json";
import domesticCups from "../../data/rank/clubs/domestic-cups.json";
import worldCupEditions from "../../data/rank/competitions/world-cup-editions.json";
import uclSeason2526 from "../../data/rank/competitions/ucl-season-2025-26.json";
import europaLeague from "../../data/rank/competitions/europa-league.json";
import continentalCups from "../../data/rank/competitions/continental-cups.json";
import worldCupRecords from "../../data/rank/national-teams/world-cup-records.json";
import uclPlayerRecords from "../../data/rank/players/ucl-records.json";
import worldCupLegends from "../../data/rank/players/world-cup-legends.json";
import transfersAndInt from "../../data/rank/players/transfers-and-international.json";
import ballonDor from "../../data/rank/players/ballon-dor.json";
import goldenShoe from "../../data/rank/players/golden-shoe.json";
import legendStints from "../../data/rank/players/legend-stints.json";
import allTimeTopScorers from "../../data/rank/players/all-time-top-scorers.json";
import transferRecords from "../../data/rank/players/transfer-records.json";
import uclAppearances from "../../data/rank/players/champions-league-appearances.json";
import internationalCaps from "../../data/rank/players/international-caps.json";
import playmakersAssists from "../../data/rank/players/playmakers-assists.json";
import defendersAndGoalkeepers from "../../data/rank/players/defenders-and-goalkeepers.json";
import africanAndAsianIcons from "../../data/rank/players/african-and-asian-icons.json";
import plClubSeasons from "../../data/rank/club-seasons/premier-league-records.json";
import uclSingleCampaigns from "../../data/rank/player-seasons/ucl-single-campaigns.json";

// Merge and deduplicate by slug
const rawCombined: RankQuestionInput[] = [
  ...initialRankQuestions,
  ...(championsLeagueClubs as RankQuestionInput[]),
  ...(championsLeagueStats as RankQuestionInput[]),
  ...(europaLeagueTitles as RankQuestionInput[]),
  ...(domesticTitles as RankQuestionInput[]),
  ...(europeanRecords as RankQuestionInput[]),
  ...(domesticCups as RankQuestionInput[]),
  ...(worldCupEditions as RankQuestionInput[]),
  ...(uclSeason2526 as RankQuestionInput[]),
  ...(europaLeague as RankQuestionInput[]),
  ...(continentalCups as RankQuestionInput[]),
  ...(worldCupRecords as RankQuestionInput[]),
  ...(uclPlayerRecords as RankQuestionInput[]),
  ...(worldCupLegends as RankQuestionInput[]),
  ...(transfersAndInt as RankQuestionInput[]),
  ...(ballonDor as RankQuestionInput[]),
  ...(goldenShoe as RankQuestionInput[]),
  ...(legendStints as RankQuestionInput[]),
  ...(allTimeTopScorers as RankQuestionInput[]),
  ...(transferRecords as RankQuestionInput[]),
  ...(uclAppearances as RankQuestionInput[]),
  ...(internationalCaps as RankQuestionInput[]),
  ...(playmakersAssists as RankQuestionInput[]),
  ...(defendersAndGoalkeepers as RankQuestionInput[]),
  ...(africanAndAsianIcons as RankQuestionInput[]),
  ...(plClubSeasons as RankQuestionInput[]),
  ...(uclSingleCampaigns as RankQuestionInput[]),
];

const uniqueMap = new Map<string, RankQuestionInput>();
for (const q of rawCombined) {
  if (!uniqueMap.has(q.slug)) {
    uniqueMap.set(q.slug, q);
  }
}

export const allRankSeedQuestions: RankQuestionInput[] = Array.from(uniqueMap.values());

// Strict invariant pre-flight verification on load
validateQuestionBank(allRankSeedQuestions);
