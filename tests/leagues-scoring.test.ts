import { describe, it, expect } from 'vitest';

describe('Leagues Scoring & Multi-Tier Tiebreakers', () => {
  interface MemberStats {
    userId: string;
    displayName: string;
    snipeStats: {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDiff: number;
      points: number;
    };
    rankStats: {
      played: number;
      won: number;
      drawn: number;
      lost: number;
      scoreFor: number;
      scoreAgainst: number;
      scoreDiff: number;
      totalScore: number;
      points: number;
    };
    combinedPoints: number;
    joinedAt: number;
  }

  it('should calculate 3 points for win, 1 for draw, 0 for loss', () => {
    const calculatePoints = (myScore: number, opponentScore: number) => {
      if (myScore > opponentScore) return 3;
      if (myScore === opponentScore) return 1;
      return 0;
    };

    expect(calculatePoints(3, 1)).toBe(3);
    expect(calculatePoints(2, 2)).toBe(1);
    expect(calculatePoints(0, 1)).toBe(0);
  });

  it('should sort Snipe table by Points DESC -> Wins DESC -> Goal Diff DESC -> Goals For DESC -> Joined ASC', () => {
    const members: MemberStats[] = [
      {
        userId: 'u1',
        displayName: 'Player A',
        snipeStats: { played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 10, goalsAgainst: 5, goalDiff: 5, points: 10 },
        rankStats: { played: 0, won: 0, drawn: 0, lost: 0, scoreFor: 0, scoreAgainst: 0, scoreDiff: 0, totalScore: 0, points: 0 },
        combinedPoints: 10,
        joinedAt: 1000,
      },
      {
        userId: 'u2',
        displayName: 'Player B (Higher GD)',
        snipeStats: { played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 12, goalsAgainst: 4, goalDiff: 8, points: 10 },
        rankStats: { played: 0, won: 0, drawn: 0, lost: 0, scoreFor: 0, scoreAgainst: 0, scoreDiff: 0, totalScore: 0, points: 0 },
        combinedPoints: 10,
        joinedAt: 2000,
      },
      {
        userId: 'u3',
        displayName: 'Player C (More points)',
        snipeStats: { played: 5, won: 4, drawn: 0, lost: 1, goalsFor: 11, goalsAgainst: 3, goalDiff: 8, points: 12 },
        rankStats: { played: 0, won: 0, drawn: 0, lost: 0, scoreFor: 0, scoreAgainst: 0, scoreDiff: 0, totalScore: 0, points: 0 },
        combinedPoints: 12,
        joinedAt: 3000,
      },
    ];

    const sortedSnipe = [...members].sort((a, b) => {
      if (b.snipeStats.points !== a.snipeStats.points) return b.snipeStats.points - a.snipeStats.points;
      if (b.snipeStats.won !== a.snipeStats.won) return b.snipeStats.won - a.snipeStats.won;
      if (b.snipeStats.goalDiff !== a.snipeStats.goalDiff) return b.snipeStats.goalDiff - a.snipeStats.goalDiff;
      if (b.snipeStats.goalsFor !== a.snipeStats.goalsFor) return b.snipeStats.goalsFor - a.snipeStats.goalsFor;
      return a.joinedAt - b.joinedAt;
    });

    expect(sortedSnipe[0].userId).toBe('u3'); // 12 pts
    expect(sortedSnipe[1].userId).toBe('u2'); // 10 pts, +8 GD
    expect(sortedSnipe[2].userId).toBe('u1'); // 10 pts, +5 GD
  });

  it('should sort Rank table by Points DESC -> Wins DESC -> Score Diff DESC -> Total Score DESC', () => {
    const members: MemberStats[] = [
      {
        userId: 'u1',
        displayName: 'Player A',
        snipeStats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
        rankStats: { played: 3, won: 2, drawn: 0, lost: 1, scoreFor: 45, scoreAgainst: 30, scoreDiff: 15, totalScore: 45, points: 6 },
        combinedPoints: 6,
        joinedAt: 1000,
      },
      {
        userId: 'u2',
        displayName: 'Player B (Higher Score Diff)',
        rankStats: { played: 3, won: 2, drawn: 0, lost: 1, scoreFor: 52, scoreAgainst: 32, scoreDiff: 20, totalScore: 52, points: 6 },
        snipeStats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
        combinedPoints: 6,
        joinedAt: 2000,
      },
    ];

    const sortedRank = [...members].sort((a, b) => {
      if (b.rankStats.points !== a.rankStats.points) return b.rankStats.points - a.rankStats.points;
      if (b.rankStats.won !== a.rankStats.won) return b.rankStats.won - a.rankStats.won;
      if (b.rankStats.scoreDiff !== a.rankStats.scoreDiff) return b.rankStats.scoreDiff - a.rankStats.scoreDiff;
      if (b.rankStats.totalScore !== a.rankStats.totalScore) return b.rankStats.totalScore - a.rankStats.totalScore;
      return a.joinedAt - b.joinedAt;
    });

    expect(sortedRank[0].userId).toBe('u2'); // +20 ScoreDiff
    expect(sortedRank[1].userId).toBe('u1'); // +15 ScoreDiff
  });
});
