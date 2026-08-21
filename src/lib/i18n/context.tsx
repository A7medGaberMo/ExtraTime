'use client';

import React, { createContext, useContext, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { en, type TranslationDictionary } from './dictionaries/en';
import { ar } from './dictionaries/ar';

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

interface I18nContextType {
  lang: Language;
  dir: Direction;
  isRTL: boolean;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  dict: TranslationDictionary;
}

const dictionaries: Record<Language, TranslationDictionary> = { en, ar };

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = 'extratime_lang';

function subscribeLang(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('extratime_lang_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('extratime_lang_change', callback);
  };
}

function getLangSnapshot(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ar') return stored;
    if (navigator.language?.startsWith('ar')) return 'ar';
  } catch {
    // fallback
  }
  return 'en';
}

function getServerLangSnapshot(): Language {
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, getLangSnapshot, getServerLangSnapshot);

  const dir: Direction = lang === 'ar' ? 'rtl' : 'ltr';
  const isRTL = dir === 'rtl';

  // Synchronize HTML lang and dir attributes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
      if (isRTL) {
        document.documentElement.classList.add('rtl');
        document.documentElement.classList.remove('ltr');
      } else {
        document.documentElement.classList.add('ltr');
        document.documentElement.classList.remove('rtl');
      }
    }
  }, [lang, dir, isRTL]);

  const setLang = useCallback((newLang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      window.dispatchEvent(new Event('extratime_lang_change'));
    } catch {
      // storage unavailable
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'ar' : 'en');
  }, [lang, setLang]);

  const dict = useMemo(() => dictionaries[lang], [lang]);

  // Dot-path key resolver with parameter interpolation
  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const keys = path.split('.');
      let current: unknown = dict;

      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = (current as Record<string, unknown>)[k];
        } else {
          // Fallback to English dictionary
          let fallback: unknown = en;
          for (const fbKey of keys) {
            if (fallback && typeof fallback === 'object' && fbKey in fallback) {
              fallback = (fallback as Record<string, unknown>)[fbKey];
            } else {
              return path; // return key if not found
            }
          }
          current = fallback;
          break;
        }
      }

      if (typeof current !== 'string') {
        return path;
      }

      if (!params) return current;

      let result = current;
      for (const [pKey, pVal] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
      return result;
    },
    [dict],
  );

  const contextValue = useMemo(
    () => ({
      lang,
      dir,
      isRTL,
      setLang,
      toggleLang,
      t,
      dict,
    }),
    [lang, dir, isRTL, setLang, toggleLang, t, dict],
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
