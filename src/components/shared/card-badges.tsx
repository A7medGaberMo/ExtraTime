'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Shield, Flag } from 'lucide-react';

interface ClubCrestProps {
  clubName: string;
  clubLogoUrl?: string;
  className?: string;
}

export function ClubCrestBadge({ clubName, clubLogoUrl, className }: ClubCrestProps) {
  const [error, setError] = useState(false);

  // Map known Premier League & European clubs to API logos if not explicitly provided
  const knownLogos: Record<string, string> = {
    'Arsenal': 'https://media.api-sports.io/football/teams/42.png',
    'Chelsea': 'https://media.api-sports.io/football/teams/49.png',
    'Liverpool': 'https://media.api-sports.io/football/teams/40.png',
    'Manchester City': 'https://media.api-sports.io/football/teams/50.png',
    'Man City': 'https://media.api-sports.io/football/teams/50.png',
    'Manchester United': 'https://media.api-sports.io/football/teams/33.png',
    'Man United': 'https://media.api-sports.io/football/teams/33.png',
    'Man Utd': 'https://media.api-sports.io/football/teams/33.png',
    'Real Madrid': 'https://media.api-sports.io/football/teams/541.png',
    'Barcelona': 'https://media.api-sports.io/football/teams/529.png',
    'FC Barcelona': 'https://media.api-sports.io/football/teams/529.png',
    'Atletico Madrid': 'https://media.api-sports.io/football/teams/530.png',
    'Atlético Madrid': 'https://media.api-sports.io/football/teams/530.png',
    'AC Milan': 'https://media.api-sports.io/football/teams/489.png',
    'Inter': 'https://media.api-sports.io/football/teams/505.png',
    'Inter Milan': 'https://media.api-sports.io/football/teams/505.png',
    'Bayern Munich': 'https://media.api-sports.io/football/teams/157.png',
    'PSG': 'https://media.api-sports.io/football/teams/85.png',
    'Paris Saint-Germain': 'https://media.api-sports.io/football/teams/85.png',
    'Dynamo Moscow': 'https://media.api-sports.io/football/teams/597.png',
    'Tottenham': 'https://media.api-sports.io/football/teams/47.png',
    'Newcastle': 'https://media.api-sports.io/football/teams/34.png',
    'Newcastle United': 'https://media.api-sports.io/football/teams/34.png',
    'Aston Villa': 'https://media.api-sports.io/football/teams/66.png',
    'Juventus': 'https://media.api-sports.io/football/teams/496.png',
    'Napoli': 'https://media.api-sports.io/football/teams/492.png',
    'SSC Napoli': 'https://media.api-sports.io/football/teams/492.png',
    'Roma': 'https://media.api-sports.io/football/teams/497.png',
    'Dortmund': 'https://media.api-sports.io/football/teams/165.png',
    'Borussia Dortmund': 'https://media.api-sports.io/football/teams/165.png',
    'Bayer Leverkusen': 'https://media.api-sports.io/football/teams/168.png',
    'Ajax': 'https://media.api-sports.io/football/teams/194.png',
    'Porto': 'https://media.api-sports.io/football/teams/212.png',
    'Benfica': 'https://media.api-sports.io/football/teams/211.png',
    'Sporting CP': 'https://media.api-sports.io/football/teams/228.png',
    'Santos FC': 'https://media.api-sports.io/football/teams/121.png',
    'Santos': 'https://media.api-sports.io/football/teams/121.png',
    'Botafogo': 'https://media.api-sports.io/football/teams/120.png',
    'Corinthians': 'https://media.api-sports.io/football/teams/131.png',
    'Flamengo': 'https://media.api-sports.io/football/teams/127.png',
    'Sevilla FC': 'https://media.api-sports.io/football/teams/536.png',
    'Sevilla': 'https://media.api-sports.io/football/teams/536.png',
  };

  const logoSrc = clubLogoUrl || knownLogos[clubName];

  return (
    <div
      className={cn(
        'relative w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-950/70 border border-white/25 p-1 flex items-center justify-center shadow-lg backdrop-blur-md transition-transform group-hover:scale-105 shrink-0',
        className
      )}
      title={clubName}
    >
      {logoSrc && !error ? (
        <img
          src={logoSrc}
          alt={clubName}
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
        <img
          src={logoSrc}
          alt={nationName}
          onError={() => setError(true)}
          className="w-full h-full object-cover filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        />
      ) : (
        <Flag className="w-3 h-3 text-white/80" />
      )}
    </div>
  );
}
