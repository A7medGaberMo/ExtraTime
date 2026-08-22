import championsLeagueClubs from './clubs/champions-league.json';
import championsLeagueStats from './clubs/champions-league-stats.json';
import europaLeagueTitles from './clubs/europa-league-titles.json';
import domesticTitles from './clubs/domestic-titles.json';
import europeanRecords from './clubs/european-records.json';
import domesticCups from './clubs/domestic-cups.json';
import clubRecordsExtra from './clubs/club-records-extra.json';
import singleClubLegends from './clubs/single-club-legends.json';
import clubBattles from './clubs/club-battles.json';
import worldCupEditions from './competitions/world-cup-editions.json';
import uclSeason2526 from './competitions/ucl-season-2025-26.json';
import europaLeague from './competitions/europa-league.json';
import continentalCups from './competitions/continental-cups.json';
import internationalTournaments from './competitions/international-tournaments.json';
import tournamentEditions from './competitions/tournament-editions.json';
import tournamentMatchups from './competitions/tournament-matchups.json';
import worldCupRecords from './national-teams/world-cup-records.json';
import uclPlayerRecords from './players/ucl-records.json';
import worldCupLegends from './players/world-cup-legends.json';
import transfersAndInt from './players/transfers-and-international.json';
import ballonDor from './players/ballon-dor.json';
import goldenShoe from './players/golden-shoe.json';
import legendStints from './players/legend-stints.json';
import allTimeTopScorers from './players/all-time-top-scorers.json';
import transferRecords from './players/transfer-records.json';
import transferMarketRecords from './players/transfer-market-records.json';
import uclAppearances from './players/champions-league-appearances.json';
import internationalCaps from './players/international-caps.json';
import playmakersAssists from './players/playmakers-assists.json';
import defendersAndGoalkeepers from './players/defenders-and-goalkeepers.json';
import africanAndAsianIcons from './players/african-and-asian-icons.json';
import freeKicks from './players/free-kicks.json';
import goalkeepingCleanSheets from './players/goalkeeping-clean-sheets.json';
import milestonesAndHattricks from './players/milestones-and-hattricks.json';
import youngestAndMilestones from './players/youngest-and-milestones.json';
import starMatchups from './players/star-matchups.json';
import plClubSeasons from './club-seasons/premier-league-records.json';
import uclSingleCampaigns from './player-seasons/ucl-single-campaigns.json';
import eliteCampaigns from './player-seasons/elite-campaigns.json';

export interface RankQuestionSeedItem {
  slug: string;
  scopeType: 'ALL_TIME' | 'PER_SEASON' | 'PER_CLUB' | 'PER_COMPETITION' | 'PLAYER_STINTS' | 'TRANSFERS_MARKET';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
  asOfDate: string;
  isActive: boolean;
  tags: string[];
  title: { en: string; ar: string };
  subtitle?: { en: string; ar: string };
  metricLabel: { en: string; ar: string };
  direction: 'asc' | 'desc';
  answers: {
    answerKey: string;
    name: { en: string; ar: string };
    subText?: { en: string; ar: string };
    media: {
      type: 'player' | 'club' | 'nation' | 'tournament' | 'custom' | 'stint';
      fallbackText?: string;
      primaryUrl?: string;
      secondaryBadgeUrl?: string;
      stintBadge?: {
        clubName: string;
        season?: string;
      };
    };
    value: number;
    valueLabel: { en: string; ar: string };
    correctRank: number;
  }[];
}

export const allRankQuestions: RankQuestionSeedItem[] = [
  ...(championsLeagueClubs as RankQuestionSeedItem[]),
  ...(championsLeagueStats as RankQuestionSeedItem[]),
  ...(europaLeagueTitles as RankQuestionSeedItem[]),
  ...(domesticTitles as RankQuestionSeedItem[]),
  ...(europeanRecords as RankQuestionSeedItem[]),
  ...(domesticCups as RankQuestionSeedItem[]),
  ...(clubRecordsExtra as RankQuestionSeedItem[]),
  ...(singleClubLegends as RankQuestionSeedItem[]),
  ...(clubBattles as RankQuestionSeedItem[]),
  ...(worldCupEditions as RankQuestionSeedItem[]),
  ...(uclSeason2526 as RankQuestionSeedItem[]),
  ...(europaLeague as RankQuestionSeedItem[]),
  ...(continentalCups as RankQuestionSeedItem[]),
  ...(internationalTournaments as RankQuestionSeedItem[]),
  ...(tournamentEditions as RankQuestionSeedItem[]),
  ...(tournamentMatchups as RankQuestionSeedItem[]),
  ...(worldCupRecords as RankQuestionSeedItem[]),
  ...(uclPlayerRecords as RankQuestionSeedItem[]),
  ...(worldCupLegends as RankQuestionSeedItem[]),
  ...(transfersAndInt as RankQuestionSeedItem[]),
  ...(ballonDor as RankQuestionSeedItem[]),
  ...(goldenShoe as RankQuestionSeedItem[]),
  ...(legendStints as RankQuestionSeedItem[]),
  ...(allTimeTopScorers as RankQuestionSeedItem[]),
  ...(transferRecords as RankQuestionSeedItem[]),
  ...(transferMarketRecords as RankQuestionSeedItem[]),
  ...(uclAppearances as RankQuestionSeedItem[]),
  ...(internationalCaps as RankQuestionSeedItem[]),
  ...(playmakersAssists as RankQuestionSeedItem[]),
  ...(defendersAndGoalkeepers as RankQuestionSeedItem[]),
  ...(africanAndAsianIcons as RankQuestionSeedItem[]),
  ...(freeKicks as RankQuestionSeedItem[]),
  ...(goalkeepingCleanSheets as RankQuestionSeedItem[]),
  ...(milestonesAndHattricks as RankQuestionSeedItem[]),
  ...(youngestAndMilestones as RankQuestionSeedItem[]),
  ...(starMatchups as RankQuestionSeedItem[]),
  ...(plClubSeasons as RankQuestionSeedItem[]),
  ...(uclSingleCampaigns as RankQuestionSeedItem[]),
  ...(eliteCampaigns as RankQuestionSeedItem[]),
];
