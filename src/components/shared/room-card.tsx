'use client';

import type { Room } from '@/types/room';
import { cn } from '@/lib/utils';
import { Users, Clock } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
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
        'group border-white/10 bg-slate-950/80 hover:border-lime/40 hover:shadow-lime/5 relative cursor-pointer overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:bg-slate-900 hover:shadow-lg select-none',
        className,
      )}
      {...props}
    >
      <div className="from-lime/0 absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-5" />

      <div className="relative mb-3 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-base">{gameConfig.icon}</span>
            <h3 className="font-bold text-white uppercase font-display">{gameConfig.label}</h3>
          </div>
          <p className="line-clamp-1 text-xs text-steel">{gameConfig.description}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase',
            statusConfig.color,
            room.status === 'waiting' && 'bg-lime/10',
            room.status === 'in_progress' && 'bg-amber-500/10',
            room.status === 'completed' && 'bg-slate-500/10',
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="relative flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-steel font-stats">
          <AppIcon icon={Users} size={14} weight="duotone" />
          <span className="text-xs font-black">{room.guestId ? '2/2' : '1/2'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-steel">
          <AppIcon icon={Clock} size={14} weight="duotone" />
          <span className="font-stats text-xs font-black tracking-wider text-slate-300">
            {room.code}
          </span>
        </div>
      </div>
    </div>
  );
}
