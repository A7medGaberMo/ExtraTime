import modernSuperstars from './players/modern-superstars.json';
import legendsAndIcons from './players/legends-and-icons.json';
import transferMarketRecords from './players/transfer-market-records.json';
import defendersAndGoalkeepers from './players/defenders-and-goalkeepers.json';
import playmakersAndCreators from './players/playmakers-and-creators.json';
import clubRecordsAndDynasties from './clubs/club-records-and-dynasties.json';
import worldCupAndInternational from './competitions/world-cup-and-international.json';
import legendaryCampaigns from './seasons/legendary-campaigns.json';

export interface RankQuestionSeedItem {
  title: { en: string; ar: string };
  subtitle?: { en: string; ar: string };
  category?: 'clubs' | 'players' | 'competitions' | 'transfers' | 'seasons' | string;
  isActive?: boolean;
  answers: {
    answerKey: string;
    name: { en: string; ar: string };
    subText?: { en: string; ar: string };
    media: {
      type: 'player' | 'club' | 'nation' | 'tournament' | 'custom' | 'stint';
      fallbackText?: string;
      primaryUrl?: string;
      secondaryBadgeUrl?: string;
      entityId?: string;
      stintBadge?: {
        clubName: string;
        season?: string;
      };
    };
    stat: { en: string; ar: string };
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
