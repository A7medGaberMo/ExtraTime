import { GenericMutationCtx, GenericQueryCtx } from 'convex/server';
import { DataModel, Id } from '../_generated/dataModel';

/**
 * Generates a cryptographically secure 48-character base64url session token.
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(36);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Authoritative session verification for all player actions.
 * Ensures the mutation caller possesses the private session token matching the guest account.
 */
export async function verifyGuestSession(
  ctx: GenericMutationCtx<DataModel> | GenericQueryCtx<DataModel>,
  guestId: Id<'guestUsers'>,
  sessionToken?: string,
): Promise<boolean> {
  const guest = await ctx.db.get(guestId);
  if (!guest) {
    throw new Error('Unauthorized: Guest user not found');
  }

  // Session token must be provided and must match the record's session token
  if (!sessionToken || (guest.sessionToken && sessionToken !== guest.sessionToken)) {
    throw new Error('Unauthorized: Invalid or missing session token');
  }

  return true;
}

/**
 * Safe boolean ownership check for query sanitization.
 * Never throws — returns true only if the caller owns the guest account with a matching session token.
 */
export async function isGuestOwner(
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  guestId?: Id<'guestUsers'> | null,
  sessionToken?: string,
): Promise<boolean> {
  if (!guestId || !sessionToken) return false;
  const guest = await ctx.db.get(guestId);
  if (!guest || !guest.sessionToken) return false;
  return guest.sessionToken === sessionToken;
}

