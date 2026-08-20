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
  hostColor = '#95E810',
  guestColor = '#F43F5E',
}: TacticalPitchViewProps) {
  const [tab, setTab] = useState<'host' | 'guest'>('host');
  const squad = tab === 'host' ? hostSquad : guestSquad;
  const rawTeamName = tab === 'host' ? hostName : guestName;
  const cleanTeamName = rawTeamName.replace(/^You \((.*)\)$/i, '$1');
  const accent = tab === 'host' ? hostColor : guestColor;

  return (
    <div className="space-y-3">
      <div className="inline-flex w-full rounded-lg border border-white/5 bg-slate-950 p-1">
        <button
          onClick={() => setTab('host')}
          className={`flex-1 rounded-md py-2 text-[10px] font-black tracking-wider uppercase transition-all duration-200 ${
            tab === 'host' ? 'bg-lime text-slate-950 shadow-md' : 'text-steel hover:text-white'
          }`}
        >
          {hostName}
        </button>
        <button
          onClick={() => setTab('guest')}
          className={`flex-1 rounded-md py-2 text-[10px] font-black tracking-wider uppercase transition-all duration-200 ${
            tab === 'guest' ? 'bg-rose-500 text-white shadow-md' : 'text-steel hover:text-white'
          }`}
        >
          {guestName}
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
      />
    </div>
  );
}
