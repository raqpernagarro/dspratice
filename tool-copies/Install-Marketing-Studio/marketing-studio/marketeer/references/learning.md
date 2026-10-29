# Learning: performance, edits and the playbook

`content-planner learn` turns two things the author produces into `brands/me/playbook.md`: the numbers her posts earned, which she types in, and the edits she makes to drafts in TryPost, which the sync logs. Nothing here contacts a social network or reads its analytics: the spec bars network APIs (§2.2), so every number is one the author entered. The writers read the playbook through `marketeer-context`, which prints up to three of its entries that bear on the pillar or the surface. Read this with `planning.md` and `idea-scoring.md`.

## What the author enters

A week after a post goes out, the author reads the network's own analytics for it and types the numbers in:

```bash
python3 scripts/perf.py <id> --impressions N [--reactions N] [--comments N] [--reposts N] [--saves N] [--clicks N]
```

- `--impressions` is required. A count left out is recorded as empty, not as 0. Counts are whole numbers of 0 or more.
- It writes `performance: {impressions, reactions, comments, reposts, saves, clicks, entered_at}` into the piece's frontmatter and bumps `updated`. Entering again replaces the earlier numbers.
- It prints `performance <id> entered`; exit 2 means no piece has that id.
- Only a `type: post` with `status: published` counts, so the piece must be marked posted first (the `posted` label in TryPost, or `python3 scripts/mark.py <id> posted`).

## The engagement rate

(reactions + comments + reposts + saves) / impressions × 100, to two decimals (`scripts/lib/learn.py`). An empty count adds 0. Clicks are recorded but are not in the rate. A piece with no impressions, or 0, has no rate and is left out. The baseline is the mean rate of every piece counted; each group's rate is the mean of its pieces.

## Confidence

By the number of pieces with a rate: Low under 15, Medium under 30, High from 30. The same thresholds apply to one entry in the playbook: count the pieces (or the edits) behind it, never the whole set. An entry backed by three posts is Low even when the run is High.

## The Data section

```bash
python3 scripts/learn.py [--write]
```

It prints `learn <n> pieces, confidence <Low|Medium|High>`. With no entered performance it prints `learn 0 pieces, nothing to write` and exits 1. With `--write` it replaces the playbook's `## Data` section (from its heading to the next `## ` heading), or adds it after the title and its paragraph, and keeps every other section:

```markdown
## Data, as of DD/MM/YYYY

Pieces: <n>, baseline engagement rate: <x.xx>%, confidence <level>

### By pillar
| Group | Pieces | Rate |
### By network
### By format

Top: <id> (<x.xx>%), up to five, best first
Bottom: <id> (<x.xx>%), up to five, worst first
```

Groups are sorted by rate, best first; a piece with no pillar or format falls in `none`. The CLI writes only this section. Never edit it by hand: the next `--write` replaces it.

## The edits log

The second input. When `python3 scripts/trypost_sync.py pull` brings back text the author changed in TryPost, it appends the change to `brands/me/edits.md`: a heading `## <time> <id>`, then a unified diff in a fence, from `file` (the draft as written) to `trypost` (as the author left it). The file starts on the first such pull.

What the author changed is what the writers should stop doing. Read the diffs for repeats across pieces: an opening she rewrites, a closing line she cuts, a word she swaps out every time, a paragraph she shortens, a hashtag she drops. One edit is a preference; the same change in several pieces is a rule for the playbook. Name the pieces it rests on.

## The tiers

The skill writes four sections after `## Data`, each a `## ` heading dated with the run, so the CLI's next `--write` keeps them and the skill's next run replaces them:

- `## Quick wins, as of DD/MM/YYYY`: changes for next week's drafts, small and backed by the data or the edits.
- `## Strategic shifts, as of DD/MM/YYYY`: changes to the mix over several weeks: a pillar, network or format given more or less room.
- `## Experiments, as of DD/MM/YYYY`: what the data cannot settle yet, run as a test.
- `## Stop, as of DD/MM/YYYY`: what to drop.

Each entry is one bullet that stands alone, because `marketeer-context` quotes entries verbatim:

```markdown
- Do more: <the action>. Evidence: <ids with their rates, or edits.md entries by id and time>. Confidence: <Low|Medium|High>.
- Do less: <the action>. Evidence: <...>. Confidence: <...>.
- Hypothesis: <what might work and why>. Test: <what changes, on which network, for how many posts>. Success: <the rate or count that confirms it>. Failure: <the result that rules it out>. Review on: DD/MM/YYYY.
- Stop: <the practice>. Evidence: <...>. Confidence: <...>.
```

Quick wins and Strategic shifts hold Do more and Do less entries; Experiments hold Hypothesis entries; Stop holds Stop entries. A tier with nothing in it says `None this run.`

## Rules for an entry

- Evidence is ids and their rates from the Data section, or edits by id and time. Never a figure the Data section does not print, and never a rate recomputed by hand.
- Compare a group with the baseline, and say how many pieces it holds. Two pieces above the baseline are an Experiment, not a Strategic shift.
- With fewer than five pieces, write the Data section only, no tiers, and say so.
- From five pieces on, an entry may rest on the edits alone, and says so: `Evidence: edits.md, <n> pieces`.
- British English, no em or en dashes, as everywhere.
