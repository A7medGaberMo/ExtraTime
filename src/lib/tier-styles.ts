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
    identity: 'Off-White Icon',
    material: 'Off-white enamel, pearl ceramic, restrained antique trim',
    primary: '#F4EBD6',
    highlight: '#FFFDF6',
    shadow: '#6D614D',
    accent: '#B79A55',
    ink: '#18130A',
    surface: '#EFE5CE',
    frame:
      'linear-gradient(145deg, #FFFFFF 0%, #F7F0E2 18%, #C9B478 34%, #EEE0C5 52%, #FFFDF6 70%, #9F8B57 86%, #5A513F 100%)',
    backdrop:
      'radial-gradient(circle at 28% 12%, rgba(255,255,255,0.82) 0%, transparent 28%), radial-gradient(circle at 78% 82%, rgba(183,154,85,0.2) 0%, transparent 34%), linear-gradient(160deg, #FFFCF3 0%, #EFE5CE 42%, #D7C7A4 74%, #8A7A5D 100%)',
    plate: 'linear-gradient(180deg, rgba(255,253,246,0.96), rgba(224,211,184,0.92))',
    glow: 'rgba(255,253,246,0.32)',
  },
  HERO: {
    name: 'HERO',
    identity: 'Emerald Hero',
    material: 'Emerald glass, forest enamel, heroic gold',
    primary: '#119C72',
    highlight: '#8AF7C4',
    shadow: '#031A13',
    accent: '#E1B85F',
    ink: '#F3FFF9',
    surface: '#073927',
    frame: 'linear-gradient(145deg, #FFF0A6 0%, #34F5A5 16%, #119C72 34%, #042B1E 56%, #E1B85F 76%, #07150F 100%)',
    backdrop:
      'radial-gradient(circle at 30% 13%, rgba(138,247,196,0.44) 0%, transparent 28%), radial-gradient(circle at 76% 78%, rgba(225,184,95,0.24) 0%, transparent 34%), linear-gradient(160deg, #0E8058 0%, #063021 52%, #020D09 100%)',
    plate: 'linear-gradient(180deg, rgba(7,57,39,0.9), rgba(2,13,9,0.94))',
    glow: 'rgba(91,240,176,0.34)',
  },
  ULTIMATE: {
    name: 'ULTIMATE',
    identity: 'Sapphire Ultimate',
    material: 'Electric sapphire, platinum, championship gold',
    primary: '#2678FF',
    highlight: '#DCEEFF',
    shadow: '#020A18',
    accent: '#F0C15A',
    ink: '#F7FBFF',
    surface: '#082A62',
    frame:
      'linear-gradient(145deg, #FFFFFF 0%, #9FD0FF 14%, #2678FF 32%, #071C45 52%, #F0C15A 68%, #DCEEFF 84%, #061B38 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, rgba(127,178,255,0.52) 0%, transparent 30%), radial-gradient(circle at 76% 78%, rgba(240,193,90,0.26) 0%, transparent 34%), linear-gradient(160deg, #0D5CC0 0%, #061E3E 52%, #020A16 100%)',
    plate: 'linear-gradient(180deg, rgba(8,42,98,0.9), rgba(2,10,22,0.94))',
    glow: 'rgba(127,178,255,0.42)',
  },
  MASTER: {
    name: 'MASTER',
    identity: 'Violet Master',
    material: 'Royal violet lacquer, amethyst crystal, icy cyan',
    primary: '#7C3AED',
    highlight: '#E6D2FF',
    shadow: '#05020B',
    accent: '#56D8FF',
    ink: '#FBF7FF',
    surface: '#1A0D29',
    frame: 'linear-gradient(145deg, #FFFFFF 0%, #E6D2FF 14%, #A855F7 31%, #12071E 53%, #56D8FF 73%, #2A0B44 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, rgba(230,210,255,0.36) 0%, transparent 28%), radial-gradient(circle at 74% 78%, rgba(86,216,255,0.2) 0%, transparent 34%), linear-gradient(160deg, #431875 0%, #160826 50%, #030205 100%)',
    plate: 'linear-gradient(180deg, rgba(28,12,45,0.94), rgba(5,3,8,0.96))',
    glow: 'rgba(124,58,237,0.42)',
  },
  ELITE: {
    name: 'ELITE',
    identity: 'Ruby Elite',
    material: 'Ruby enamel, dark carbon, bright rose metal',
    primary: '#D92545',
    highlight: '#FFC2CB',
    shadow: '#080609',
    accent: '#FF5C7C',
    ink: '#FFF6F7',
    surface: '#3C0A13',
    frame: 'linear-gradient(145deg, #FFE4E8 0%, #FF5C7C 16%, #D92545 34%, #121216 58%, #FF9AAC 78%, #3A0710 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, rgba(255,92,124,0.34) 0%, transparent 28%), radial-gradient(circle at 76% 78%, rgba(255,194,203,0.16) 0%, transparent 34%), linear-gradient(160deg, #7C1326 0%, #1A080C 50%, #060607 100%)',
    plate: 'linear-gradient(180deg, rgba(58,9,18,0.92), rgba(8,8,9,0.95))',
    glow: 'rgba(255,92,124,0.34)',
  },
  GOLD: {
    name: 'GOLD',
    identity: 'Champagne Gold',
    material: 'Champagne metal, polished gold, midnight base',
    primary: '#D2A74A',
    highlight: '#FFE7A6',
    shadow: '#241505',
    accent: '#B9792A',
    ink: '#1A1207',
    surface: '#C99B3E',
    frame: 'linear-gradient(145deg, #FFF8D8 0%, #FFE07A 16%, #D2A74A 32%, #714516 55%, #F5D27B 76%, #16100A 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, rgba(255,231,166,0.4) 0%, transparent 28%), radial-gradient(circle at 76% 78%, rgba(9,35,73,0.32) 0%, transparent 34%), linear-gradient(160deg, #D4A23A 0%, #744818 55%, #140B04 100%)',
    plate: 'linear-gradient(180deg, rgba(255,231,166,0.94), rgba(166,108,36,0.9))',
    glow: 'rgba(255,215,128,0.32)',
  },
  SILVER: {
    name: 'SILVER',
    identity: 'Titanium Silver',
    material: 'Titanium, graphite, ice-blue reflection',
    primary: '#AEB8C4',
    highlight: '#F8FBFF',
    shadow: '#2F3540',
    accent: '#9ED8FF',
    ink: '#F8FBFF',
    surface: '#4A525D',
    frame: 'linear-gradient(145deg, #FFFFFF 0%, #D9E7F4 17%, #AEB8C4 32%, #3C434D 58%, #9ED8FF 78%, #111820 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, rgba(248,251,255,0.32) 0%, transparent 28%), radial-gradient(circle at 76% 78%, rgba(158,216,255,0.18) 0%, transparent 34%), linear-gradient(160deg, #68727D 0%, #252B34 52%, #080B10 100%)',
    plate: 'linear-gradient(180deg, rgba(52,59,68,0.92), rgba(10,13,18,0.95))',
    glow: 'rgba(158,216,255,0.26)',
  },
  BRONZE: {
    name: 'BRONZE',
    identity: 'Smoked Bronze',
    material: 'Copper, ember bronze, charcoal shadow',
    primary: '#B66A35',
    highlight: '#F1B37D',
    shadow: '#1E0E07',
    accent: '#E0793B',
    ink: '#FFF3E8',
    surface: '#5A321B',
    frame: 'linear-gradient(145deg, #FFD0A5 0%, #E0793B 16%, #B66A35 34%, #4B2412 58%, #F1B37D 78%, #140704 100%)',
    backdrop:
      'radial-gradient(circle at 30% 12%, rgba(241,179,125,0.32) 0%, transparent 28%), radial-gradient(circle at 76% 78%, rgba(224,121,59,0.18) 0%, transparent 34%), linear-gradient(160deg, #8D4B26 0%, #3B2112 54%, #100805 100%)',
    plate: 'linear-gradient(180deg, rgba(81,43,22,0.92), rgba(22,11,6,0.95))',
    glow: 'rgba(224,121,59,0.26)',
  },
};

export function getTierStyle(tier?: Tier | string | null): TierVisualStyle {
  return TIER_STYLES[(tier as Tier) || 'SILVER'] ?? TIER_STYLES.SILVER;
}
