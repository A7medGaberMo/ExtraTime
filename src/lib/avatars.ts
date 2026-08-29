/**
 * Unified Avatar Domain Module — Apple HIG Aesthetic
 * Supports:
 * 1. Illustrated Character Personas (Creative football manager/player vector avatars)
 * 2. Official Club Logos & Crests
 * 3. Minimal Tactical Colorway Monograms
 */

export interface CharacterPersona {
  id: string;
  nameEn: string;
  nameAr: string;
  avatarUrl: string;
  gradient: string;
  border: string;
  glow: string;
}

export const CHARACTER_PERSONAS: CharacterPersona[] = [
  {
    id: 'persona-tactician',
    nameEn: 'The Tactician',
    nameAr: 'مايسترو التكتيك',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%23020617"/><rect x="4" y="4" width="92" height="92" rx="24" stroke="%2384cc16" stroke-width="2" stroke-opacity="0.4"/><path d="M20 50h60M50 20v60M50 50m-14 0a14 14 0 1 0 28 0a14 14 0 1 0-28 0" stroke="%2384cc16" stroke-width="2.5" stroke-dasharray="4 3" opacity="0.6"/><circle cx="32" cy="36" r="5" fill="%2384cc16"/><circle cx="68" cy="36" r="5" fill="%2384cc16"/><circle cx="50" cy="68" r="6" fill="%2384cc16"/><path d="M36 40l10 22M64 40l-10 22" stroke="%2384cc16" stroke-width="2.5" stroke-linecap="round"/></svg>',
    gradient: 'from-lime-500/20 via-emerald-600/25 to-slate-950',
    border: 'border-lime/40',
    glow: 'shadow-[0_0_16px_rgba(142,224,0,0.25)]',
  },
  {
    id: 'persona-sniper',
    nameEn: 'Apex Striker',
    nameAr: 'القناص الذهبي',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%23020617"/><rect x="4" y="4" width="92" height="92" rx="24" stroke="%23fbbf24" stroke-width="2" stroke-opacity="0.4"/><circle cx="50" cy="50" r="28" stroke="%23fbbf24" stroke-width="2" stroke-opacity="0.3"/><circle cx="50" cy="50" r="18" stroke="%23fbbf24" stroke-width="2.5"/><circle cx="50" cy="50" r="6" fill="%23fbbf24"/><path d="M50 14v12M50 74v12M14 50h12M74 50h12" stroke="%23fbbf24" stroke-width="3" stroke-linecap="round"/><polygon points="50,30 55,42 67,42 57,50 61,62 50,54 39,62 43,50 33,42 45,42" fill="%23fbbf24" opacity="0.25"/></svg>',
    gradient: 'from-amber-400/20 via-orange-600/25 to-slate-950',
    border: 'border-amber-400/40',
    glow: 'shadow-[0_0_16px_rgba(251,191,36,0.25)]',
  },
  {
    id: 'persona-guardian',
    nameEn: 'The Wall',
    nameAr: 'الحارس الحديدي',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%23020617"/><rect x="4" y="4" width="92" height="92" rx="24" stroke="%2338bdf8" stroke-width="2" stroke-opacity="0.4"/><path d="M50 20L76 30v22c0 18-12 30-26 36-14-6-26-18-26-36V30L50 20z" fill="%230369a1" fill-opacity="0.3" stroke="%2338bdf8" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="46" r="12" stroke="%2338bdf8" stroke-width="2.5"/><path d="M50 34v24M38 46h24M42 38l16 16M58 38l-16 16" stroke="%2338bdf8" stroke-width="1.5"/></svg>',
    gradient: 'from-sky-400/20 via-blue-600/25 to-slate-950',
    border: 'border-sky-400/40',
    glow: 'shadow-[0_0_16px_rgba(56,189,248,0.25)]',
  },
  {
    id: 'persona-captain',
    nameEn: 'Team Captain',
    nameAr: 'القائد الميداني',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%23020617"/><rect x="4" y="4" width="92" height="92" rx="24" stroke="%23fb7185" stroke-width="2" stroke-opacity="0.4"/><rect x="24" y="38" width="52" height="36" rx="8" fill="%23e11d48" fill-opacity="0.25" stroke="%23fb7185" stroke-width="2.5"/><path d="M50 22l6 10 10-6-3 12H37l-3-12 10 6 6-10z" fill="%23fb7185"/><text x="50" y="64" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="%23fb7185" text-anchor="middle">C</text></svg>',
    gradient: 'from-rose-500/20 via-red-600/25 to-slate-950',
    border: 'border-rose-400/40',
    glow: 'shadow-[0_0_16px_rgba(251,113,133,0.25)]',
  },
  {
    id: 'persona-magician',
    nameEn: 'El Mago',
    nameAr: 'صانع الألعاب الساحر',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%23020617"/><rect x="4" y="4" width="92" height="92" rx="24" stroke="%23c084fc" stroke-width="2" stroke-opacity="0.4"/><circle cx="50" cy="50" r="22" stroke="%23c084fc" stroke-width="2.5" fill="%23581c87" fill-opacity="0.3"/><polygon points="50,34 54,44 64,45 56,52 59,62 50,56 41,62 44,52 36,45 46,44" fill="%23c084fc"/><path d="M26 26l6 6M74 26l-6 6M26 74l6-6M74 74l-6-6" stroke="%23c084fc" stroke-width="2.5" stroke-linecap="round"/></svg>',
    gradient: 'from-purple-500/20 via-indigo-600/25 to-slate-950',
    border: 'border-purple-400/40',
    glow: 'shadow-[0_0_16px_rgba(192,132,252,0.25)]',
  },
  {
    id: 'persona-legend',
    nameEn: 'The Legend',
    nameAr: 'الأسطورة الخالدة',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="28" fill="%23020617"/><rect x="4" y="4" width="92" height="92" rx="24" stroke="%23facc15" stroke-width="2" stroke-opacity="0.4"/><path d="M34 32h32v18c0 10-6 16-16 16s-16-6-16-16V32z" fill="%23713f12" fill-opacity="0.4" stroke="%23facc15" stroke-width="2.5"/><path d="M50 66v10M38 76h24M34 38H24c0 8 4 12 10 12M66 38h10c0 8-4 12-10 12" stroke="%23facc15" stroke-width="2.5" stroke-linecap="round"/><polygon points="50,38 52,43 57,43 53,46 55,51 50,48 45,51 47,46 43,43 48,43" fill="%23facc15"/></svg>',
    gradient: 'from-yellow-400/20 via-amber-600/25 to-slate-950',
    border: 'border-yellow-400/40',
    glow: 'shadow-[0_0_16px_rgba(250,204,21,0.25)]',
  },
];

export interface AvatarPreset {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  gradient: string;
  border: string;
  text: string;
  glow: string;
  ring: string;
  accentHex: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'seed-1',
    nameEn: 'Emerald Pitch',
    nameAr: 'العشب الزمردي',
    roleEn: 'Maestro',
    roleAr: 'مايسترو الميدان',
    gradient: 'from-lime-500/25 via-emerald-600/30 to-slate-950',
    border: 'border-lime/50',
    text: 'text-lime',
    glow: 'shadow-[0_0_20px_rgba(142,224,0,0.25)]',
    ring: 'ring-lime',
    accentHex: '#8ee000',
  },
  {
    id: 'seed-2',
    nameEn: 'Cyan Voltage',
    nameAr: 'الشرارة السماوية',
    roleEn: 'Playmaker',
    roleAr: 'صانع الألعاب',
    gradient: 'from-sky-400/25 via-blue-600/30 to-slate-950',
    border: 'border-sky-400/50',
    text: 'text-sky-400',
    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.25)]',
    ring: 'ring-sky-400',
    accentHex: '#38bdf8',
  },
  {
    id: 'seed-3',
    nameEn: 'Royal Violet',
    nameAr: 'البنفسج الملكي',
    roleEn: 'Architect',
    roleAr: 'المهندس التكتيكي',
    gradient: 'from-purple-500/25 via-indigo-600/30 to-slate-950',
    border: 'border-purple-400/50',
    text: 'text-purple-300',
    glow: 'shadow-[0_0_20px_rgba(192,132,252,0.25)]',
    ring: 'ring-purple-400',
    accentHex: '#c084fc',
  },
  {
    id: 'seed-4',
    nameEn: 'Solar Gold',
    nameAr: 'الذهب الشمسي',
    roleEn: 'Finisher',
    roleAr: 'الهداف الحاسم',
    gradient: 'from-amber-400/25 via-orange-600/30 to-slate-950',
    border: 'border-amber-400/50',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.25)]',
    ring: 'ring-amber-400',
    accentHex: '#fbbf24',
  },
  {
    id: 'seed-5',
    nameEn: 'Crimson Strike',
    nameAr: 'الصاعقة القرمزية',
    roleEn: 'Vanguard',
    roleAr: 'المهاجم الشامل',
    gradient: 'from-rose-500/25 via-red-600/30 to-slate-950',
    border: 'border-rose-400/50',
    text: 'text-rose-300',
    glow: 'shadow-[0_0_20px_rgba(251,113,133,0.25)]',
    ring: 'ring-rose-400',
    accentHex: '#fb7185',
  },
  {
    id: 'seed-6',
    nameEn: 'Titanium Slate',
    nameAr: 'الدرع الفولاذي',
    roleEn: 'Anchor',
    roleAr: 'صخرة الدفاع',
    gradient: 'from-slate-400/25 via-zinc-600/30 to-slate-950',
    border: 'border-slate-300/50',
    text: 'text-slate-200',
    glow: 'shadow-[0_0_20px_rgba(203,213,225,0.2)]',
    ring: 'ring-slate-300',
    accentHex: '#cbd5e1',
  },
  {
    id: 'seed-7',
    nameEn: 'Electric Coral',
    nameAr: 'المرجان المتوهج',
    roleEn: 'Catalyst',
    roleAr: 'محرك الإيقاع',
    gradient: 'from-fuchsia-500/25 via-pink-600/30 to-slate-950',
    border: 'border-fuchsia-400/50',
    text: 'text-fuchsia-300',
    glow: 'shadow-[0_0_20px_rgba(232,121,249,0.25)]',
    ring: 'ring-fuchsia-400',
    accentHex: '#e879f9',
  },
  {
    id: 'seed-8',
    nameEn: 'Arctic Frost',
    nameAr: 'الجليد القطبي',
    roleEn: 'Interceptor',
    roleAr: 'قاطع الكرات',
    gradient: 'from-teal-400/25 via-cyan-600/30 to-slate-950',
    border: 'border-teal-400/50',
    text: 'text-teal-300',
    glow: 'shadow-[0_0_20px_rgba(45,212,191,0.25)]',
    ring: 'ring-teal-400',
    accentHex: '#2dd4bf',
  },
  {
    id: 'seed-9',
    nameEn: 'Obsidian Noir',
    nameAr: 'الأوبسيديان النادر',
    roleEn: 'Strategist',
    roleAr: 'العقل المدبر',
    gradient: 'from-zinc-500/25 via-neutral-700/30 to-slate-950',
    border: 'border-white/30',
    text: 'text-white',
    glow: 'shadow-[0_0_20px_rgba(255,255,255,0.15)]',
    ring: 'ring-white/80',
    accentHex: '#ffffff',
  },
  {
    id: 'seed-10',
    nameEn: 'Midnight Azure',
    nameAr: 'الأزرق الفلكي',
    roleEn: 'Regista',
    roleAr: 'ريجيستا المحور',
    gradient: 'from-indigo-400/25 via-blue-800/30 to-slate-950',
    border: 'border-indigo-400/50',
    text: 'text-indigo-300',
    glow: 'shadow-[0_0_20px_rgba(129,140,248,0.25)]',
    ring: 'ring-indigo-400',
    accentHex: '#818cf8',
  },
  {
    id: 'seed-11',
    nameEn: 'Imperial Gold',
    nameAr: 'الذهب الإمبراطوري',
    roleEn: 'Champion',
    roleAr: 'القائد المظفر',
    gradient: 'from-yellow-400/25 via-amber-600/30 to-slate-950',
    border: 'border-yellow-400/50',
    text: 'text-yellow-300',
    glow: 'shadow-[0_0_20px_rgba(250,204,21,0.25)]',
    ring: 'ring-yellow-400',
    accentHex: '#facc15',
  },
  {
    id: 'seed-12',
    nameEn: 'Aurora Mint',
    nameAr: 'الشفق الأخضر',
    roleEn: 'Sweeper',
    roleAr: 'قشاش الفريق',
    gradient: 'from-emerald-400/25 via-green-700/30 to-slate-950',
    border: 'border-emerald-400/50',
    text: 'text-emerald-300',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.25)]',
    ring: 'ring-emerald-400',
    accentHex: '#34d399',
  },
];

const PRESET_MAP = new Map<string, AvatarPreset>(AVATAR_PRESETS.map((p) => [p.id, p]));
const PERSONA_MAP = new Map<string, CharacterPersona>(CHARACTER_PERSONAS.map((p) => [p.id, p]));

export function getAvatarMeta(seed?: string): AvatarPreset {
  if (!seed) return AVATAR_PRESETS[0];

  const direct = PRESET_MAP.get(seed);
  if (direct) return direct;

  const cleanSeed = seed.startsWith('club:')
    ? seed.replace(/^club:/, '').split('::')[0]
    : seed.startsWith('persona-')
      ? seed.replace(/^persona-/, '')
      : seed;

  let hash = 0;
  for (let i = 0; i < cleanSeed.length; i++) {
    hash = (hash << 5) - hash + cleanSeed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PRESETS.length;
  return AVATAR_PRESETS[index];
}

export interface ParsedAvatar {
  isClub: boolean;
  isPersona: boolean;
  clubName?: string;
  clubLogoUrl?: string;
  persona?: CharacterPersona;
  avatarUrl?: string;
  meta: AvatarPreset;
}

export function parseAvatarSeed(seed?: string): ParsedAvatar {
  if (!seed) {
    return { isClub: false, isPersona: false, meta: AVATAR_PRESETS[0] };
  }

  // Character Persona Check
  if (seed.startsWith('persona-')) {
    const persona = PERSONA_MAP.get(seed);
    if (persona) {
      return {
        isClub: false,
        isPersona: true,
        persona,
        avatarUrl: persona.avatarUrl,
        meta: getAvatarMeta(persona.nameEn),
      };
    }
  }

  // Club Crest Check
  if (seed.startsWith('club:')) {
    const raw = seed.slice(5);
    const [clubName, logoUrl] = raw.split('::');
    return {
      isClub: true,
      isPersona: false,
      clubName,
      clubLogoUrl: logoUrl ? decodeURIComponent(logoUrl) : undefined,
      avatarUrl: logoUrl ? decodeURIComponent(logoUrl) : undefined,
      meta: getAvatarMeta(clubName),
    };
  }

  return {
    isClub: false,
    isPersona: false,
    meta: getAvatarMeta(seed),
  };
}

export function encodeClubAvatarSeed(clubName: string, logoUrl?: string): string {
  return logoUrl ? `club:${clubName}::${encodeURIComponent(logoUrl)}` : `club:${clubName}`;
}

export function getMonogramInitial(name?: string, maxChars: 1 | 2 = 2): string {
  if (!name || !name.trim()) return 'ET';
  const clean = name.trim();
  const words = clean.split(/[\s_-]+/).filter(Boolean);
  if (words.length >= 2 && maxChars === 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, maxChars).toUpperCase();
}
