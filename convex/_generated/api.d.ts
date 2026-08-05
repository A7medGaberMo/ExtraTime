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
import type * as careerStats_mutations from "../careerStats/mutations.js";
import type * as careerStats_queries from "../careerStats/queries.js";
import type * as clubs_mutations from "../clubs/mutations.js";
import type * as clubs_queries from "../clubs/queries.js";
import type * as guests_mutations from "../guests/mutations.js";
import type * as guests_queries from "../guests/queries.js";
import type * as lib_constants from "../lib/constants.js";
import type * as matches_mutations from "../matches/mutations.js";
import type * as matches_queries from "../matches/queries.js";
import type * as nations_mutations from "../nations/mutations.js";
import type * as nations_queries from "../nations/queries.js";
import type * as players_mutations from "../players/mutations.js";
import type * as players_queries from "../players/queries.js";
import type * as rooms_mutations from "../rooms/mutations.js";
import type * as rooms_queries from "../rooms/queries.js";
import type * as seed_seedData from "../seed/seedData.js";
import type * as seed_seedStatsAndTransfers from "../seed/seedStatsAndTransfers.js";
import type * as transfers_mutations from "../transfers/mutations.js";
import type * as transfers_queries from "../transfers/queries.js";

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
  "careerStats/mutations": typeof careerStats_mutations;
  "careerStats/queries": typeof careerStats_queries;
  "clubs/mutations": typeof clubs_mutations;
  "clubs/queries": typeof clubs_queries;
  "guests/mutations": typeof guests_mutations;
  "guests/queries": typeof guests_queries;
  "lib/constants": typeof lib_constants;
  "matches/mutations": typeof matches_mutations;
  "matches/queries": typeof matches_queries;
  "nations/mutations": typeof nations_mutations;
  "nations/queries": typeof nations_queries;
  "players/mutations": typeof players_mutations;
  "players/queries": typeof players_queries;
  "rooms/mutations": typeof rooms_mutations;
  "rooms/queries": typeof rooms_queries;
  "seed/seedData": typeof seed_seedData;
  "seed/seedStatsAndTransfers": typeof seed_seedStatsAndTransfers;
  "transfers/mutations": typeof transfers_mutations;
  "transfers/queries": typeof transfers_queries;
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
