# Three brands on one foundation

Written for a multi-brand bank, anonymised, and approved for reuse with other clients (sample).

## Shared and local decisions

Brands share one token grammar and one component contract. Each brand owns its colour, typography and imagery values in a brand layer; components never reference brand values directly, only semantic tokens.

## Approving changes that touch every brand

A change to a shared semantic token is proposed as a pull request with a visual diff for every brand. The system owner approves it after the brand leads have reviewed their diff. Brand-layer changes are approved by the brand lead alone.

## Migrating without a big bang

Start with the brand that has the most active development, map its tokens to the shared grammar, and move the other brands one at a time behind the same contract. Each brand keeps shipping during the move.
