# Planning: the week, its slots and its cadence

`content-planner` lays out each week, Monday to Sunday, so that LinkedIn, Instagram and X carry a post every day and Viva Engage carries a field note for Nagarro colleagues on Tuesday and Thursday; `run` chains the Monday pass and the drafting pass. The layout and the checks are code, in `scripts/lib/planner.py` behind `scripts/plan.py`; the judgement (which angle, which score, which idea goes where) belongs to the skills. Read this with `idea-scoring.md`, `sources.md`, `repurposing-matrix.md` and `learning.md`. The rules are the spec's (`docs/superpowers/specs/2026-10-21-marketing-studio-design.md` §5); this file quotes them and never loosens them.

## The Monday session

What the spec asks of a Monday (§1 and §5.4): The author opens TryPost and finds the week's campaign content in dated slots per network, and scored pillar ideas to approve. She approves, swaps or rejects ideas. The planner then drafts every approved slot across all networks, and the drafts go through edit, then score, then brand-review. On a normal day she then spends about 10 minutes editing, copying and posting, and no time deciding what to post.

On the Ideas board an idea's column is its status: Unassigned (TryPost's built-in column, which is no stage) is `idea`, To Do is `approved`, In Progress is `draft` (`scripts/lib/sync_plan.py`). Done, and any column the author makes herself, means no status. To Do also holds one card per long-form piece (a LinkedIn article or a Substack essay; eight today) with the `long-form` label: the push puts them there as reminders, they are not ideas, and the pull never reads them, so moving one approves nothing. An essay also gets one dated draft on the "Substack (manual)" channel, so the calendar shows its day, and a Substack note is a draft on that channel like any post (`surfaces/substack.md`, Timing).

- Approve: drag the card to To Do, or run `python3 scripts/mark.py <id> approved` (prints `<id> is now approved`). An idea's score never blocks its approval.
- Reject: delete the card. The pull prints `archived <id>` and sets the file to `archived`; the card is never recreated, and the slot opens again on the next plan.
- After a TryPost wipe every card is missing, and a plain pull would archive every idea. Run `python3 scripts/trypost_sync.py pull --relink` once, before the first `sync`, for posts and ideas alike: an idea whose card is missing keeps its status, forgets its card (`trypost.idea_id` and `trypost.synced_status` go to null) and prints `relinked <id>`, and a post forgets its TryPost draft; the next push then creates each card again in the column its status names (`idea <id> <status>`), and each draft again (`created <id>`).
- Swap: reject the card, then ask for another idea for the same day and networks.
- Drag a card to In Progress and the pull sets `draft`; back to Unassigned, `idea`. Each prints `idea <id> <status>`.
- Drag a card to Done or to a column the author made herself, and it flows back as nothing: the file keeps its status, and push leaves the card where it is.

`trypost.synced_status`, in the idea's file, is the baseline: the status the file and the card last agreed on. It is set when push creates the card, when push moves it, and when pull adopts a column (a file without one takes the card's column as its baseline). Pull changes the file only when the card's column means a status other than `synced_status` and the file still equals `synced_status`. Push moves the card only when the file's status differs from `synced_status`. When both changed, to different places, push and pull each print `conflict <id>: the file says <status>, the board says <status>, last in step as <status> (make them agree, then sync)` and touch nothing.

## Slots

A slot is one network on one day: three networks by seven days, plus Viva Engage on Tuesday and Thursday, 23 slots a week. The two Viva Engage slots appear once their day's LinkedIn slot holds a piece or a saved idea (Viva Engage, below), so a week whose Tuesday or Thursday is still an idea to choose counts 21 or 22 until that idea is saved. Long-form (a LinkedIn article, anything on Substack) takes no slot; the plan lists it under `## Long-form`.

| Kind | What fills it | The cell in the plan |
|---|---|---|
| `campaign` | A dated post with a campaign, on LinkedIn (not an article), Instagram or X; or a saved idea with a campaign, dated that day, on each network its `surfaces` lists | `campaign: <id>` |
| `child` | An empty slot, on the same day, on another network that the campaign slot's campaign lists in `surfaces`; or the Viva Engage slot on Tuesday and Thursday, from that day's LinkedIn piece. `repurpose` writes it after approval | `child: <source id>`; once written, a Viva Engage child shows `child: <id>`, or `campaign: <id>` when it carries a campaign |
| `pillar-piece` | A dated post with no campaign, such as the drafts of an approved idea | `pillar-piece: <id>` |
| `idea` | A saved idea with no campaign dated that day, or a gap the plan asks to fill | `idea: <id>` or `idea: pillar <n>` |
| `reactive` | The same, for an idea flagged `reactive: true` | `reactive: <id>` or `reactive: pillar <n>` |

The spec's order (§5.2): "Fill campaign slots by priority. Add repurposed versions of campaign pieces for the other networks (`repurpose`, stamped with `parent:`). Fill the remaining slots with pillar ideas, in rotation, highest score first." `build_week` does it in this order:

1. Dated channel pieces take their slot, and a saved idea (status `idea`, `approved` or `draft`) with a `campaign`, dated in the week, takes a `campaign` slot on each network of its `surfaces` (all three when it has none), exempt from the cap like a campaign post. When two want one slot, a campaign beats no campaign, the lower campaign `priority` number wins, then a piece beats an idea (so an idea's drafts take its slots), then the lower id. A piece that loses shows as `(also <id>)` in the cell, and so does an idea that loses to an idea; an idea that loses to a piece drops out of the cell.
2. Each campaign slot, a campaign idea's among them, reserves a `child` slot on every other network its campaign's `surfaces` lists, while that slot is empty. A network the idea itself lists is its own slot, never its child.
3. A saved idea with no campaign, dated in the week, fills the empty slots of its `surfaces` (all three when it has none); one that finds another idea there shows as `(also <id>)`. It keeps its own pillar in each, even on a network that pillar is not written for: `PILLAR_NETWORKS` binds only the ideas step 5 asks for, and the slot counts for the idea's pillar under the cap all the same. An archived idea fills nothing.
4. On Tuesday and Thursday, the Viva Engage slot, while it is empty, becomes a `child` of that day's LinkedIn piece (Viva Engage, below).
5. The remaining gaps become ideas to choose. Pillars go in rotation 1, 2, 3, 4, and an idea covers only the empty networks its pillar is written for (`PILLAR_NETWORKS`: pillar 1 LinkedIn and X, pillar 2 LinkedIn, pillar 3 LinkedIn and X, pillar 4 Instagram and LinkedIn), so a day with all three networks empty takes two or three ideas. The rotation moves on once a day. A pillar that would go over the cap is skipped for the next; when every pillar that fits would go over, the planner takes the first that fits anyway and `check_week` reports the breach. Every fifth idea it asks for is reactive (`REACTIVE_EVERY = 5`), counted from the first idea this run asks for. Saved ideas (a saved reactive one among them) and pillar pieces are not in the count, so a week that asks for fewer than five ideas asks for no reactive one.

## Viva Engage

Viva Engage (`viva`) is Nagarro's internal network, for colleagues only (`surfaces/viva-engage.md`). It is a child network only (`CHILD_ONLY` in `scripts/lib/planner.py`): its posts are repurposed from the public ones, and the pillars stay public first.

- Its days are Tuesday and Thursday. No other day has a Viva Engage slot, and an empty cell in its column is by design, never a gap.
- Its slot is always a `child`, never a pillar slot: no idea is ever asked for Viva Engage, and `PILLAR_NETWORKS` does not list it.
- The source is that day's LinkedIn piece: a campaign post first, then a pillar piece, then a saved idea dated that day that lists LinkedIn; among equals the lower campaign `priority`, then the lower id. A day whose LinkedIn slot is only an idea to choose has no source yet, so it gets no Viva Engage slot until the idea is saved and `plan.py` runs again.
- The child takes its source's campaign and pillar in the plan. `repurpose` writes it as `<stem>-viva` (`repurposing-matrix.md`), always in `nagarro` mode, on the source's day at 10:00 Lisbon.
- A source that is a saved idea is never a `repurpose` source. The draft run writes the idea's own LinkedIn draft first; `plan.py` then names that draft as the source, because a piece outranks an idea, and the child is repurposed from it.
- A dated Viva Engage piece fills its slot as a `child` (a `campaign` slot when it carries a campaign), never as a pillar piece.

## The cadence rules

Verbatim from spec §5.3:

> - Campaign slots are deliberate and exempt from the caps below. During the DS series the campaign owns every LinkedIn weekday, and that is intended.
> - Among pillar slots, no single pillar above 50% of a network's week.
> - Every network gets a post every day. A day with no post on a network is a planning error, not a buffer.
> - About 20% of pillar slots are reactive: they keep their date and carry an evergreen fallback draft. If something happens that week, the reactive piece replaces the fallback; if not, the fallback goes out.
> - No two heavy formats (article, carousel) on the same day and network.
> - An article's promo post never goes out on the article's own day.

`check_week` prints one `problem:` line per breach, in this order: `no post on <network> on <day>`; `pillar <n> holds <a> of <b> pillar slots on <network>, the cap is 50%`; `two heavy formats on <network> on <day>` (heavy is `article`, `carousel-pdf` or `carousel`; a clash made only of campaign pieces is deliberate and not reported); `promo on its article's day: <id>`. The reactive share is not checked: making every fifth idea it asks for reactive is how the planner keeps it near 20%, and the saved ideas it does not count (step 5) can move the share either way. Viva Engage is outside every rule here: it never takes a pillar slot, never counts towards a cap, and is not asked for a post every day, so no `no post on viva` line ever prints.

## The 50% cap, worked

Pillar slots are the `idea`, `reactive` and `pillar-piece` slots of one network; `campaign` and `child` slots never count, and a dated idea with a campaign fills `campaign` slots, so `check_week` never counts it either: five pillar 3 ideas saved with `--campaign` on the LinkedIn weekdays print no `problem:` line, while the same five without a campaign print `pillar 3 holds 5 of 7 pillar slots on linkedin, the cap is 50%`. A pillar is over the cap when it holds more than the larger of two figures (`_over_cap` in `scripts/lib/planner.py`): half the network's pillar slots, and those slots divided by the number of pillars written for the network (`PILLAR_NETWORKS`), rounded up. The second figure gives way where the pillars cannot be spread as thin as half: LinkedIn has four pillars, so its cap is half; X has two (1 and 3), so its cap is half rounded up; Instagram has one (4), so its cap is every slot and it is never in breach. A network with one pillar slot is never in breach either. The `problem:` line says 50%, the spec's figure, whichever of the two figures applied: `pillar 1 holds 5 of 7 pillar slots on x, the cap is 50%` prints because 5 is above 4, and 4 of 7 on X prints nothing.

The week of 16 November 2026, with nothing dated, as `python3 scripts/plan.py --monday 2026-11-16` laid it out on 21 October 2026:

| Network | Pillars, Monday to Sunday | Most held | Cap |
|---|---|---|---|
| LinkedIn | 1, 2, 3, 4, 1, 2, 3 | 2 of 7 | 3 of 7 (half is 3.5) |
| X | 1, 3, 3, 1, 1, 3, 3 | 4 of 7 | 4 of 7 (two pillars for seven slots) |
| Instagram | 4, 4, 4, 4, 4, 4, 4 | 7 of 7 | 7 of 7 (one pillar) |

No `problem:` line. Saved ideas count too, and the planner cannot rebalance what is already saved: save four pillar 1 ideas for LinkedIn alone, Monday to Thursday of that week, and `plan.py` prints `problem: pillar 1 holds 4 of 7 pillar slots on linkedin, the cap is 50%`. Move Thursday's to the next week (`python3 scripts/redate.py <id> --date 2026-11-23`) and the week is clean: Thursday to Sunday take pillars 2, 3, 4 and 2.

In a campaign week the cap reads only what is left. In the week of 26 October 2026 the Design Systems campaign's pieces and their child slots fill all three networks from Monday to Friday, so LinkedIn has two pillar slots, Saturday and Sunday: each must go to a different pillar, because 2 of 2 is above half.

## Changing the plan

The plan file, `brands/me/plans/<monday>.md`, is a printout: `plan.py` never reads it, so editing it changes nothing. To change a slot, change what fills it and run `plan.py` again. `python3 scripts/redate.py <id> --date <day>` moves an idea or a post to another day and keeps everything else. `new_idea.py <id> ... --force` saves an idea again with another pillar or other surfaces; it keeps the TryPost link and status, and its slot: the date, surfaces, `reactive` flag and campaign stay unless `--date`, `--surfaces`, `--reactive` or `--campaign` is given, and a flag given wins. No flag clears a date (`redate.py` moves one). It drops the score, so score it again.

When a `problem:` line prints:

- `pillar <n> holds <a> of <b> pillar slots on <network>, the cap is 50%`: save one of that pillar's ideas on that network again with another pillar written for the network, or move it out of the week with `redate.py`.
- `two heavy formats on <network> on <day>`: move one of the two pieces with `redate.py`.
- `promo on its article's day: <id>`: move the promo with `redate.py`, 3 to 5 days after the article (spec §5.1).
- `no post on <network> on <day>`: never printed for a week `plan.py` built, which fills every slot; it guards a plan changed in code.

## Reactive slots

A reactive slot is an idea flagged `reactive: true` (`new_idea.py --reactive`); its card on the board carries the `reactive` label. It keeps its date, and the drafts written from it are the evergreen fallback: they go out if nothing happens. If something happens that week (a release, a study, a story the newest signals file or the author brings), a new idea replaces it on that day and those networks, and the fallback moves to the next reactive slot.

- Once its drafts exist, they fill the slot as `pillar-piece`, so the plan no longer shows it as reactive. Find the next reactive slot in the idea files: `grep -l "^reactive: true" brands/me/content/*.md`, then read each one's `scheduled_date` and `status`, and take the first later date that is not archived. With none later, the fallback waits for the next week's plan.
- Move the fallback with `python3 scripts/redate.py <id> --date <day>`: once for the idea, and once for each of its drafts (`<id>-li`, `<id>-ig`, `<id>-x`, those that exist). It changes the date only: status, score and review stay. Never move a draft with `new_post.py --force`, which rebuilds the whole frontmatter: an in-review draft goes back to `draft` and loses its score, a scored `draft` loses its score, and an approved, scheduled or published one keeps its status and score but takes the rebuild all the same (`leave_gate` in `scripts/lib/objects.py`).
- A piece that lands on a slot already taken shows in that cell as `(also <id>)`; the author keeps one.
- The idea card's title carries its day, so the next push updates the card. The next push also sends a moved post's new date to its TryPost draft and prints `updated <id>`; the draft stays a draft, and `trypost.synced_scheduled_date` records the date it was sent. A date already past is not sent (TryPost takes only a future `scheduled_at`), so a post moved into the past keeps its old day on TryPost's calendar. A day moved on TryPost's calendar never comes back to the file, and it lasts only until the file's date, text or labels next change: every update a push sends carries the file's date when it is still ahead. So dates move in the files, with `redate.py`, and the board follows (the files are the truth).

## Campaign cadence

A campaign file's `cadence` sets, per surface, the days its pieces go out: `daily`, `weekdays` (Monday to Friday), or a weekday name from `monday` to `sunday`. The Design Systems campaign has `{ linkedin: weekdays }`; the FLO campaign has `{ linkedin: tuesday, substack: thursday }`. `plan.py` never reads `cadence`: it places what is dated. `content-planner campaign` reads it to date one idea per cadence day between `start` and `end`, saved with `--campaign`, and each of those ideas fills a `campaign` slot on its day from the start, exempt from the cap, with its drafts taking the slot over once they exist. `surfaces` decides the child slots, for a campaign idea as for a campaign post (a network the idea lists is not a child), and `priority` (lower wins) decides a contested slot.

## The two runs

- `plan`, on Monday morning (`/marketeer:run monday`, or `/marketeer:content-planner plan <monday>`): the signals, the plan, an idea and a score for every gap, the push to the board. Then the author approves, swaps or rejects.
- `draft`, after approval (`/marketeer:run draft <monday>`): the pull that collects approvals, then every approved idea drafted for its networks and marked `draft`, and every child slot repurposed, the Tuesday and Thursday Viva Engage children among them, each piece through edit, score and brand-review, then the push and the plan written again. It never approves, marks posted or schedules. `/marketeer:run draft` with no date takes the week of the newest plan file in `brands/me/plans/` dated on or before the first Monday after today, never a week planned further ahead.

`plan.py` without `--monday` takes the first Monday after today in Lisbon, so a run on a Monday plans the following week; pass `--monday` with today's date to plan the current one. A `--monday` that is not a Monday exits 2.

## The commands, in order

The `plan` run:

1. `python3 scripts/scout.py` prints `signals brands/me/research/signals-<YYYY-MM-DD>.md <n> signals from <s> sources (<f> failed)`. A failed source is fine; exit 1 means every source failed, exit 2 a missing or malformed `sources.md`.
2. `python3 scripts/plan.py --monday <YYYY-MM-DD> --write` prints the plan (`# Week of <d Month yyyy>`, the grid, `## Ideas to choose`, `## To repurpose`, `## Long-form`), any `problem:` lines, then `plan <monday>: <n> slots, <m> ideas to choose, <k> to repurpose`, and saves `brands/me/plans/<monday>.md`. Exit 1 when there are problems.
3. For each line under `## Ideas to choose` (`- <day>: pillar <n> on <networks>[, reactive]`), `content-planner` hands `ideation` the pillar, the day, the networks and the reactive flag, and `ideation` saves the idea with `python3 scripts/new_idea.py <id> --title "<title>" --mode <mode> --pillar <n> --date <day> --surfaces linkedin,x [--reactive] [--source <url>]... --body-file <scratch>` (the line's networks, comma-separated with no space), which prints `created <id>`; then `python3 scripts/check.py <id>` until it prints `ok <id>`.
4. `python3 scripts/score.py <id> --relevance N --timeliness N --proof N --fit N --difference N` prints `score <id> <total>/25 pass|fail` (`idea-scoring.md`). A `fail` changes no status; the idea is reworked as `idea-scoring.md` (The total) says.
5. `python3 scripts/plan.py --monday <YYYY-MM-DD> --write` again: no `problem:` line, and `0 ideas to choose`.
6. `python3 scripts/trypost_sync.py push` prints `idea <id> idea` for each new card in Unassigned.

The `draft` run:

1. `python3 scripts/trypost_sync.py pull` prints `idea <id> approved` for each card moved to To Do and `archived <id>` for each card deleted.
2. `python3 scripts/plan.py --monday <YYYY-MM-DD>` prints the week as it now stands; its `## To repurpose` lines (`- <day> <network>: from <source id>`, such as `- 2026-10-29 viva: from ds-07-two-versions`) are the child slots to write.
3. For each idea dated in the week with `status: approved`, its drafts are `<id>-li`, `<id>-ig` and `<id>-x`, those its `surfaces` name. `write-social-post` writes only the ones missing, dated on the idea's day, and each new draft goes through `edit`, then `score` (`score <id> <total>/50 pass|fail`, and `status <id> in-review` on a pass), then `brand-review` (`review <id> high=N medium=N low=N blocked|clear`). A draft that already exists never gets a new body: it gets only the step it lacks, `score` when it has no score and `brand-review` when it has no review. Once every draft exists, `python3 scripts/mark.py <idea-id> draft` prints `<idea-id> is now draft`; when all of them existed before the run, the idea is marked at once with nothing drafted, so a run that died before the mark cannot leave it approved for ever.
4. `repurpose` runs once per source id, with all of that source's `## To repurpose` networks in one call (`ds-05-a-question-for, instagram and x`), so sibling children stay apart; then each new child goes through the same three. A source that is an idea (a campaign idea, or the saved idea that holds a Tuesday or Thursday LinkedIn slot for a Viva Engage child, before its drafts exist) is not a `repurpose` source: once step 3 has drafted it, `plan.py --monday <YYYY-MM-DD>` names its draft as the source; an idea not yet approved keeps its child lines for a later run.
5. `python3 scripts/trypost_sync.py push` prints `created <id>` for each new draft (`overdue <id>` when its date has passed), `idea <id> draft` for each card it moves to In Progress, and `failed <id>: <reason>` for any it could not push.
6. `python3 scripts/plan.py --monday <YYYY-MM-DD> --write` closes the run, so the plan file matches the drafts: each idea's drafts fill its slots as `pillar-piece`, and the summary reads `0 to repurpose` once every child slot is written.

Moving and marking, at any time:

- `python3 scripts/redate.py <id> --date YYYY-MM-DD[THH:MM]` moves an idea or a post and changes nothing else. A day alone keeps the piece's time in Lisbon; with no date before, a post takes its surface's usual time and an idea takes LinkedIn's time (08:30), whatever its surfaces; a time sets it. It prints `redated <id> <scheduled_date>`, and refuses a published or archived piece with exit 2. The next push carries the new day to the idea's card or the post's draft (Reactive slots).
- `python3 scripts/mark.py <id> approved|draft|posted` prints `<id> is now <status>`. `draft` takes only an approved idea; anything else exits 2 with `blocked <id>: <reason>` on stderr.
