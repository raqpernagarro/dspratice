---
name: run
description: Chains the author's week in two modes chosen by the first word of the request. monday [<date>] runs content-planner plan for that week, the next Monday when no date is given, and ends with the week and the request to approve, swap or reject the ideas on the TryPost board. draft [<monday>] pulls the approvals from TryPost, drafts every approved idea of the week for its networks on its day with write-social-post and marks it draft, repurposes every child slot that scripts/plan.py lists, takes each new piece through edit, score and brand-review, pushes the drafts to TryPost and prints one table of day, network, id, score, review and status. Use when the author asks to "run Monday", "run the week", "draft the week", "draft what I approved" or "run draft". Not for one idea or one piece (use write-social-post, repurpose, edit, score or brand-review), not for a campaign or the playbook (use content-planner), and never for approving, scheduling or marking a piece posted, which is the author's.
---

# run

Chains the two runs of the week that `marketeer/references/planning.md` sets out (The two runs). `monday` plans the week and puts scored ideas on the TryPost board for the author. `draft`, once she has approved, drafts every approved idea and every child slot of the week, takes each piece through edit, score and brand-review, and pushes the drafts. The judgement lives in the skills it calls, each followed as written; this skill decides only what runs, in which order, and what is skipped because it exists. It never approves, schedules, marks a piece posted or sets a TryPost status: it prints what the author must decide. Paths are relative to the repository root.

## Inputs

In any order and wording (`draft 2026-10-26` is enough):

- The mode, the first word: `monday` or `draft`. Without one, "run Monday" or "run the week" is `monday`; "draft the week" or "draft what I approved" is `draft`. A request that fits neither: ask the author which with `AskUserQuestion`.
- The week's Monday as `YYYY-MM-DD`, optional in both modes. A date that is not a Monday makes `plan.py` exit 2: use the Monday of that week and say so.
  - `monday` without one: leave out `--monday`, as `content-planner` does. `plan.py` takes the first Monday after today in Lisbon, and its heading names the week; say the date in one line.
  - `draft` without one: the week the last `monday` run laid out, which is the newest plan file dated on or before the first Monday after today in Lisbon (`ls brands/me/plans/*.md`; only the names are read, and a later file is a week planned ahead). With no such file, leave out `--monday` as above. Say the date in one line, so the author can correct it.
- Whether the author is in the session. Both modes run without her: the board is where she decides. Where a skill this run calls would stop to ask her (a draft that exists, a fix that needs a fact), the run notes the question for step 7 and goes on with the next piece.

## Steps

### monday [<date>]

1. Plan the week: run `content-planner` in `plan` mode (follow `marketeer/skills/content-planner/SKILL.md`, `plan <monday>`, steps 1 to 9, as written) with the Monday from Inputs.
2. End where its step 9 ends, with everything it prints, in its order: the week table (the grid as the second `python3 scripts/plan.py --monday <monday> --write` printed it, then its summary line), each new idea with its score and six-line breakdown, the repurpose notes, what needs the author's eye, each `(also <id>)` cell with the days the piece that lost its slot may move to and what holds them, and the push in one line. Then the approval request, in its words: approve, swap or reject each idea in TryPost (drag a card from Unassigned to To Do to approve it, delete it to reject it), or approve one from the terminal with `python3 scripts/mark.py <idea-id> approved`. Offer the next run in one line: "Once you have approved, draft the week with `/marketeer:run draft <monday>`?"

This mode drafts nothing, not even an idea that is already approved: that is `draft`.

### draft [<monday>]

Read `marketeer/references/planning.md` in full first. Its sections The two runs and The commands in order set out this run, The Monday session the idea board and Changing the plan the fixes for a `problem:` line; every command below is one of its `draft` run lines.

1. Collect the approvals: `python3 scripts/trypost_sync.py pull`. Run it in the foreground and let it finish. Read every line:
   - `idea <id> approved`: The author dragged the card to To Do. `idea <id> idea` or `idea <id> draft`: she moved it back to Unassigned, or on to In Progress.
   - `archived <id>`: she deleted the card, so the idea is rejected. It is not drafted, and its slot opens again on the next plan.
   - `pulled <id>`, `approved <id>` or `posted <id>`: text, an approval or a posted mark the author gave a post in TryPost. Leave them be.
   - `blocked <id>: <reason>`: The author labelled a post approved that the gate still blocks. Report it as printed.
   - `conflict <id>: ...`: report it as printed, and never edit a status to clear it. An idea in conflict is not drafted this run.
   - `failed <id>: <reason>`: run the pull once more; when it fails again, report the line.
   - An error before any line (TryPost not running): stop. Say that the approvals on the board cannot be read and offer the run again once TryPost is up. Carry on with the files as they stand only when the author says so in the session.
2. Read the week: `python3 scripts/plan.py --monday <monday>`. It prints the grid, `## Ideas to choose`, `## To repurpose`, `## Long-form`, any `problem:` lines and `plan <monday>: <n> slots, <m> ideas to choose, <k> to repurpose`. Exit 1 only means `problem:` lines, which stay for the author; the run goes on. Note the `## To repurpose` lines (`- <day> <network>: from <source id>`): they are the child slots of step 4, and they come from this command, never from the saved plan file or a guess. On Tuesday and Thursday they include a `viva` line, the Viva Engage child of that day's LinkedIn piece (`planning.md`, Viva Engage); with both, the week has 23 slots.
3. Draft the approved ideas. List the approved ideas and their days:

   ```bash
   grep -l "^type: idea$" brands/me/content/*.md | xargs grep -l "^status: approved$" | xargs grep -H "^scheduled_date:"
   ```

   Keep those whose day, the first ten characters of `scheduled_date` (stored in Lisbon time), falls from the Monday to the Sunday. One dated in another week waits for that week's run. One with no `scheduled_date` is in no week: say so, and that the author gives it a day with `python3 scripts/redate.py <idea-id> --date <day>`. With none in the week, say so and go to step 4. Take each idea in date order, then by id:
   1. Find its drafts. Its `surfaces` (all three when it has none) name them: `linkedin` is `<idea-id>-li`, `instagram` is `<idea-id>-ig`, `x` is `<idea-id>-x`. A `viva` in `surfaces` names no draft here: the Viva Engage post is a child slot, written in step 4. Look for them with `ls brands/me/content/ | grep -E "^<idea-id>-(li|ig|x)\.md$"`, which leaves out a Reel (`-reel`) and an id that only starts the same way. A draft that exists is never written or edited again, because the author may have worked on it: it goes to sub-step 4 when it has no score (`score: null`) and to sub-step 5 when it has no `review:` line, and otherwise straight to the table. When every draft exists, say `<idea-id>: drafts exist, not drafted again` and go on from sub-step 4 with those that need it.
   2. Write the missing drafts: run `write-social-post` (follow `marketeer/skills/write-social-post/SKILL.md`, steps 1 to 10) with the idea id, the surfaces whose drafts are missing, and `--date <day>`, the idea's day, so `new_post.py` sets each network's usual time on it. Every draft prints `ok <id>` under `python3 scripts/check.py <id>` before it goes on. Its step 9 (Viva Engage) does not run here, because `viva` is never among the surfaces passed. The offer at the end of its step 10 is this run's next sub-step, not a question for the author.
   3. Edit each new draft: run `edit` (follow `marketeer/skills/edit/SKILL.md`) with the new draft ids. When its step 4 stops because a fix would change the core message, the draft stays as written and step 7 carries the note.
   4. Score each draft: run `score` (follow `marketeer/skills/score/SKILL.md`) with the draft ids. `score <id> <total>/50 pass|fail`, then `status <id> in-review` on a pass. A draft that fails stays `draft` with its fixes for the author; the run does not rewrite it.
   5. Review each draft: run `brand-review` (follow `marketeer/skills/brand-review/SKILL.md`) with the draft ids. `review <id> high=N medium=N low=N blocked|clear`. A `blocked` draft keeps the flags brand-review wrote and the status score gave it, and goes in the table with its High flags; the run moves on to the next piece. Lifting the flags is `edit`, then `brand-review`, on the author's word.
   6. Mark the idea draft: once every draft its surfaces name exists, `python3 scripts/mark.py <idea-id> draft` prints `<idea-id> is now draft`, and the push moves its card to In Progress. When a draft is still missing (write-social-post could not save it), leave the idea `approved` and report it, so the next run drafts what is missing.
4. Repurpose the child slots. Group the `## To repurpose` lines of step 2 by source id, and take the sources in date order. A source that is an idea (`grep -m1 "^type:" brands/me/content/<source id>.md` prints `type: idea`) is a campaign idea, whose campaign reserves the other networks before its drafts exist, or a saved idea on a Tuesday or Thursday LinkedIn slot, which reserves its `viva` child; an idea is never a `repurpose` source. When step 3 drafted it, run `python3 scripts/plan.py --monday <monday>` again and take that source's lines from it, which now name its draft; when it is not approved, skip its lines and report them in step 7 with the idea's status.
   1. Work out each line's child id as `marketeer/references/repurposing-matrix.md` (Ids) does: the source's stem plus `-ig`, `-x`, `-li` or `-viva` for the line's network. Look for it with `ls brands/me/content/<child-id>.md`. A child that exists is not made again: report `exists <child-id>` with its `scheduled_date`. It sits on another day, so the slot stays open for the author to settle with `python3 scripts/redate.py <child-id> --date <day>`.
   2. Run `repurpose` (follow `marketeer/skills/repurpose/SKILL.md`, steps 1 to 7) once per source, with the source id and the networks of its remaining lines as the targets (`ds-05-a-question-for, instagram and x`; `ds-07-two-versions, viva` for a Viva Engage line alone), so its children differ from each other as its step 4 asks. It dates each child on the source's day at the network's usual time, saves it `draft` and checks it until `check.py` prints `ok <child-id>`. The offer at the end of its step 7 is this run's next sub-step.
   3. Edit, score and review each new child, as step 3 sub-steps 3 to 5 do for a draft.
5. Push the drafts: `python3 scripts/trypost_sync.py push`. Run it in the foreground and let it finish: TryPost throttles at about 60 requests a minute and the client waits and retries, so a push of the whole workspace takes minutes. Read every line:
   - `created <id>` for each new draft: a plain draft in TryPost on the piece's day, labelled `review` when its score passed and `blocked` while a High flag stands. `overdue <id>` when its date has passed.
   - `idea <idea-id> draft` for each idea marked draft in step 3: its card moves to In Progress.
   - `label <name>`: a label the board did not have yet, created before the pieces that carry it.
   - `unchanged` or `updated` lines for other pieces: work saved earlier that the push carries. Leave them be.
   - `failed <id>: <reason>`: run the push once more; when it fails again, report the line.
   - `conflict <id>: ...`: run `python3 scripts/trypost_sync.py pull`, then push again. A conflict that remains is the author's to settle: report it as printed. Never edit a status to clear it.
   - `missing in TryPost: <id>`: the card or the post was deleted; the next pull archives an idea. Report it.
   - An error before any line (TryPost not running): the drafts are saved; say so and offer the push again.
6. Check the week: `python3 scripts/plan.py --monday <monday> --write`. The new pieces fill their slots: the drafts of each idea as `pillar-piece` cells (`campaign` cells for an idea with a campaign), the children as `campaign` cells, and a Viva Engage child as `child: <id>` (`campaign: <id>` when it carries a campaign), and the summary line reads `0 to repurpose` once every child slot is written. A `problem:` line that step 2 did not print was made by a new piece: report it with the fix `planning.md` (Changing the plan) gives. Moving a piece is the author's call.
7. Show the run. First one table, one row per piece this run wrote or found, in date order, then LinkedIn, Instagram, X and Viva Engage:

   | Day | Network | Id | Score | Review | Status |
   |---|---|---|---|---|---|
   | 2026-11-01 | linkedin | `<idea-id>-li` | 38/50 pass | clear, high 0, medium 1, low 0 | in-review |

   - Score: the total from `score.py`'s line with `pass` or `fail`, or `none`. Review: `blocked` or `clear` with the three counts from `review.py`'s line, or `none`. Status: read from the file after the push (`grep -m1 "^status:" brands/me/content/<id>.md`), with `(exists)` after it for a piece this run found and did not write.

   Then, in this order:
   - each `blocked` piece with its High flags, quoted from its `review_flags`;
   - the ideas marked draft, the ideas whose drafts existed, and the ideas of the week not drafted, with the reason (still `idea` in Unassigned, `archived`, in conflict, a draft missing);
   - the children that existed, with their days;
   - the slots under `## Ideas to choose` in step 6's plan, with their days and networks: a card the author deleted (`archived` in step 1) reopens its slot, and `/marketeer:content-planner plan <monday>` fills them;
   - the push in one line: how many `created` and `idea <id> draft` lines, and every `failed`, `conflict` and `missing` line;
   - what the author must decide: approve each passing draft by adding the `approved` label in TryPost, or with `python3 scripts/mark.py <id> approved` (it refuses a failing score or a High flag with `blocked <id>: ...`); fix a blocked or failing piece with `/marketeer:edit <id>`, then `/marketeer:score <id>` and `/marketeer:brand-review <id>`; settle the `problem:` lines and `(also <id>)` cells; give a day to an idea that has none; answer the questions the called skills left for her. A piece goes out only when she posts it by hand and marks it posted.

## Outputs

- `monday`: what `content-planner`'s `plan` mode writes (its Outputs): the signals file, `brands/me/plans/<monday>.md`, and one scored idea per idea slot with its card in Unassigned. In the conversation, the week and the approval request.
- `draft`, for each approved idea of the week: `brands/me/content/<idea-id>-li.md`, `-ig.md` and `-x.md`, those its `surfaces` name, `type: post`, `parent: <idea-id>`, on the idea's day at the network's usual time, edited, scored and reviewed; the idea at `status: draft`, its card in In Progress after the push.
- `draft`, for each child slot: `brands/me/content/<stem>-<suffix>.md`, `parent: <source id>`, on the source's day at the network's usual time, edited, scored and reviewed.
- Every new piece is `draft`, or `in-review` when its score passed, and in TryPost a plain draft with the `review` label when it passed and `blocked` while a High flag stands. `brands/me/plans/<monday>.md` as step 6 rewrote it. In the conversation, the table and what the author must decide.
- The sync writes too: the pull can set a status, bring back a body the author edited in TryPost and append the diff to `brands/me/edits.md`, and the push records its `trypost` state (post or card id, `synced_at`, `synced_hash`, on an idea `synced_status`, on a post `synced_scheduled_date` and `notes_synced`) in every piece it creates, updates or moves. Nothing else in the repository changes. Scratch files live in the session's scratchpad directory.

## Rules

- The run never approves, never marks posted, never schedules and never sets a TryPost status: no `mark.py <id> approved` or `posted`, no status edited by hand, no card moved and no post scheduled in TryPost. The one status it sets is `draft` on an idea whose drafts exist, through `mark.py <idea-id> draft`; `score.py` moves a passing draft to `in-review`. Approval is the author's.
- A second run makes nothing twice. A draft or a child that exists is never written or edited again; an approved idea whose drafts all exist is marked draft without drafting.
- Every skill it calls is followed as written: its context, its fact rules, its born-clean pass, the score rubric and brand-review's flags. Every draft prints `ok <id>` under `python3 scripts/check.py <id>` before it is scored.
- Facts come only from the idea's `## Facts and sources` lines, the source piece for a child, the swipe posts, the brand profile, or a research file line with its URL and date. Never an invented number, client, quote or anecdote.
- The child slots come only from `python3 scripts/plan.py --monday <monday>`, its `## To repurpose` lines.
- Each draft takes its idea's day and each child its source's day, at the network's usual time. The run never picks or moves a date: a date-only change is the author's, with `redate.py`.
- A failing or blocked piece never stops the run: it is reported with its fixes or its flags, and the run goes on to the next piece.
- British English in every word, and no em or en dashes anywhere: ranges are written "3 to 5".

## Boundaries

- No plan and no ideas of its own: `monday` hands the whole week to `content-planner`, and `draft` writes no idea and adds no slot.
- No long form and no Reels: articles, essays and notes come from `write-longform`, Reels from `write-video-script`. The plan's `## Long-form` lines take no slot and are not drafted here.
- No sync beyond `scripts/trypost_sync.py pull` and `push`: it never calls the TryPost API directly and never opens the TryPost web interface.
- No network contact: nothing here posts to a social network or reads one.
- Writes only through the skills and scripts it runs. `monday`, by way of `content-planner`: `scripts/scout.py`, `scripts/plan.py --write`, `scripts/new_idea.py` (through `ideation`), `scripts/score.py`, `scripts/redate.py` (to put an idea back on its slot's day) and the push. `draft`: the writers, `edit`, `score` and `brand-review` (by way of `scripts/new_post.py`, `set_body.py`, `score.py` and `review.py`), `scripts/mark.py <idea-id> draft`, `scripts/plan.py --write`, and the pull and the push.

## Related

- `marketeer/references/planning.md`: the Monday session, the slots, Changing the plan, the two runs and their commands in order. `marketeer/references/repurposing-matrix.md`: the child ids.
- `content-planner`: the `monday` run, step by step; also `campaign` and `learn`.
- `write-social-post`, `repurpose`, `edit`, `score` and `brand-review`: the `draft` run, piece by piece.
- `scripts/trypost_sync.py` (pull and push), `scripts/plan.py` (the week and its child slots), `scripts/mark.py` (`draft` for an idea, and the author's approval), `scripts/redate.py` (a date-only change, the author's) and `scripts/check.py`.
