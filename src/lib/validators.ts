import { z } from 'zod';
import { NICKNAME_MIN_LENGTH, NICKNAME_MAX_LENGTH, ROOM_CODE_LENGTH } from './constants';

/** Validate a guest nickname */
export const nicknameSchema = z
  .string()
  .min(NICKNAME_MIN_LENGTH, `Nickname must be at least ${NICKNAME_MIN_LENGTH} characters`)
  .max(NICKNAME_MAX_LENGTH, `Nickname must be at most ${NICKNAME_MAX_LENGTH} characters`)
  .regex(
    /^[a-zA-Z0-9_\-\s]+$/,
    'Nickname can only contain letters, numbers, spaces, hyphens, and underscores',
  );

/** Validate a room code */
export const roomCodeSchema = z
  .string()
  .length(ROOM_CODE_LENGTH, `Room code must be exactly ${ROOM_CODE_LENGTH} characters`)
  .regex(/^[A-Z0-9]+$/, 'Room code must be uppercase letters and numbers');

/** Room creation form schema */
export const createRoomSchema = z.object({
  nickname: nicknameSchema,
  gameType: z.literal('hidden_bid'),
  // TODO: Phase 2 — Add budget, formation, and other game settings
});

/** Join room form schema */
export const joinRoomSchema = z.object({
  nickname: nicknameSchema,
  roomCode: roomCodeSchema,
});

/** Inferred types from schemas */
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
