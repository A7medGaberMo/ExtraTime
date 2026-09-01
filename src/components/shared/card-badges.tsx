'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Shield, Flag } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';

import clubLogosJson from '@/lib/clubLogos.json';

const clubLogos: Record<string, string> = clubLogosJson;

interface ClubCrestProps {
  clubName: string;
  clubLogoUrl?: string;
  className?: string;
  imgClassName?: string;
}

export function ClubCrestBadge({ clubName, clubLogoUrl, className, imgClassName }: ClubCrestProps) {
  const [error, setError] = useState(false);

  const cleanName = clubName?.trim() || '';
  const lowerName = cleanName.toLowerCase();

  // Special handling for Icon/Legend teams -> Metallic Gold ET Logo
  const isIconTeam =
    lowerName === 'icon' ||
    lowerName === 'icons' ||
    lowerName === 'global legends' ||
    lowerName === 'legend' ||
    lowerName === 'legends' ||
    lowerName === 'icon club' ||
    lowerName === 'icons club';

  if (isIconTeam) {
    return (
      <div
        className={cn(
          'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-400/50 bg-slate-950/80 p-0.5 shadow-lg backdrop-blur-md transition-transform group-hover:scale-105',
          className,
        )}
        title="Global Icons & Legends"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/et-logo-metallic-gold.svg"
          alt="Icon Team"
          className={cn('h-full w-full max-h-full max-w-full object-contain drop-shadow-[0_0_6px_rgba(212,175,55,0.7)] filter', imgClassName)}
        />
      </div>
    );
  }

  // Retrieve logo from clubLogoUrl or dictionary
  let logoSrc = clubLogoUrl;
  if (
    !logoSrc ||
    logoSrc.includes('logos/clubs/icon.png') ||
    logoSrc.includes('logos/clubs/global-legends.png') ||
    logoSrc.includes('logos/clubs/')
  ) {
    logoSrc = clubLogos[cleanName];
    if (!logoSrc) {
      const normKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      logoSrc = clubLogos[normKey];
    }
  }

  return (
    <div
      className={cn(
        'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-slate-950/70 p-0.5 shadow-lg backdrop-blur-md transition-transform group-hover:scale-105',
        className,
      )}
      title={clubName}
    >
      {logoSrc && !error ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoSrc}
          alt={clubName}
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
          className={cn('h-full w-full max-h-full max-w-full object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] filter', imgClassName)}
        />
      ) : (
        <div className="flex items-center justify-center text-[9px] font-black tracking-tighter text-white/80 uppercase">
          <AppIcon icon={Shield} size={14} weight="duotone" className="text-white/80" />
        </div>
      )}
    </div>
  );
}

interface CountryFlagProps {
  nationName: string;
  flagUrl?: string;
  className?: string;
  imgClassName?: string;
}

export function CountryFlagBadge({ nationName, flagUrl, className, imgClassName }: CountryFlagProps) {
  const [error, setError] = useState(false);

  // Flag ISO codes map for Flagcdn
  const countryIso: Record<string, string> = {
    england: 'gb-eng',
    scotland: 'gb-sct',
    wales: 'gb-wls',
    'northern ireland': 'gb-nir',
    france: 'fr',
    spain: 'es',
    brazil: 'br',
    argentina: 'ar',
    belgium: 'be',
    netherlands: 'nl',
    germany: 'de',
    portugal: 'pt',
    italy: 'it',
    egypt: 'eg',
    mali: 'ml',
    norway: 'no',
    uruguay: 'uy',
    croatia: 'hr',
    senegal: 'sn',
    japan: 'jp',
    sweden: 'se',
    'korea republic': 'kr',
    'south korea': 'kr',
    russia: 'ru',
    'soviet union': 'ru',
    ussr: 'ru',
    bulgaria: 'bg',
    cameroon: 'cm',
    chile: 'cl',
    'costa rica': 'cr',
    'czech republic': 'cz',
    denmark: 'dk',
    hungary: 'hu',
    'ivory coast': 'ci',
    "côte d'ivoire": 'ci',
    'cote d ivoire': 'ci',
    mexico: 'mx',
    'republic of ireland': 'ie',
    ireland: 'ie',
    serbia: 'rs',
    slovakia: 'sk',
    ukraine: 'ua',
    poland: 'pl',
    colombia: 'co',
    morocco: 'ma',
    nigeria: 'ng',
    ghana: 'gh',
    algeria: 'dz',
    tunisia: 'tn',
    'south africa': 'za',
    'dr congo': 'cd',
    'congo dr': 'cd',
    'democratic republic of the congo': 'cd',
    congo: 'cg',
    'burkina faso': 'bf',
    guinea: 'gn',
    'guinea-bissau': 'gw',
    'equatorial guinea': 'gq',
    gabon: 'ga',
    zambia: 'zm',
    angola: 'ao',
    mozambique: 'mz',
    gambia: 'gm',
    'cape verde': 'cv',
    'cabo verde': 'cv',
    togo: 'tg',
    benin: 'bj',
    mauritania: 'mr',
    kenya: 'ke',
    zimbabwe: 'zw',
    uganda: 'ug',
    sudan: 'sd',
    libya: 'ly',
    madagascar: 'mg',
    'sierra leone': 'sl',
    liberia: 'lr',
    'central african republic': 'cf',
    comoros: 'km',
    'united states': 'us',
    usa: 'us',
    turkey: 'tr',
    austria: 'at',
    switzerland: 'ch',
    greece: 'gr',
    georgia: 'ge',
    australia: 'au',
    canada: 'ca',
    ecuador: 'ec',
    peru: 'pe',
    paraguay: 'py',
    venezuela: 've',
    romania: 'ro',
    'bosnia and herzegovina': 'ba',
    bosnia: 'ba',
    jamaica: 'jm',
    'trinidad and tobago': 'tt',
    'trinidad & tobago': 'tt',
    'saudi arabia': 'sa',
    iran: 'ir',
    finland: 'fi',
    montenegro: 'me',
    czechia: 'cz',
    türkiye: 'tr',
    slovenia: 'si',
    'north macedonia': 'mk',
    macedonia: 'mk',
    albania: 'al',
    iceland: 'is',
    israel: 'il',
    cyprus: 'cy',
    luxembourg: 'lu',
    'new zealand': 'nz',
    honduras: 'hn',
    panama: 'pa',
    'el salvador': 'sv',
    guatemala: 'gt',
    haiti: 'ht',
    suriname: 'sr',
    curacao: 'cw',
    curaçao: 'cw',
    china: 'cn',
    uzbekistan: 'uz',
    qatar: 'qa',
    'united arab emirates': 'ae',
    uae: 'ae',
    iraq: 'iq',
    syria: 'sy',
    jordan: 'jo',
    lebanon: 'lb',
    oman: 'om',
    kuwait: 'kw',
    bahrain: 'bh',
    palestine: 'ps',
    'united states of america': 'us',
    'great britain': 'gb',
    uk: 'gb',
    eng: 'gb-eng',
    fra: 'fr',
    esp: 'es',
    bra: 'br',
    arg: 'ar',
    ger: 'de',
    ita: 'it',
    por: 'pt',
    ned: 'nl',
    cro: 'hr',
    bel: 'be',
    sui: 'ch',
    aut: 'at',
    nor: 'no',
    den: 'dk',
    swe: 'se',
    pol: 'pl',
    uru: 'uy',
    col: 'co',
    mex: 'mx',
    mar: 'ma',
    egy: 'eg',
    sen: 'sn',
    nga: 'ng',
    ksa: 'sa',
    kor: 'kr',
    jpn: 'jp',
  };

  const cleanNation = (nationName || '').trim().toLowerCase();
  const iso = countryIso[cleanNation];
  const logoSrc = flagUrl || (iso ? `https://flagcdn.com/w160/${iso}.png` : null);

  return (
    <div
      className={cn(
        'relative flex h-5 w-7 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-white/25 bg-slate-950/70 shadow-lg backdrop-blur-md transition-transform group-hover:scale-105',
        className,
      )}
      title={nationName}
    >
      {logoSrc && !error ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoSrc}
          alt={nationName}
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
          className={cn('h-full w-full object-cover drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] filter', imgClassName)}
        />
      ) : (
        <AppIcon icon={Flag} size={12} weight="duotone" className="text-white/80" />
      )}
    </div>
  );
}
