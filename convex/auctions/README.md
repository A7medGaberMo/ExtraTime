# Auctions Module

Implements the **Hidden Bid** auction game mode.

## Mutations
- `placeBid` — Place a bid on the current round's main player. Validates turn, expiry, budget, and minimum bid.
- `pass` — Pass your turn. If no one has bid, triggers a randomized tie-break.
- `usePerk` — Activate your one-time perk (SCOUT reveals the sub player, SPY reveals opponent budget). Enforced once per game.

## Queries
- `getByRoom` — Raw auction record by room ID.
- `getState` — Full hydrated state for the auction page, including perk-revealed data.

## Draft Engine
Smart player selection algorithm with:
- Position-fit scoring (exact > same line > adjacent > fallback)
- Tier budget planning for balanced drafts
- Club/nation diversity weighting
- Dramatic round ordering (wave pattern, climax at ~75%)
- Strategic mystery round placement
