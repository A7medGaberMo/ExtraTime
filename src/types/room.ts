import type { GameType } from './game';

/** Room lifecycle states */
export type RoomStatus = 'waiting' | 'ready' | 'in_progress' | 'completed' | 'abandoned';

/** Frontend representation of a game room */
export interface Room {
  id: string;
  code: string;
  hostId: string;
  hostNickname?: string;
  guestId?: string;
  guestNickname?: string;
  gameType: GameType;
  status: RoomStatus;
  createdAt: number;
}

/** Guest user (temporary, no auth) */
export interface GuestUser {
  id: string;
  nickname: string;
  avatarSeed: string;
  createdAt: number;
  lastActiveAt: number;
}
