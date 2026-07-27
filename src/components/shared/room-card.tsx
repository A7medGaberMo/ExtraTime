'use client';

import type { Room } from '@/types/room';
import { cn } from '@/lib/utils';
import { Users, Clock } from 'lucide-react';
import { GAME_TYPE_CONFIG, ROOM_STATUS_CONFIG } from '@/lib/constants';

interface RoomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  room: Room;
}

export function RoomCard({ room, className, ...props }: RoomCardProps) {
  const gameConfig = GAME_TYPE_CONFIG[room.gameType];
  const statusConfig = ROOM_STATUS_CONFIG[room.status];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/5 bg-[#121829] p-5 transition-all duration-300 hover:border-emerald-500/30 hover:bg-[#1a2035] hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer',
        className,
      )}
      {...props}
    >
      {/* Subtle gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-transparent opacity-0 transition-opacity group-hover:opacity-5" />

      <div className="relative flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">{gameConfig.icon}</span>
            <h3 className="font-bold text-white">{gameConfig.label}</h3>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1">{gameConfig.description}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            statusConfig.color,
            room.status === 'waiting' && 'bg-emerald-500/10',
            room.status === 'in_progress' && 'bg-amber-500/10',
            room.status === 'completed' && 'bg-slate-500/10',
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="relative flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Users className="h-3.5 w-3.5" />
          <span className="font-mono text-xs">
            {room.guestId ? '2/2' : '1/2'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono text-xs font-bold text-slate-300 tracking-wider">
            {room.code}
          </span>
        </div>
      </div>
    </div>
  );
}
