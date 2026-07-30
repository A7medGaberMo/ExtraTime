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

  const cleanName = clubName?.trim() || "";
  const lowerName = cleanName.toLowerCase();

  // Special handling for Icon/Legend teams -> Metallic Gold ET Logo
  const isIconTeam =
    lowerName === "icon" ||
    lowerName === "icons" ||
    lowerName === "global legends" ||
    lowerName === "legend" ||
    lowerName === "legends" ||
    lowerName === "icon club" ||
    lowerName === "icons club";

  if (isIconTeam) {
    return (
      <div
        className={cn(
          'relative w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-950/80 border border-amber-400/50 p-1 flex items-center justify-center shadow-lg backdrop-blur-md transition-transform group-hover:scale-105 shrink-0',
          className
        )}
        title="Global Icons & Legends"
      >
        <img
          src="/logos/et-logo-metallic-gold.svg"
          alt="Icon Team"
          className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(212,175,55,0.7)]"
        />
      </div>
    );
  }

  // Retrieve logo from clubLogoUrl or dictionary
  let logoSrc = clubLogoUrl;
  if (!logoSrc || logoSrc.includes("logos/clubs/icon.png") || logoSrc.includes("logos/clubs/global-legends.png") || logoSrc.includes("logos/clubs/")) {
    logoSrc = clubLogos[cleanName];
    if (!logoSrc) {
      const normKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      logoSrc = clubLogos[normKey];
    }
  }

  return (
    <div
      className={cn(
        'relative w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-950/70 border border-white/25 p-1 flex items-center justify-center shadow-lg backdrop-blur-md transition-transform group-hover:scale-105 shrink-0',
        className
      )}
      title={clubName}
    >
      {logoSrc && !error ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoSrc}
          alt={clubName}
          crossOrigin="anonymous"
          onError={() => setError(true)}
          className="w-full h-full object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
        />
      ) : (
        <div className="flex items-center justify-center text-white/80 font-black text-[9px] uppercase tracking-tighter">
          <Shield className="w-3.5 h-3.5 text-white/80" />
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
    'England': 'gb-eng',
    'Scotland': 'gb-sct',
    'Wales': 'gb-wls',
    'Northern Ireland': 'gb-nir',
    'France': 'fr',
    'Spain': 'es',
    'Brazil': 'br',
    'Argentina': 'ar',
    'Belgium': 'be',
    'Netherlands': 'nl',
    'Germany': 'de',
    'Portugal': 'pt',
    'Italy': 'it',
    'Egypt': 'eg',
    'Norway': 'no',
    'Uruguay': 'uy',
    'Croatia': 'hr',
    'Senegal': 'sn',
    'Japan': 'jp',
    'Sweden': 'se',
    'Korea Republic': 'kr',
    'South Korea': 'kr',
    'Russia': 'ru',
    'Soviet Union': 'ru',
    'USSR': 'ru',
    'Bulgaria': 'bg',
    'Cameroon': 'cm',
    'Chile': 'cl',
    'Costa Rica': 'cr',
    'Czech Republic': 'cz',
    'Denmark': 'dk',
    'Hungary': 'hu',
    'Ivory Coast': 'ci',
    'Mexico': 'mx',
    'Republic of Ireland': 'ie',
    'Ireland': 'ie',
    'Serbia': 'rs',
    'Slovakia': 'sk',
    'Ukraine': 'ua',
    'Poland': 'pl',
    'Colombia': 'co',
    'Morocco': 'ma',
    'Nigeria': 'ng',
    'Ghana': 'gh',
    'Algeria': 'dz',
    'United States': 'us',
    'USA': 'us',
    'Turkey': 'tr',
    'Austria': 'at',
    'Switzerland': 'ch',
    'Greece': 'gr',
    'Georgia': 'ge',
  };

  const iso = countryIso[nationName] || 'gb';
  const logoSrc = flagUrl || `https://flagcdn.com/w40/${iso}.png`;

  return (
    <div
      className={cn(
        'relative w-7 h-5 md:w-8 md:h-5 rounded-md bg-slate-950/70 border border-white/25 overflow-hidden flex items-center justify-center shadow-lg backdrop-blur-md transition-transform group-hover:scale-105 shrink-0',
        className
      )}
      title={nationName}
    >
      {!error ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={logoSrc}
          alt={nationName}
          crossOrigin="anonymous"
          onError={() => setError(true)}
          className="w-full h-full object-cover filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        />
      ) : (
        <Flag className="w-3 h-3 text-white/80" />
      )}
    </div>
  );
}
