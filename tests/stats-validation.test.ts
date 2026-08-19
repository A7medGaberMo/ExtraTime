import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getAllJsonFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results = results.concat(getAllJsonFiles(fullPath));
    } else if (item.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

const PLAYERS_ACTIVE_ROOT = path.join(process.cwd(), 'data', 'players', 'active');
const STATS_ACTIVE_ROOT = path.join(process.cwd(), 'data', 'stats', 'active');

describe('Player Career Stats Integrity & Accuracy Tests', () => {
  const activePlayerFiles = getAllJsonFiles(PLAYERS_ACTIVE_ROOT);
  const activeStatFiles = getAllJsonFiles(STATS_ACTIVE_ROOT);

  it('should have player files and stat files populated', () => {
    expect(activePlayerFiles.length).toBeGreaterThan(0);
    expect(activeStatFiles.length).toBeGreaterThan(0);
  });

  it('should ensure all career totals mathematically match the sum of club appearances and goals', () => {
    const mathErrors: string[] = [];

    for (const sFile of activeStatFiles) {
      const data = JSON.parse(fs.readFileSync(sFile, 'utf8'));
      let clubApps = 0;
      let clubGoals = 0;
      for (const c of data.clubs || []) {
        clubApps += Number(c.appearances) || 0;
        clubGoals += Number(c.goals) || 0;
      }
      const tApps = Number(data.careerTotal?.appearances) || 0;
      const tGoals = Number(data.careerTotal?.goals) || 0;

      if (tApps !== clubApps || tGoals !== clubGoals) {
        mathErrors.push(`${path.basename(sFile)}: expected ${clubApps}/${clubGoals}, got ${tApps}/${tGoals}`);
      }
    }

    expect(mathErrors).toEqual([]);
  });

  it('should ensure every active player has an exact matching career stats file with identical apiId', () => {
    const statsByApiId = new Set<number>();
    for (const sFile of activeStatFiles) {
      const data = JSON.parse(fs.readFileSync(sFile, 'utf8'));
      if (data.apiId) statsByApiId.add(Number(data.apiId));
    }

    const missingStats: string[] = [];
    for (const pFile of activePlayerFiles) {
      const content = JSON.parse(fs.readFileSync(pFile, 'utf8'));
      for (const p of content.players || []) {
        const apiId = Number(p.apiId);
        if (!statsByApiId.has(apiId)) {
          missingStats.push(`${p.name} (apiId: ${p.apiId}) in ${path.basename(pFile)}`);
        }
      }
    }

    expect(missingStats).toEqual([]);
  });

  it('should ensure there are no duplicate active player API IDs across the dataset', () => {
    const seen = new Set<number>();
    const duplicates: string[] = [];

    for (const pFile of activePlayerFiles) {
      const content = JSON.parse(fs.readFileSync(pFile, 'utf8'));
      for (const p of content.players || []) {
        const apiId = Number(p.apiId);
        if (seen.has(apiId)) {
          duplicates.push(`${p.name} (apiId: ${apiId}) in ${path.basename(pFile)}`);
        }
        seen.add(apiId);
      }
    }

    expect(duplicates).toEqual([]);
  });
});
