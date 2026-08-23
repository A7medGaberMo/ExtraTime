# ExtraTime — Auth, Profiles, Friends & Leagues Master Plan (Snipe + Rank)

> **Status:** APPROVED FINAL v2.0 — Implementation Roadmap.
> **Scope:** Clerk Authentication, First-Party Profiles, Friend Search/System, and Leagues for the two core ExtraTime games: **Snipe Auctions** and **Rank Duels**.
>
> **Identity Architecture: Two Dedicated Classes (Never Colliding)**
>
> | Class | Table | Scope & Lifecycle | Authentication |
> |---|---|---|---|
> | **Guest** | `guestUsers` | Casual auction rooms, casual rank duels | Stored `extratime_sessionToken` |
> | **User** | `users` | Profiles, friends, private groups, public leagues | Clerk Google OAuth (`ctx.auth.getUserIdentity()`) |

---

## 0. Key Architectural Decisions

1. **Clerk is Auth Only, ExtraTime Owns the Data:**
   - Clerk handles secure Google OAuth authentication and session tokens.
   - ExtraTime owns all user data in Convex (`users`, `friendships`, `leagues`, `leagueMembers`, `leagueMatches`).
   - Search, profiles, and relationships query Convex directly.
   - No Google email, real name, or avatar URLs are stored (privacy & data minimization).

2. **Game-Centric Leagues (Snipe Auctions + Rank Duels):**
   - **Private Leagues / Groups:** `gameScope: 'both'` (invite-code protected; friends can challenge each other in both Snipe and Rank, with combined and game-specific standings).
   - **Public Leagues:** Game-specific (`gameScope: 'snipe'` or `gameScope: 'rank'`).
   - **Unlimited Public Leagues:** Users can create unlimited public leagues (subject to server validation & profanity filters).

3. **League Match Execution & Isolation:**
   - Matches launched from a league lobby carry the `leagueId` context.
   - Casual matches played outside a league do **not** affect league standings.
   - Casual guest games remain 100% functional with zero behavior change.

4. **Football-Style Scoring & Standings:**
   - **Points:** Win = 3 pts, Draw = 1 pt, Loss = 0 pts.
   - **Snipe Tie-Breakers:** Points DESC → Wins DESC → Goal Difference DESC → Goals Scored DESC → Fewer Matches Played ASC → Joined Date ASC.
   - **Rank Tie-Breakers:** Points DESC → Wins DESC → Score Differential (Margin) DESC → Total Quiz Score DESC → Fewer Matches Played ASC → Joined Date ASC.
   - **Combined Standings (Private):** Combined Points DESC → Combined Wins DESC → Snipe GD + Rank SD → Joined Date ASC.

5. **Idempotency & Optimistic Concurrency Control (OCC):**
   - Scoring happens once per league match via `leagueMatches.scoredAt` guard.
   - Uniqueness (e.g. `username`, `linkedGuestId`, `leagueMembers`, friendship edges) is enforced via indexed `.unique()` checks in Convex serializable mutations.

---

## 1. Milestones Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MILESTONE 1: AUTH & PROFILES                    │
│  [AUTH-001] Legacy Guest Security & Server Resolver Split              │
│  [AUTH-002] Clerk + Convex Auth Wiring (SDK, Config, Provider, Header) │
│  [USER-001] Users Table & requireUser Auto-Provisioning Defaults       │
│  [USER-002] Profile Settings (/settings/profile) & Profanity Engine    │
│  [AUTH-003] Guest Account Claim & Link Flow                            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        MILESTONE 2: FRIENDS SYSTEM                     │
│  [SOCIAL-001] Friendships Table & Bi-Directional Request Mutations     │
│  [SOCIAL-002] User Search & Friends UI Hub (/friends)                  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   MILESTONE 3: LEAGUES (SNIPE + RANK)                  │
│  [LEAGUE-001] Leagues, Members & LeagueMatches Schema                  │
│  [LEAGUE-002] League CRUD & Membership Management (Public & Private)   │
│  [LEAGUE-003] Leagues Discovery & Dashboard UI (/leagues)              │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│              MILESTONE 4: LEAGUE MATCHES & SCORING ENGINE              │
│  [MATCH-001]  League Snipe & Rank Launch Flow                          │
│  [SCORE-001]  Idempotent Match Scoring & Standings Updates             │
│  [SCORE-002]  Reactive League Standings Leaderboard UI                 │
│  [QA-001]     Integration & End-to-End Vitest Suite                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Server Identity & Authorization Helpers

```ts
// convex/lib/identity.ts
import { MutationCtx, QueryCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { verifyGuestSession } from './auth';

/**
 * Validates Clerk authentication for user-scoped features (profiles, friends, leagues).
 * On first sign-in within a mutation, automatically provisions default user record.
 */
export async function requireUser(ctx: MutationCtx | QueryCtx): Promise<Id<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized: Authentication required');
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();

  if (user) {
    return user._id;
  }

  if ('insert' in ctx.db) {
    return await provisionDefaultUser(ctx as MutationCtx, identity.subject);
  }

  throw new Error('Unauthorized: User profile initializing');
}

/**
 * Validates legacy guest session for casual games (rooms, auctions, casual rank).
 * Guarantees zero regressions to existing casual multiplayer games.
 */
export async function resolveLegacyGuest(
  ctx: MutationCtx | QueryCtx,
  args: { guestId: Id<'guestUsers'>; sessionToken?: string }
): Promise<Id<'guestUsers'>> {
  if (!args.guestId) {
    throw new Error('Unauthorized: Guest ID missing');
  }
  await verifyGuestSession(ctx, args.guestId, args.sessionToken);
  return args.guestId;
}
```

---

## 3. Database Schema Blueprint

### 3.1 Users (`convex/users/schema.ts`)
```ts
export const usersTable = defineTable({
  clerkId: v.string(),                         // Clerk JWT subject
  username: v.string(),                        // Unique handle (lowercase, 3-15 chars)
  displayName: v.string(),                     // Display name (1-24 chars)
  avatarSeed: v.string(),                      // Visual avatar seed
  usernameChangedAt: v.optional(v.number()),   // 30-day rename cooldown
  linkedGuestId: v.optional(v.id('guestUsers')),// Claimed guest history ID
  profanityFlags: v.number(),                  // Moderation counter
  profileComplete: v.boolean(),                // True once reviewed in settings
  stats: v.object({
    snipePlayed: v.number(),
    snipeWins: v.number(),
    rankPlayed: v.number(),
    rankWins: v.number(),
  }),
  createdAt: v.number(),
  lastActiveAt: v.number(),
})
  .index('by_clerkId', ['clerkId'])
  .index('by_username', ['username'])
  .index('by_linkedGuest', ['linkedGuestId']);
```

### 3.2 Friendships (`convex/friends/schema.ts`)
```ts
export const friendshipsTable = defineTable({
  requesterId: v.id('users'),
  addresseeId: v.id('users'),
  status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('blocked')),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_requester_status', ['requesterId', 'status'])
  .index('by_addressee_status', ['addresseeId', 'status'])
  .index('by_pair', ['requesterId', 'addresseeId']);
```

### 3.3 Leagues (`convex/leagues/schema.ts`)
```ts
export const leaguesTable = defineTable({
  name: v.string(),                            // Profanity-checked name
  description: v.optional(v.string()),
  kind: v.union(v.literal('public'), v.literal('private')),
  gameScope: v.union(
    v.literal('both'),                         // Private groups default to both
    v.literal('snipe'),                        // Public Snipe leagues
    v.literal('rank'),                         // Public Rank leagues
  ),
  inviteCode: v.optional(v.string()),          // 8-char code for private leagues
  ownerId: v.id('users'),
  maxMembers: v.optional(v.number()),          // e.g. 50 (optional cap)
  createdAt: v.number(),
})
  .index('by_kind_scope', ['kind', 'gameScope'])
  .index('by_inviteCode', ['inviteCode'])
  .index('by_owner', ['ownerId']);

export const leagueMembersTable = defineTable({
  leagueId: v.id('leagues'),
  userId: v.id('users'),
  role: v.union(v.literal('owner'), v.literal('member')),
  snipeStats: v.object({
    played: v.number(),
    won: v.number(),
    drawn: v.number(),
    lost: v.number(),
    goalsFor: v.number(),
    goalsAgainst: v.number(),
    goalDiff: v.number(),
    points: v.number(),
  }),
  rankStats: v.object({
    played: v.number(),
    won: v.number(),
    drawn: v.number(),
    lost: v.number(),
    scoreFor: v.number(),
    scoreAgainst: v.number(),
    scoreDiff: v.number(),
    totalScore: v.number(),
    points: v.number(),
  }),
  combinedPoints: v.number(),                  // snipeStats.points + rankStats.points
  combinedWins: v.number(),                    // snipeStats.won + rankStats.won
  joinedAt: v.number(),
})
  .index('by_league_user', ['leagueId', 'userId'])
  .index('by_league_combined_points', ['leagueId', 'combinedPoints'])
  .index('by_user', ['userId']);

export const leagueMatchesTable = defineTable({
  leagueId: v.id('leagues'),
  gameType: v.union(v.literal('snipe'), v.literal('rank')),
  roomId: v.optional(v.id('rooms')),           // Set if Snipe
  rankGameId: v.optional(v.id('rankGames')),   // Set if Rank
  hostUserId: v.id('users'),
  guestUserId: v.id('users'),
  hostScore: v.number(),                       // Goals (Snipe) or Quiz Score (Rank)
  guestScore: v.number(),
  winnerUserId: v.optional(v.id('users')),     // undefined if draw
  status: v.union(v.literal('pending'), v.literal('completed'), v.literal('abandoned')),
  scoredAt: v.optional(v.number()),            // Idempotency timestamp
  createdAt: v.number(),
})
  .index('by_league', ['leagueId'])
  .index('by_room', ['roomId'])
  .index('by_rankGame', ['rankGameId']);
```

---

## 4. Implementation Ticket Backlog

### Ticket AUTH-001: Add Legacy Guest Resolver & Secure Guest Mutations
- **Module:** Backend Auth
- **Files Modified:** `convex/lib/auth.ts`, `convex/lib/identity.ts` (New), `convex/guests/mutations.ts`, call sites in rooms/auctions/rank.
- **Scope:**
  - Create `resolveLegacyGuest` helper in `convex/lib/identity.ts`.
  - Secure `guests.updateLastActive` to require and verify `sessionToken`.
  - Ensure casual games continue to function flawlessly.
- **Acceptance Criteria:** Vitest test suite passes; unverified calls to guest mutations are rejected.

---

### Ticket AUTH-002: Wire Clerk + Convex Auth & Header UI
- **Module:** Frontend / Backend Auth Wiring
- **Files Modified:** `package.json`, `convex/auth.config.ts` (New), `src/providers/convex-provider.tsx`, `src/middleware.ts` (New), `src/components/layout/header.tsx`.
- **Scope:**
  - Install `@clerk/nextjs`.
  - Configure `convex/auth.config.ts` with Clerk JWT issuer.
  - Wrap app in `ClerkProvider` and `ConvexProviderWithClerk`.
  - Add non-gating `clerkMiddleware()`.
  - Add Header Sign-in trigger and signed-in user avatar dropdown.
- **Acceptance Criteria:** Users can sign in with Google OAuth; casual game routes remain publicly accessible.

---

### Ticket USER-001: Users Table & `requireUser` Auto-Provisioning
- **Module:** Backend User Management
- **Files Modified:** `convex/users/schema.ts` (New), `convex/users/mutations.ts` (New), `convex/users/queries.ts` (New), `convex/schema.ts`, `convex/lib/identity.ts`.
- **Scope:**
  - Define `usersTable` and register in root schema.
  - Implement `requireUser(ctx)` with auto-provisioning defaults (`player_xxxxxx`, random valid avatarSeed, clean stats).
  - No Google OAuth private data (email, full name) stored in database.
- **Acceptance Criteria:** First-time sign-in creates a valid ExtraTime user record automatically.

---

### Ticket USER-002: Profile Settings, Validation & Profanity Engine
- **Module:** Fullstack Profile Management
- **Files Modified:** `convex/lib/profanity/index.ts` (New), `convex/lib/profanity/ar.ts` (New), `convex/users/mutations.ts`, `src/app/settings/profile/page.tsx` (New), `src/lib/i18n/dictionaries/`.
- **Scope:**
  - Normalization-based profanity filter supporting English and Arabic (script + transliteration).
  - Username validation (3-15 chars, alphanumeric + underscore, reserved handles list, 30-day rename cooldown).
  - Avatar seed picker reusing ExtraTime avatar seeds.
  - `/settings/profile` page with debounced username availability and full EN/AR localization.
- **Acceptance Criteria:** Profanity rejected on server; username availability checks work in real-time; updates save cleanly.

---

### Ticket AUTH-003: Guest Account Claim & Link Flow
- **Module:** Fullstack Auth Migration
- **Files Modified:** `convex/users/mutations.ts`, `src/components/auth/claim-guest-modal.tsx` (New), `src/hooks/use-guest-session.ts`.
- **Scope:**
  - Detect existing guest session on sign-in.
  - Offer user choice: "Link Guest History" or "Start Fresh".
  - Securely verify guest session token and attach `linkedGuestId`.
- **Acceptance Criteria:** Legitimate guest sessions can be linked; unverified tokens are rejected.

---

### Ticket SOCIAL-001: Friendships System Backend
- **Module:** Backend Social
- **Files Modified:** `convex/friends/schema.ts` (New), `convex/friends/mutations.ts` (New), `convex/friends/queries.ts` (New), `convex/schema.ts`.
- **Scope:**
  - Create `friendshipsTable`.
  - Implement mutations: `sendRequest`, `acceptRequest`, `declineRequest`, `removeFriend`, `blockUser`, `unblockUser`.
  - Guards: Not self, no existing edges (queried bi-directionally), not blocked, max 20 pending requests outbox.
- **Acceptance Criteria:** Complete unit test coverage of friendship states and symmetry guards.

---

### Ticket SOCIAL-002: User Search & Friends UI Hub
- **Module:** Frontend Social
- **Files Modified:** `src/app/friends/page.tsx` (New), `convex/users/queries.ts`, `src/lib/i18n/dictionaries/`.
- **Scope:**
  - Prefix search query on Convex `users.by_username` excluding self, existing friends, and blocked users.
  - Build `/friends` page with 3 tabs:
    - **My Friends:** Online/active status, direct challenge action, remove/block.
    - **Requests:** Incoming requests with Accept/Decline.
    - **Find Friends:** Live search bar with instant send request button.
- **Acceptance Criteria:** Search returns responsive suggestions; friend requests update reactively in UI.

---

### Ticket LEAGUE-001: Leagues & Standings Schema
- **Module:** Backend League Core
- **Files Modified:** `convex/leagues/schema.ts` (New), `convex/schema.ts`.
- **Scope:**
  - Define `leaguesTable`, `leagueMembersTable`, and `leagueMatchesTable`.
  - Support `kind: 'public' | 'private'` and `gameScope: 'both' | 'snipe' | 'rank'`.
  - Initialize clean zeroed `snipeStats` and `rankStats` for every member.
- **Acceptance Criteria:** Schema compiles cleanly with indexes for fast leaderboard sorting.

---

### Ticket LEAGUE-002: League Management Mutations
- **Module:** Backend League Actions
- **Files Modified:** `convex/leagues/mutations.ts` (New), `convex/leagues/queries.ts` (New).
- **Scope:**
  - `createLeague`: Name profanity validation, unlimited public creation, 8-char Crockford base32 invite code generation for private leagues.
  - `joinLeague`: By ID for public leagues, by invite code for private leagues. Deduplication guard.
  - `leaveLeague`: Members can leave; owners must transfer ownership or delete league.
  - `kickMember`, `deleteLeague`, `updateLeagueSettings`: Owner-only mutations.
- **Acceptance Criteria:** Unauthenticated users cannot create/join; duplicate joins prevented; private leagues require valid invite codes.

---

### Ticket LEAGUE-003: Leagues Discovery & Dashboard UI
- **Module:** Frontend Leagues
- **Files Modified:** `src/app/leagues/page.tsx` (New), `src/app/leagues/public/page.tsx` (New), `src/app/leagues/create/page.tsx` (New), `src/app/leagues/[leagueId]/page.tsx` (New).
- **Scope:**
  - `/leagues`: User's active leagues + Quick Join modal (enter invite code) + Create button.
  - `/leagues/public`: Discoverable public leagues with filter tabs (All, Snipe Leagues, Rank Leagues) and instant 1-click Join.
  - `/leagues/create`: Form for creating Private Group or Public League (selecting Snipe or Rank for public).
  - `/leagues/[leagueId]`: League hub showing Member List, Standings Table, Invite Code (if private/owner), and "Play Match" buttons.
- **Acceptance Criteria:** Full responsive UI with real-time membership and standings updates.

---

### Ticket MATCH-001: League Match Launching (Snipe + Rank)
- **Module:** Fullstack Match Integration
- **Files Modified:**
  - `convex/rooms/mutations.ts`, `convex/rooms/schema.ts`
  - `convex/rank/mutations.ts`, `convex/rank/schema.ts`
  - `src/app/leagues/[leagueId]/page.tsx`
- **Scope:**
  - On `/leagues/[leagueId]`:
    - Private leagues show both **"Play Snipe Auction"** and **"Play Rank Duel"**.
    - Public Snipe leagues show **"Play Snipe Auction"**.
    - Public Rank leagues show **"Play Rank Duel"**.
  - When a match is created from a league, record `leagueId` and create a `leagueMatches` record with `hostUserId`.
  - When the opponent joins from the league, record `guestUserId`.
  - Casual matches created from the main lobby remain untouched with no `leagueId`.
- **Acceptance Criteria:** Matches launched from a league properly register the league context.

---

### Ticket SCORE-001: Idempotent League Scoring Engine
- **Module:** Backend Scoring
- **Files Modified:** `convex/leagues/scoring.ts` (New), `convex/matches/mutations.ts`, `convex/rank/mutations.ts`.
- **Scope:**
  - Hook into Snipe match completion (`matches/mutations.ts:saveSimulationResult`) and Rank game completion (`rank/mutations.ts:submitCardOrder`).
  - If match is attached to a `leagueId`:
    - Evaluate winner based on Goals (Snipe) or Quiz Score (Rank).
    - Win: 3 pts, Draw: 1 pt, Loss: 0 pts.
    - Atomically update both participants' `leagueMembers` stats (`played`, `won`, `drawn`, `lost`, `goalsFor`/`goalsAgainst`/`goalDiff` or `scoreFor`/`scoreAgainst`/`scoreDiff`, `points`, `combinedPoints`, `combinedWins`).
    - Idempotency guard: Skip if `leagueMatches.scoredAt` is already set.
- **Acceptance Criteria:** Standings update precisely once per match; score recalculations are idempotent.

---

### Ticket SCORE-002: Reactive League Standings Leaderboard UI
- **Module:** Frontend Standings
- **Files Modified:** `src/components/leagues/standings-table.tsx` (New), `src/app/leagues/[leagueId]/page.tsx`.
- **Scope:**
  - Display standings sorted by multi-tier tie-breakers:
    - **Snipe Table:** Points DESC → Wins DESC → GD DESC → Goals For DESC → Matches Played ASC → Joined Date ASC.
    - **Rank Table:** Points DESC → Wins DESC → Score Differential DESC → Total Score DESC → Matches Played ASC → Joined Date ASC.
    - **Combined Table (Private):** Combined Points DESC → Combined Wins DESC → Joined Date ASC.
  - Tab selector for Private groups (Combined · Snipe · Rank).
  - Highlight current user's row and medal badges (🥇, 🥈, 🥉).
- **Acceptance Criteria:** Leaderboard updates reactively in real time upon match completion.

---

### Ticket QA-001: Integration & Regression Test Suite
- **Module:** Testing & Quality Assurance
- **Files Modified:** `tests/auth-identity.test.ts` (New), `tests/profile-profanity.test.ts` (New), `tests/leagues-scoring.test.ts` (New).
- **Scope:**
  - Test `resolveLegacyGuest` and `requireUser` error and success paths.
  - Test profanity filter normalization (English, Arabic, leetspeak, unicode).
  - Test league tie-breaker sorting algorithms and score idempotency.
  - Run existing test suite (`tests/rank-scoring.test.ts`, `tests/sealed-bids.test.ts`) to ensure 100% casual game stability.
- **Acceptance Criteria:** All test suites pass with zero failures.
