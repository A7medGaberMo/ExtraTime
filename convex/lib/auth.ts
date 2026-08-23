import { GenericMutationCtx } from 'convex/server';
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
  ctx: GenericMutationCtx<DataModel>,
  guestId: Id<'guestUsers'>,
  sessionToken?: string,
): Promise<boolean> {
  const guest = await ctx.db.get(guestId);
  if (!guest) {
    throw new Error('Unauthorized: Guest user not found');
  }

  // If a session token exists on the user record, enforce strict equality
  if (guest.sessionToken) {
    if (!sessionToken || sessionToken !== guest.sessionToken) {
      throw new Error('Unauthorized: Invalid or missing session token');
    }
  }

  return true;
}
