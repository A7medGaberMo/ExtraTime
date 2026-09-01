import modernSuperstars from './players/modern-superstars.json';
import legendsAndIcons from './players/legends-and-icons.json';
import transferMarketRecords from './players/transfer-market-records.json';
import defendersAndGoalkeepers from './players/defenders-and-goalkeepers.json';
import playmakersAndCreators from './players/playmakers-and-creators.json';
import clubRecordsAndDynasties from './clubs/club-records-and-dynasties.json';
import worldCupAndInternational from './competitions/world-cup-and-international.json';
import legendaryCampaigns from './seasons/legendary-campaigns.json';

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
  ...(modernSuperstars as RankQuestionSeedItem[]),
  ...(legendsAndIcons as RankQuestionSeedItem[]),
  ...(transferMarketRecords as RankQuestionSeedItem[]),
  ...(defendersAndGoalkeepers as RankQuestionSeedItem[]),
  ...(playmakersAndCreators as RankQuestionSeedItem[]),
  ...(clubRecordsAndDynasties as RankQuestionSeedItem[]),
  ...(worldCupAndInternational as RankQuestionSeedItem[]),
  ...(legendaryCampaigns as RankQuestionSeedItem[]),
];

export const totalRankQuestionsCount = allRankQuestions.length;
