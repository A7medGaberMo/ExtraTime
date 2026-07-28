# Matches Module

Manages match records created after an auction completes.

## Mutations
- `createFromAuction` — Creates a match record from a completed auction. Idempotent (won't create duplicates).
- `updateResult` — Records the final score and optional winner.

## Queries
- `getByRoom` — Fetch match by room ID with hydrated squad details.
- `getById` — Direct match access by ID.
