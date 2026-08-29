import { describe, it, expect } from 'vitest';

describe('Match History Attribution & Scalar Index Merging', () => {
  interface GameResult {
    _id: string;
    gameType: 'snipe' | 'rank';
    player1UserId?: string;
    player2UserId?: string;
    player1GuestId: string;
    player2GuestId?: string;
    player1Score: number;
    player2Score: number;
    winnerUserId?: string;
    isDraw: boolean;
    completedAt: number;
  }

  it('should correctly filter and merge matches for a player across player1 and player2 slots', () => {
    const currentUserId = 'user_abc';

    const matches: GameResult[] = [
      {
        _id: 'm1',
        gameType: 'snipe',
        player1UserId: 'user_abc',
        player2UserId: 'user_xyz',
        player1GuestId: 'g1',
        player2GuestId: 'g2',
        player1Score: 3,
        player2Score: 1,
        winnerUserId: 'user_abc',
        isDraw: false,
        completedAt: 1000,
      },
      {
        _id: 'm2',
        gameType: 'rank',
        player1UserId: 'user_other',
        player2UserId: 'user_abc',
        player1GuestId: 'g3',
        player2GuestId: 'g4',
        player1Score: 20,
        player2Score: 25,
        winnerUserId: 'user_abc',
        isDraw: false,
        completedAt: 2000,
      },
      {
        _id: 'm3',
        gameType: 'snipe',
        player1UserId: 'user_guest1',
        player2UserId: 'user_guest2',
        player1GuestId: 'g5',
        player2GuestId: 'g6',
        player1Score: 2,
        player2Score: 2,
        isDraw: true,
        completedAt: 3000,
      },
    ];

    // Simulate query on player1 and player2 indexes
    const p1Matches = matches.filter((m) => m.player1UserId === currentUserId);
    const p2Matches = matches.filter((m) => m.player2UserId === currentUserId);

    const merged = [...p1Matches, ...p2Matches].sort((a, b) => b.completedAt - a.completedAt);

    expect(merged).toHaveLength(2);
    expect(merged[0]._id).toBe('m2'); // completedAt: 2000
    expect(merged[1]._id).toBe('m1'); // completedAt: 1000
    expect(merged.some((m) => m._id === 'm3')).toBe(false); // Unrelated match excluded
  });
});
