'use client';

import { useState } from 'react';
import { TacticalPitch, type TacticalSquadSlot } from '@/components/shared/tactical-pitch';

export interface PitchSquadPlayer {
  playerId: string;
  name: string;
  tier: string;
  position: string;
  imageUrl?: string;
  club?: string;
  nation?: string;
  isLegend?: boolean;
  kitNumber?: number;
  isSub?: boolean;
  rating?: number;
}

export interface TacticalPitchViewProps {
  formation: string;
  matchSize: 5 | 11;
  hostSquad: PitchSquadPlayer[];
  guestSquad: PitchSquadPlayer[];
  hostName: string;
  guestName: string;
  viewerIsHost?: boolean;
  defaultTab?: 'host' | 'guest';
  hostColor?: string;
  guestColor?: string;
}

function toSlots(squad: PitchSquadPlayer[]): TacticalSquadSlot[] {
  return squad.map((p) => ({
    position: p.position,
    player: {
      name: p.name,
      tier: p.tier,
      imageUrl: p.imageUrl,
      club: p.club,
      nation: p.nation,
      isLegend: p.isLegend,
      kitNumber: p.kitNumber,
    },
    isSub: p.isSub,
  }));
}

/** Standard pitch view that any game mode can feed into the Score Hub. */
export function TacticalPitchView({
  formation,
  matchSize,
  hostSquad,
  guestSquad,
  hostName,
  guestName,
  viewerIsHost = true,
  defaultTab,
  hostColor = '#95E810',
  guestColor = '#F43F5E',
}: TacticalPitchViewProps) {
  const initialTab = defaultTab ?? (viewerIsHost ? 'host' : 'guest');
  const [tab, setTab] = useState<'host' | 'guest'>(initialTab);
  const squad = tab === 'host' ? hostSquad : guestSquad;
  const rawTeamName = tab === 'host' ? hostName : guestName;
  const cleanTeamName = rawTeamName.replace(/^You \((.*)\)$/i, '$1');
  const accent = tab === 'host' ? hostColor : guestColor;

  return (
    <div className="space-y-3">
      <div className="inline-flex w-full rounded-xl border border-white/10 bg-slate-950/90 p-1 backdrop-blur-xl shadow-inner">
        <button
          type="button"
          onClick={() => setTab('host')}
          className={`flex-1 rounded-lg py-2 px-2 text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer font-stats ${
            tab === 'host'
              ? 'bg-lime text-slate-950 shadow-md shadow-lime/20 font-bold'
              : 'text-steel hover:text-white'
          }`}
        >
          {hostName} {viewerIsHost ? '(YOU)' : ''}
        </button>
        <button
          type="button"
          onClick={() => setTab('guest')}
          className={`flex-1 rounded-lg py-2 px-2 text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer font-stats ${
            tab === 'guest'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-bold'
              : 'text-steel hover:text-white'
          }`}
        >
          {guestName} {!viewerIsHost ? '(YOU)' : ''}
        </button>
      </div>
      <TacticalPitch
        formation={formation}
        matchSize={matchSize}
        squad={toSlots(squad)}
        totalRounds={
          formation === '1-2-1' || formation === '2-1-1' || formation === '1-1-2' ? 5 : 11
        }
        title={`${cleanTeamName}'s Lineup`}
        accentColor={accent}
        badgeLabel={tab === 'host' ? 'HOME SQUAD' : 'AWAY SQUAD'}
        compact={true}
      />
    </div>
  );
}
