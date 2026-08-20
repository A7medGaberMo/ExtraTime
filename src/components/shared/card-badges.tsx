'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Shield, Flag } from 'lucide-react';

import clubLogosJson from '@/lib/clubLogos.json';

const clubLogos: Record<string, string> = clubLogosJson;

interface ClubCrestProps {
  clubName: string;
  clubLogoUrl?: string;
  className?: string;
}

export function ClubCrestBadge({ clubName, clubLogoUrl, className }: ClubCrestProps) {
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
          'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-400/50 bg-slate-950/80 p-1 shadow-lg backdrop-blur-md transition-transform group-hover:scale-105 md:h-8 md:w-8',
          className,
        )}
        title="Global Icons & Legends"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/et-logo-metallic-gold.svg"
          alt="Icon Team"
          className="h-full w-full object-contain drop-shadow-[0_0_6px_rgba(212,175,55,0.7)] filter"
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
        'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-slate-950/70 p-1 shadow-lg backdrop-blur-md transition-transform group-hover:scale-105 md:h-8 md:w-8',
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
          className="h-full w-full object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] filter"
        />
      ) : (
        <div className="flex items-center justify-center text-[9px] font-black tracking-tighter text-white/80 uppercase">
          <Shield className="h-3.5 w-3.5 text-white/80" />
        </div>
      )}
    </div>
  );
}

interface CountryFlagProps {
  nationName: string;
  flagUrl?: string;
  className?: string;
}

export function CountryFlagBadge({ nationName, flagUrl, className }: CountryFlagProps) {
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
  };

  const cleanNation = (nationName || '').trim().toLowerCase();
  const iso = countryIso[cleanNation];
  const logoSrc = flagUrl || (iso ? `https://flagcdn.com/w40/${iso}.png` : null);

  return (
    <div
      className={cn(
        'relative flex h-5 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/25 bg-slate-950/70 shadow-lg backdrop-blur-md transition-transform group-hover:scale-105 md:h-5 md:w-8',
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
          className="h-full w-full object-cover drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] filter"
        />
      ) : (
        <Flag className="h-3 w-3 text-white/80" />
      )}
    </div>
  );
}
