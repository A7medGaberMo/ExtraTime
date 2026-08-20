import type { Tier } from '@/types/player';

export interface TierVisualStyle {
  name: Tier;
  identity: string;
  material: string;
  primary: string;
  highlight: string;
  shadow: string;
  accent: string;
  ink: string;
  surface: string;
  frame: string;
  backdrop: string;
  plate: string;
  glow: string;
}

export const TIER_ORDER: Tier[] = [
  'ICON',
  'HERO',
  'ULTIMATE',
  'MASTER',
  'ELITE',
  'GOLD',
  'SILVER',
  'BRONZE',
];

export const TIER_STYLES: Record<Tier, TierVisualStyle> = {
  ICON: {
    name: 'ICON',
    identity: 'Ivory Icon',
    material: 'Pearl enamel, ivory ceramic, antique gold',
    primary: '#F6F0DF',
    highlight: '#FFFDF4',
    shadow: '#5D4518',
    accent: '#C9A646',
    ink: '#18130A',
    surface: '#EEE7D2',
    frame:
      'linear-gradient(145deg, #FFFDF4 0%, #E9D8A4 28%, #B8912F 52%, #FFF8DE 72%, #7A5A1B 100%)',
    backdrop: 'linear-gradient(160deg, #F8F4EA 0%, #E5DCC4 46%, #9C7C31 100%)',
    plate: 'linear-gradient(180deg, rgba(255,253,244,0.96), rgba(225,212,180,0.9))',
    glow: 'rgba(201,166,70,0.34)',
  },
  HERO: {
    name: 'HERO',
    identity: 'Emerald Hero',
    material: 'Deep forest enamel, emerald glass, warm gold',
    primary: '#0F6B4C',
    highlight: '#7CE0B2',
    shadow: '#06261C',
    accent: '#D6AD5B',
    ink: '#F3FFF9',
    surface: '#0A3B2C',
    frame: 'linear-gradient(145deg, #D6AD5B 0%, #17845F 34%, #073524 60%, #A77A2E 100%)',
    backdrop: 'linear-gradient(160deg, #0B4B35 0%, #06281E 54%, #03120D 100%)',
    plate: 'linear-gradient(180deg, rgba(7,53,36,0.92), rgba(3,18,13,0.94))',
    glow: 'rgba(124,224,178,0.26)',
  },
  ULTIMATE: {
    name: 'ULTIMATE',
    identity: 'Sapphire Ultimate',
    material: 'Sapphire crystal, platinum, icy white',
    primary: '#135FB4',
    highlight: '#DCEEFF',
    shadow: '#061B38',
    accent: '#AEB9C6',
    ink: '#F7FBFF',
    surface: '#0A376D',
    frame:
      'linear-gradient(145deg, #F8FBFF 0%, #8FA4B9 24%, #1767B8 50%, #DCEEFF 74%, #08234A 100%)',
    backdrop: 'linear-gradient(160deg, #0B4D91 0%, #061E3E 55%, #020A16 100%)',
    plate: 'linear-gradient(180deg, rgba(9,45,89,0.92), rgba(2,10,22,0.94))',
    glow: 'rgba(133,198,255,0.28)',
  },
  MASTER: {
    name: 'MASTER',
    identity: 'Violet Master',
    material: 'Royal violet lacquer, black gloss, soft amethyst',
    primary: '#6C3AAE',
    highlight: '#D7B7FF',
    shadow: '#08050D',
    accent: '#9A72D8',
    ink: '#FBF7FF',
    surface: '#1A0D29',
    frame: 'linear-gradient(145deg, #D7B7FF 0%, #6C3AAE 30%, #08050D 58%, #A886D9 100%)',
    backdrop: 'linear-gradient(160deg, #31114D 0%, #12071E 50%, #030205 100%)',
    plate: 'linear-gradient(180deg, rgba(28,12,45,0.94), rgba(5,3,8,0.96))',
    glow: 'rgba(154,114,216,0.3)',
  },
  ELITE: {
    name: 'ELITE',
    identity: 'Ruby Elite',
    material: 'Ruby enamel, dark carbon, rose highlights',
    primary: '#B91E35',
    highlight: '#FFB0BA',
    shadow: '#111114',
    accent: '#E05870',
    ink: '#FFF6F7',
    surface: '#3C0A13',
    frame: 'linear-gradient(145deg, #FFB0BA 0%, #B91E35 34%, #151517 62%, #E05870 100%)',
    backdrop: 'linear-gradient(160deg, #5C101D 0%, #1A080C 50%, #060607 100%)',
    plate: 'linear-gradient(180deg, rgba(58,9,18,0.92), rgba(8,8,9,0.95))',
    glow: 'rgba(224,88,112,0.28)',
  },
  GOLD: {
    name: 'GOLD',
    identity: 'Champagne Gold',
    material: 'Champagne metal, polished gold, bronze shadow',
    primary: '#D2A74A',
    highlight: '#FFE7A6',
    shadow: '#5C3413',
    accent: '#B9792A',
    ink: '#1A1207',
    surface: '#C99B3E',
    frame: 'linear-gradient(145deg, #FFF0BC 0%, #D2A74A 32%, #8F5C1D 58%, #F5D27B 100%)',
    backdrop: 'linear-gradient(160deg, #C79A3C 0%, #7C4E1A 55%, #231305 100%)',
    plate: 'linear-gradient(180deg, rgba(255,231,166,0.94), rgba(166,108,36,0.9))',
    glow: 'rgba(255,215,128,0.26)',
  },
  SILVER: {
    name: 'SILVER',
    identity: 'Titanium Silver',
    material: 'Titanium, graphite, cool white',
    primary: '#AEB8C4',
    highlight: '#F8FBFF',
    shadow: '#2F3540',
    accent: '#7F8B99',
    ink: '#F8FBFF',
    surface: '#4A525D',
    frame: 'linear-gradient(145deg, #F8FBFF 0%, #AEB8C4 34%, #3C434D 62%, #D8E0E8 100%)',
    backdrop: 'linear-gradient(160deg, #59616B 0%, #252B34 52%, #080B10 100%)',
    plate: 'linear-gradient(180deg, rgba(52,59,68,0.92), rgba(10,13,18,0.95))',
    glow: 'rgba(216,224,232,0.22)',
  },
  BRONZE: {
    name: 'BRONZE',
    identity: 'Smoked Bronze',
    material: 'Copper, smoked bronze, warm leather shadow',
    primary: '#B66A35',
    highlight: '#F1B37D',
    shadow: '#3D2314',
    accent: '#8B4A24',
    ink: '#FFF3E8',
    surface: '#5A321B',
    frame: 'linear-gradient(145deg, #F1B37D 0%, #B66A35 34%, #5A321B 62%, #2A160C 100%)',
    backdrop: 'linear-gradient(160deg, #7A4423 0%, #3B2112 54%, #100805 100%)',
    plate: 'linear-gradient(180deg, rgba(81,43,22,0.92), rgba(22,11,6,0.95))',
    glow: 'rgba(241,179,125,0.2)',
  },
};

export function getTierStyle(tier?: Tier | string | null): TierVisualStyle {
  return TIER_STYLES[(tier as Tier) || 'SILVER'] ?? TIER_STYLES.SILVER;
}
