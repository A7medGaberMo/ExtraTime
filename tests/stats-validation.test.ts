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
const PLAYERS_LEGENDS_ROOT = path.join(process.cwd(), 'data', 'players', 'legends');
const RANK_DATA_ROOT = path.join(process.cwd(), 'data', 'rank');

describe('Player & Rank Dataset Integrity Tests', () => {
  const activePlayerFiles = getAllJsonFiles(PLAYERS_ACTIVE_ROOT);
  const legendPlayerFiles = getAllJsonFiles(PLAYERS_LEGENDS_ROOT);
  const rankJsonFiles = getAllJsonFiles(RANK_DATA_ROOT);

  it('should have active player files and legend files populated', () => {
    expect(activePlayerFiles.length).toBeGreaterThan(0);
    expect(legendPlayerFiles.length).toBeGreaterThan(0);
  });

  it('should ensure all active player files have valid JSON with required player schema', () => {
    let totalPlayers = 0;
    const errors: string[] = [];

    for (const pFile of activePlayerFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(pFile, 'utf8'));
        if (!content.club || !content.club.name) {
          errors.push(`${path.basename(pFile)}: missing club header`);
        }
        for (const p of content.players || []) {
          totalPlayers++;
          if (!p.name || typeof p.name !== 'string') {
            errors.push(`${path.basename(pFile)}: player missing name`);
          }
          if (p.apiId === undefined || typeof p.apiId !== 'number') {
            errors.push(`${path.basename(pFile)}: player ${p.name || 'unnamed'} missing numeric apiId`);
          }
          if (!p.position) {
            errors.push(`${path.basename(pFile)}: player ${p.name} missing position`);
          }
        }
      } catch (e) {
        errors.push(`${path.basename(pFile)}: failed to parse JSON (${String(e)})`);
      }
    }

    expect(errors).toEqual([]);
    expect(totalPlayers).toBeGreaterThan(500);
  });

  it('should ensure legends dataset contains valid player items', () => {
    let totalLegends = 0;
    const errors: string[] = [];

    for (const lFile of legendPlayerFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(lFile, 'utf8'));
        const players = Array.isArray(content) ? content : content.players || [];
        for (const p of players) {
          totalLegends++;
          if (!p.name) errors.push(`${path.basename(lFile)}: legend missing name`);
          if (!p.tier) errors.push(`${path.basename(lFile)}: legend ${p.name} missing tier`);
        }
      } catch (e) {
        errors.push(`${path.basename(lFile)}: failed to parse JSON (${String(e)})`);
      }
    }

    expect(errors).toEqual([]);
    expect(totalLegends).toBeGreaterThan(20);
  });

  it('should ensure all rank JSON files are parseable and well-structured', () => {
    expect(rankJsonFiles.length).toBeGreaterThan(0);
    const parseErrors: string[] = [];

    for (const rFile of rankJsonFiles) {
      try {
        const content = JSON.parse(fs.readFileSync(rFile, 'utf8'));
        expect(content).toBeDefined();
      } catch (e) {
        parseErrors.push(`${path.basename(rFile)}: parse error (${String(e)})`);
      }
    }

    expect(parseErrors).toEqual([]);
  });
});
