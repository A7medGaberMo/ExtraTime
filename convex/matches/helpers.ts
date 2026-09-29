import { GenericMutationCtx } from 'convex/server';
import { DataModel, Id } from '../_generated/dataModel';

export async function buildSquadSnapshot(
  ctx: GenericMutationCtx<DataModel>,
  playerIds: Id<'players'>[]
) {
  const players = await Promise.all(playerIds.map(id => ctx.db.get(id)));
  
  return players
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .map(p => ({
      playerId: p._id,
      name: p.name,
      position: p.position,
      tier: p.tier,
      club: p.clubName ?? 'Unknown Club',
      nation: p.nationName ?? 'Unknown Nation',
      imageUrl: p.imageUrl,
      isLegend: p.isLegend,
      kitNumber: p.kitNumber,
      rating: p.rating,
      cost: undefined, // Cost tracking is handled differently, often irrelevant for pure visual/simulation needs unless specified
    }));
}
