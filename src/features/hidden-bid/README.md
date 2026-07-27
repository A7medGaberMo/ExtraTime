# Hidden Bid — Game Module

## Overview

Hidden Bid is a live multiplayer football auction game where two players compete to build the best squad within a fixed budget.

## Phase 2 Implementation

The following will be implemented here:

### Game Logic (`/logic`)
- Auction engine
- Bid validation
- Budget management
- Round progression

### Replacement Engine (`/replacement`)
- Position-based replacement matching
- Tier-weighted selection
- Recently-used player avoidance
- Configurable replacement rules

### Simulation (`/simulation`)
- Squad strength calculation
- Winner determination
- Score generation

### Components (`/components`)
- AuctionBoard
- BidControls
- PlayerReveal
- SquadBuilder
- BudgetTracker
- RoundTimer
- RevealAbility

### Hooks (`/hooks`)
- useAuction
- useBidding
- useSquad
- useReveal

### Types (`/types`)
- AuctionRound
- Bid
- Squad
- GameState
- ReplacementRule

## Architecture Notes

- All game logic must be isolated in this module
- Business logic must NOT live inside React components
- The replacement engine must be configurable via rules
- Future games should follow the same module pattern

<!-- TODO: Phase 2 — Begin Hidden Bid implementation -->
