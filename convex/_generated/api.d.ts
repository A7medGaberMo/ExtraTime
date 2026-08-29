/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auctions_draftEngine from "../auctions/draftEngine.js";
import type * as auctions_formations from "../auctions/formations.js";
import type * as auctions_mutations from "../auctions/mutations.js";
import type * as auctions_queries from "../auctions/queries.js";
import type * as auctions_sealed from "../auctions/sealed.js";
import type * as auctions_sealedView from "../auctions/sealedView.js";
import type * as clubs_mutations from "../clubs/mutations.js";
import type * as clubs_queries from "../clubs/queries.js";
import type * as friends_mutations from "../friends/mutations.js";
import type * as friends_queries from "../friends/queries.js";
import type * as guests_mutations from "../guests/mutations.js";
import type * as guests_queries from "../guests/queries.js";
import type * as history_queries from "../history/queries.js";
import type * as invites_mutations from "../invites/mutations.js";
import type * as invites_queries from "../invites/queries.js";
import type * as leagues_mutations from "../leagues/mutations.js";
import type * as leagues_queries from "../leagues/queries.js";
import type * as leagues_scoring from "../leagues/scoring.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_codeGen from "../lib/codeGen.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_identity from "../lib/identity.js";
import type * as lib_profanity_index from "../lib/profanity/index.js";
import type * as matches_mutations from "../matches/mutations.js";
import type * as matches_queries from "../matches/queries.js";
import type * as nations_mutations from "../nations/mutations.js";
import type * as nations_queries from "../nations/queries.js";
import type * as packs_queries from "../packs/queries.js";
import type * as players_mutations from "../players/mutations.js";
import type * as players_queries from "../players/queries.js";
import type * as rank_mutations from "../rank/mutations.js";
import type * as rank_queries from "../rank/queries.js";
import type * as rank_scoring from "../rank/scoring.js";
import type * as rank_seedData from "../rank/seedData.js";
import type * as rank_validate from "../rank/validate.js";
import type * as rooms_mutations from "../rooms/mutations.js";
import type * as rooms_queries from "../rooms/queries.js";
import type * as seed_rankQuestions from "../seed/rankQuestions.js";
import type * as seed_seedData from "../seed/seedData.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "auctions/draftEngine": typeof auctions_draftEngine;
  "auctions/formations": typeof auctions_formations;
  "auctions/mutations": typeof auctions_mutations;
  "auctions/queries": typeof auctions_queries;
  "auctions/sealed": typeof auctions_sealed;
  "auctions/sealedView": typeof auctions_sealedView;
  "clubs/mutations": typeof clubs_mutations;
  "clubs/queries": typeof clubs_queries;
  "friends/mutations": typeof friends_mutations;
  "friends/queries": typeof friends_queries;
  "guests/mutations": typeof guests_mutations;
  "guests/queries": typeof guests_queries;
  "history/queries": typeof history_queries;
  "invites/mutations": typeof invites_mutations;
  "invites/queries": typeof invites_queries;
  "leagues/mutations": typeof leagues_mutations;
  "leagues/queries": typeof leagues_queries;
  "leagues/scoring": typeof leagues_scoring;
  "lib/auth": typeof lib_auth;
  "lib/codeGen": typeof lib_codeGen;
  "lib/constants": typeof lib_constants;
  "lib/identity": typeof lib_identity;
  "lib/profanity/index": typeof lib_profanity_index;
  "matches/mutations": typeof matches_mutations;
  "matches/queries": typeof matches_queries;
  "nations/mutations": typeof nations_mutations;
  "nations/queries": typeof nations_queries;
  "packs/queries": typeof packs_queries;
  "players/mutations": typeof players_mutations;
  "players/queries": typeof players_queries;
  "rank/mutations": typeof rank_mutations;
  "rank/queries": typeof rank_queries;
  "rank/scoring": typeof rank_scoring;
  "rank/seedData": typeof rank_seedData;
  "rank/validate": typeof rank_validate;
  "rooms/mutations": typeof rooms_mutations;
  "rooms/queries": typeof rooms_queries;
  "seed/rankQuestions": typeof seed_rankQuestions;
  "seed/seedData": typeof seed_seedData;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
