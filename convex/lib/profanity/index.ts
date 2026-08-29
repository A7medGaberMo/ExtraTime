/**
 * Bilingual Profanity & Inappropriate Content Moderation Engine
 * Supports Arabic (native script, dialectal variations, tashkeel, tatweel) and English (leetspeak, variations).
 */

const RESERVED_HANDLES = new Set([
  'admin',
  'administrator',
  'extratime',
  'official',
  'support',
  'system',
  'moderator',
  'mod',
  'staff',
  'root',
  'guest',
  'server',
  'bot',
  'null',
  'undefined',
  'api',
  'help',
  'security',
  'extratimeapp',
]);

const ENGLISH_BLOCKED_TERMS = [
  'nigger',
  'nigga',
  'faggot',
  'fag',
  'cunt',
  'whore',
  'slut',
  'bitch',
  'bastard',
  'asshole',
  'dickhead',
  'pussy',
  'cock',
  'retard',
  'kike',
  'spic',
  'chink',
  'hitler',
  'nazi',
  'pedophile',
  'pedo',
  'porn',
  'sex',
  'fuck',
  'shit',
];

const ARABIC_BLOCKED_TERMS = [
  'شرموط',
  'شرموطه',
  'قحبه',
  'قحبة',
  'منيوك',
  'ديوث',
  'كس',
  'طيز',
  'زب',
  'عرص',
  'خول',
  'متناك',
  'نيك',
  'يلعن',
  'ابن الكلب',
  'ابن القحبه',
  'ابن الحرام',
  'سكس',
  'بورن',
  'ارهاب',
  'داعش',
  'قذر',
  'وسخ',
];

/**
 * Normalizes English text by converting leetspeak to standard letters.
 */
function normalizeEnglish(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[@4]/g, 'a')
    .replace(/[$5]/g, 's')
    .replace(/[7+]/g, 't')
    .replace(/[8]/g, 'b')
    .replace(/[^a-z]/g, '');
}

/**
 * Normalizes Arabic text by stripping diacritics (tashkeel), tatweel, and normalizing letter forms.
 */
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // Tashkeel / Harakat
    .replace(/\u0640/g, '') // Tatweel
    .replace(/[أإآٱ]/g, 'ا') // Alef forms
    .replace(/ة/g, 'ه') // Taa marbuta
    .replace(/ى/g, 'ي') // Alef maqsura
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[\s\-_.]+/g, '');
}

/**
 * Checks if a username is in the reserved system handles list.
 */
export function isReservedHandle(handle: string): boolean {
  const clean = handle.toLowerCase().trim();
  return RESERVED_HANDLES.has(clean);
}

/**
 * Checks if given text contains profane or offensive terms in English or Arabic.
 */
export function isProfane(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const rawLower = text.toLowerCase();
  const normalizedEn = normalizeEnglish(text);
  const normalizedAr = normalizeArabic(text);

  // Check English blocked terms
  for (const word of ENGLISH_BLOCKED_TERMS) {
    if (rawLower.includes(word) || normalizedEn.includes(word)) {
      return true;
    }
  }

  // Check Arabic blocked terms
  for (const word of ARABIC_BLOCKED_TERMS) {
    const normWord = normalizeArabic(word);
    if (text.includes(word) || normalizedAr.includes(normWord)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns true if text passes moderation (clean and not profane).
 */
export function validateCleanText(text: string): boolean {
  return !isProfane(text);
}
