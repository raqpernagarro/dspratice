---
name: content-planner
description: Plans the author's content in three modes chosen by the first word of the request. plan <monday> fills the week's open slots with scored ideas and pushes them to the TryPost board for the author to approve, swap or reject. campaign <slug> asks the author for a new campaign's goal, dates, mode, surfaces, cadence, hashtags, sources and tags, writes brands/me/campaigns/<slug>.md and one dated, scored idea per cadence slot. learn summarises the numbers the author entered with scripts/learn.py and, from five pieces, writes the playbook's tiers with their evidence. Use when the author asks to "plan the week", "plan next Monday", "fill the week", "set up a campaign", "what worked" or to "learn from the numbers". Not for writing drafts (run draft and the writers, write-social-post, repurpose, write-longform and write-video-script, do that), not for researching a topic (use research), and never for approving, scheduling or marking a piece posted, which is the author's.
---

# content-planner

Plans what the author posts. `plan` fills the open slots of a week with scored ideas for the Monday session, `campaign` sets up a campaign and its dated ideas, and `learn` turns the numbers the author entered and her TryPost edits into the playbook. The layout and the cadence checks are code (`scripts/plan.py` over `scripts/lib/planner.py`); this skill brings the judgement: which angle, which fact, which score. It never approves, schedules or marks anything posted: the Monday session is the author's. Paths are relative to the repository root.

## Inputs

In any order and wording (`plan 2026-10-26` is enough):

- The mode, the first word: `plan`, `campaign` or `learn`. Without one, "plan the week", "plan next Monday" or "fill the week" is `plan`; "set up a campaign" is `campaign`; "what worked" or "learn from the numbers" is `learn`. A request that fits none: ask the author which with `AskUserQuestion`.
- `plan`: the week's Monday as `YYYY-MM-DD`. With "next Monday" or no date, leave out `--monday`: `plan.py` takes the first Monday after today in Lisbon, and its heading names the week; say the date in one line. A date that is not a Monday makes `plan.py` exit 2: use the Monday of that week and say so.
- `campaign`: the slug, in lowercase kebab case, plus any of the campaign's fields the author already stated, which are not asked again.
- `learn`: nothing.
- Whether the author is in the session. `plan` runs without her: the board is where she decides. `campaign` needs her answers. `learn` needs nothing from her.

## Steps

### plan <monday>

1. Read the rules and the workspace:
   - `marketeer/references/planning.md`, `idea-scoring.md` and `sources.md`, in full.
   - `brands/me/brand-profile.md` (the Audiences table, the Pillars with their networks, the Proof points), `brands/me/playbook.md`, and the frontmatter of each campaign in `brands/me/campaigns/` whose dates touch the week.
   - Every research file that is not a signals file (`ls brands/me/research/*.md | grep -v /signals-`), in full: its `## Facts the author can use` lines are cited facts, each with its URL and date, and its `## What is being said` lines are dated signals.
   - The titles already in the workspace: `grep -h "^title:" brands/me/content/*.md`.
2. Run the scout: `python3 scripts/scout.py`. It prints `signals <path> <n> signals from <s> sources (<f> failed)`.
   - A failed source is fine: it is listed under `## Failed sources` in the file. Note the count for step 9.
   - Exit 1, every source failed: the scout still writes today's signals file, with no rows. Carry on with the newest signals file dated before today (`ls brands/me/research/signals-*.md | grep -v signals-<today>.md | tail -1`), and say in step 9 that today's file holds no rows. Its signals earn timeliness only within seven days before each idea's day (`idea-scoring.md`, Timeliness), so an old file mostly gives none; timeliness then comes from the research files and the week's own dates.
   - Exit 2, `sources.md` missing or malformed: stop and show the author the line it printed. The file is her; never edit it.
   - Then, on exit 0, read the newest signals file in full: `ls brands/me/research/signals-*.md | tail -1`. A signal earns timeliness only when it is dated within the seven days before the day the idea goes out, or is an event in that week (`idea-scoring.md`, Timeliness), so a signal read on a Monday may have run out by the following weekend.
3. Lay out the week: `python3 scripts/plan.py --monday <monday> --write`. It prints the grid, `## Ideas to choose`, `## To repurpose`, `## Long-form`, any `problem:` lines, then `plan <monday>: <n> slots, <m> ideas to choose, <k> to repurpose`, and saves `brands/me/plans/<monday>.md`. A full week is 23 slots: LinkedIn, Instagram and X on seven days, plus Viva Engage on Tuesday and Thursday; a Tuesday or Thursday whose LinkedIn slot is still an idea to choose counts its Viva Engage slot only once that idea is saved (`planning.md`, Slots). Read all of it, and note for step 9:
   - every `problem:` line. One made by dated pieces (a pillar over the cap among pillar pieces, `two heavy formats`, `promo on its article's day`) is the author's to settle, with the fixes in `planning.md` (Changing the plan): the ideas cannot fix it, and the run carries on;
   - every cell with `(also <id>)`: a dated piece that lost its slot (`planning.md`, Slots, rule 1). The author keeps one; moving the other is a date-only change, `python3 scripts/redate.py <id> --date <day>`, which is her call;
   - the `## To repurpose` lines: the child slots, which step 6 notes. On Tuesday and Thursday they include a `viva` line, the Viva Engage child of that day's LinkedIn piece (`planning.md`, Viva Engage); a day whose LinkedIn slot is still an idea to choose has none until its idea is saved;
   - the long-form of the week, which takes no slot.

   With `0 ideas to choose`, skip to step 6.
4. Write one idea for each line under `## Ideas to choose`, in the order printed. A line reads `- <day>: pillar <n> on <networks>[, reactive]`, and the idea takes exactly that day, that pillar and those networks: the cap and the empty slots were worked out for them. For each line, run `ideation` (follow `marketeer/skills/ideation/SKILL.md` steps 1 to 9) and hand it the plan slot: the pillar, the day, the networks, the reactive flag and the newest signals file. These inputs and choices are the planner's:
   - Context (ideation step 1): mode `personal` (or `nagarro` when the author asked for it this week), and the day and networks as the task sentence. With one network, name it as the surface, so `kit.md` is read for Instagram and only then.
   - Facts (ideation step 3): ideation's list and nothing more, a research file line that carries its own URL and page date among them. A signals row is never a fact: it feeds Timeliness and Difference only (`sources.md`, From a signal to an idea). A row worth building on goes to `research` first: offer it in step 9, and still write the idea from the best fact there is. When the pillar has neither a research fact nor a fresh signal (no row carries its number), the idea rests on the proof point that fits it best, and step 9 says the pillar needs a moment from the author. A proof point waits for the author only when it names a client, such as the BMW Group project; a Nagarro project such as the RMS Design System names no client and is used as written, with its date, its figures and its source (`marketeer-context`, Facts available).
   - Timeliness: hand ideation the signals rows tagged with the pillar or whose title touches its definition, and the research files' `## What is being said` lines, each with its date. Only a signal dated within the seven days before the slot's day, or an event in the slot's week, can make the idea timely (`idea-scoring.md`, Timeliness). An angle that answers one says which, by title and date. A hook or beat that cites a signal names its date ("on 15 October"), never "this week" or "this month": the post goes out days later.
   - Repeats (ideation step 2): besides the workspace titles, no angle takes the position of a piece dated in the week (the ids in the grid) or of an idea written earlier in this run, and no two ideas of the run lead with the same fact.
   - Choice (ideation step 4): The author chooses on the board, so do not ask her per idea. Take the first angle that does not need a fact from the author, which is the one with the strongest fact, and write `Chosen: <n>, by the strongest fact, as the author was not in the session`. When the author is in the session and asks to pick, ideation asks her as usual.
   - Reactive: a line marked `reactive` gets the evergreen fallback (`planning.md`, Reactive slots): an angle that holds whether or not anything happens that week. Say so in the outline's first beat ("Evergreen fallback for the reactive slot on <day>"), so the writer keeps it timeless. When news later takes the slot, the fallback moves to the next reactive slot with `python3 scripts/redate.py <id> --date <day>`, for the idea and each of its drafts; that is the author's move, not this run's.
   - Save (ideation step 8): ideation saves the idea once, with the slot's values as given: `python3 scripts/new_idea.py <idea-id> --title "<title>" --mode <mode> --pillar <n> --date <day> --surfaces <networks> [--reactive] [--source <url>]... --body-file <scratch file>`, the networks comma-separated with no space (`linkedin,x`). The expected line is `created <idea-id>`. The planner never saves it a second time to add a date, networks or the flag.
   - Check (ideation step 9): `python3 scripts/check.py <idea-id>` until it prints `ok <idea-id>`; ideation's own fix loop saves again with `--force`.
5. Score each idea against `idea-scoring.md`: `python3 scripts/score.py <idea-id> --relevance N --timeliness N --proof N --fit N --difference N` prints `score <idea-id> <total>/25 pass|fail`, against the pass mark of 15 in the script. Write the six-line breakdown from `idea-scoring.md` (Always the breakdown) into the conversation, each figure with the evidence it rests on.
   - Score by the anchors in `idea-scoring.md` as written: Timeliness counts back from the idea's `scheduled_date`, and Proof's 4 covers a fact offered as an analogy for another field.
   - Fit: the plan already matched the networks to the pillar, so Fit turns on the per-network format against the insight.
   - Under 15 (`fail`): run ideation again for that slot with the weakest dimension named (a stronger fact, a fresher signal, a sharper angle); it saves over the idea with `--force`, which drops the score, so score it again; the idea's date, surfaces, `reactive` flag and campaign survive the save unless the rework passes them again. After two reworks still under 15, keep the better version on the board and flag it in step 9 with the dimension that sank it.
6. Note the child slots. They come from `python3 scripts/plan.py --monday <monday>`, its `## To repurpose` section (`- <day> <network>: from <source id>`), run now that step 4's ideas are saved, so a Tuesday or Thursday whose LinkedIn slot has just taken an idea lists its `viva` child too; the draft run reads them from the same command, not from the saved plan file. Group the lines by source id. For each source, read its type and status (`grep -m1 "^type:" brands/me/content/<source id>.md` and `grep -m1 "^status:" brands/me/content/<source id>.md`) and note the one run that fills all of its slots, one line per source with all of its networks in one call, as the draft run does it (`planning.md`, The commands, in order):
   - A post: `/marketeer:repurpose <source id>, <network> and <network> (source <status>; <day> <network>, <day> <network>)`.
   - An idea (`type: idea`): a dated campaign idea, or a saved idea that holds a Tuesday or Thursday LinkedIn slot and so its `viva` child. `repurpose` refuses an idea as a source, so show no command for it. Note instead: `<source id> is an idea (<status>): once it is approved, the draft run writes its own drafts first, one per network it lists, and repurposes from the draft plan.py then names (<day> <network>, <day> <network>)`. For a `viva` child that draft is always `<source id>-li`, since the source holds the day's LinkedIn slot; a campaign idea whose `surfaces` leave out LinkedIn has no `-li` draft, and its children come from the drafts it does list. An idea that is not yet approved keeps its child lines for a later run.

   Do not run `repurpose`: the draft run does, after approval.
7. Check the week again: `python3 scripts/plan.py --monday <monday> --write`. The grid now names each new idea in its slots, and the summary line reads `0 ideas to choose`.
   - A `problem:` line that step 3 did not print was made by an idea that misses its line. A wrong day is a date-only change: `python3 scripts/redate.py <idea-id> --date <day>`. A wrong pillar or wrong networks: run ideation's save again with the line's values and `--force`, then score it again. Re-run `plan.py` after either.
   - `1 ideas to choose` or more: a line was skipped. Go back to step 4 for it.
   - A `problem:` line step 3 already printed stays for the author.
8. Push the ideas to the board: `python3 scripts/trypost_sync.py push`. Run it in the foreground and let it finish: TryPost throttles at about 60 requests a minute and the client waits and retries, so a push of the whole workspace takes minutes. Read every line:
   - `idea <idea-id> idea` for each new idea: its card is in the built-in Unassigned column, titled with its day and network and labelled with its pillar, its mode, its campaign and `reactive` when it has them.
   - `label <name>`: a label the board did not have yet, such as the first `pillar:2`, created before the cards that carry it.
   - `created`, `updated` or `unchanged` lines for other pieces: work saved earlier that the push carries. Leave them be.
   - `failed <id>: <reason>`: run the push once more; when it fails again, report the line.
   - `conflict <id>: ...`: run `python3 scripts/trypost_sync.py pull`, which brings back what the author moved on the board, then push again. A conflict that remains is the author's to settle: report it as printed. Never edit a status to clear it.
   - `missing in TryPost: <idea-id>` for an idea: The author deleted the card. The next pull prints `archived <idea-id>` and archives the file; the card is never recreated. Report it. When every card is missing because TryPost was wiped, the fix is `python3 scripts/trypost_sync.py pull --relink` once before any other pull or sync (`planning.md`, The Monday session), which is the author's call: report it.
   - `missing in TryPost: <id>` for a post: its TryPost draft is gone. Pull prints the same line and archives nothing; only `python3 scripts/trypost_sync.py pull --relink` forgets the link so the next push creates the draft again, which is the author's call. Report it.
   - An error before any line (TryPost not running): the ideas and the plan are saved; say so and offer the push again.
9. Show the author the week, in this order:
   - the grid as the second `plan.py` printed it, then its summary line;
   - each new idea: its id, day, networks, pillar and `reactive` when it is one, its title, the chosen angle's lead fact with its source, and the score with its six-line breakdown;
   - the repurpose notes from step 6;
   - what needs her eye: the `problem:` lines, a failed source, a `failed` or `conflict` push line, a flagged idea under 15, any `research` offer from step 4, and a pillar that needs a moment from the author;
   - each `(also <id>)` cell, with a destination for the piece that lost: the days it may move to (for a promo, the 3 to 5 days after its article, `planning.md`, Changing the plan; for any other piece, the nearest days on its network) and, for each, what holds that slot and whether `python3 scripts/redate.py <id> --date <day>` would displace it (a dated campaign piece, or a saved idea with a campaign, beats a piece without one, the lower campaign `priority` wins, a piece beats an idea of the same priority, and any dated piece beats a saved idea without a campaign, which then drops out of the cell; an idea that loses to another idea shows as `(also <idea-id>)`). A day past Sunday is read from `python3 scripts/plan.py --monday <next monday>`. The choice is the author's;
   - the push in one line: how many `idea` lines, and any `failed` or `conflict`.

   Then ask her to approve, swap or reject each idea: in TryPost, drag a card from Unassigned to To Do to approve it, or delete it to reject it (the slot opens again on the next plan); to swap, reject it and ask for another idea for the same day and networks. From the terminal, `python3 scripts/mark.py <idea-id> approved` approves one. Offer the next step in one line: "Once you have approved, draft the week with `/marketeer:run draft <monday>`?" That run, not this one, does the drafting (`planning.md`, The two runs and The commands, in order). With no date it takes the week of the newest plan file in `brands/me/plans/` dated on or before the first Monday after today, never a week planned further ahead. It pulls the approvals and takes the child slots from `python3 scripts/plan.py --monday <monday>`. For each approved idea it writes only the surfaces whose `<idea-id>-li`, `<idea-id>-ig` or `<idea-id>-x` draft is missing, and once all exist it runs `python3 scripts/mark.py <idea-id> draft` (approved to draft; the next push moves the card to In Progress), at once when all existed before the run, so a second run drafts nothing twice and a run that died before the mark cannot leave the idea approved for ever. A draft that already exists never gets a new body, only the score or the brand-review it lacks. `repurpose` runs once per source with all of that source's child networks in one call, so sibling children stay apart, and the Tuesday and Thursday `viva` lines are child slots like any other: the Viva Engage post for colleagues, saved as `<stem>-viva`. A source that is an idea is drafted first, and its children come from the draft `plan.py` then names. The run closes with `python3 scripts/plan.py --monday <monday> --write`, so the plan file matches the drafts.

### campaign <slug>

1. Read `marketeer/references/planning.md` (Campaign cadence, Slots), `brands/me/brand-profile.md`, every file in `brands/me/campaigns/` (the shape to copy, and the priorities already taken), and `brands/me/nagarro-overlay.md` when the mode will be `nagarro`. When `brands/me/campaigns/<slug>.md` exists, it is the author's: never overwrite it. Ask whether to create the missing ideas from it (step 4 onwards) or to choose another slug.
2. Ask for every field the author has not stated, with `AskUserQuestion`, in this order, each question with 2 to 4 options and the free-text answer for anything else. At most four questions go in one call, always: a question that does not fit moves to the next call, in order.
   - Call 1: the goal, in one sentence (options drafted from what the author said, the closest first); the mode (`personal` or `nagarro`); neutral (no, or yes: never Nagarro, FLO, a talk, a keynote, slides or the room); the surfaces (`multiSelect`: LinkedIn, Instagram, X, Substack). Viva Engage is never offered: it is a child network only, filled from the LinkedIn piece on Tuesday and Thursday (`planning.md`, Viva Engage).
   - Call 2: the start date (next Monday, or a date); the end date (three weeks after the start, or a date); then the cadence for each chosen surface, one question each (`daily`, `weekdays`, or a weekday name), as many as fit.
   - Call 3: the cadence questions left from call 2, then the required LinkedIn hashtags, only when LinkedIn is a surface (none; in `nagarro` mode the overlay's campaign hashtag; or her own, each starting with `#`), the source URLs the pieces may cite (none yet, or her list) and the people to tag (none, or her names, as plain names), as many as fit.
   - Call 4: what call 3 could not hold. With all four surfaces chosen, call 3 holds the last two cadences, the hashtags and the sources, and call 4 the people to tag.
   - The title comes from the goal in a few plain words; show it and take the author's wording when she gives one. `priority` is one more than the highest number in the other campaign files, so the existing campaigns win a shared slot; say so, and use a lower number only when the author asks for it.
   - Check each answer: dates as `YYYY-MM-DD` with the start on or before the end; a cadence `daily`, `weekdays` or `monday` to `sunday`; in `personal` mode no `#FluidicIntelligence` and no `nagarro.com/en/services` source. Ask again for what does not fit.
   - When the author cannot be asked (`AskUserQuestion` is unavailable, or she said she is away) and a field is missing, write nothing: list the missing fields and stop.
3. Write `brands/me/campaigns/<slug>.md` with the Write tool, the keys in the order the existing files use them:

   ```markdown
   ---
   slug: <slug>
   title: <title>
   mode: <personal | nagarro>
   goal: <goal>
   start: <YYYY-MM-DD>
   end: <YYYY-MM-DD>
   priority: <n>
   neutral: <true | false>
   surfaces: [<surface>, <surface>]
   required_hashtags_linkedin: ["#Tag"]
   tags_people: [<Name>, <Name>]
   sources: [<url>, <url>]
   cadence: { <surface>: <daily | weekdays | weekday>, <surface>: <...> }
   ---
   <the brief: what each week argues and which source it leans on, one line per week, in the author's words where she gave them>
   ```

   - `required_hashtags_linkedin` is one flat key, never a nested dict, because the parser reads only scalars, inline lists and one-level dicts; leave the line out when there are none or LinkedIn is not a surface. Empty lists are `[]`.
   - A value with `: ` or a leading quote in it goes in double quotes, as the FLO file's `title` and `goal` do.
   - Probe the file for dashes (step 5's probe) until it prints `0 0`.
4. Create one idea per cadence slot. A cadence slot is one surface on one day: every day from `start` to `end` that the surface's cadence names (`daily` every day, `weekdays` Monday to Friday, a weekday name that day). Skip a day before today, and a day and surface that already hold a piece or an idea of this campaign (`grep -l "^campaign: <slug>$" brands/me/content/*.md`, then their `scheduled_date` and `surface` or `surfaces`); say which were skipped. Before the first idea, ask the author one question: whether she picks each angle herself or the planner takes the strongest fact. Then, for each slot in date order, follow ideation steps 1 to 9 as `plan` step 4 sets them out, with these changes:
   - the campaign slug goes to `marketeer-context`, so the campaign's mode, neutral rule, hashtags and sources apply, and the brief's line for that week is the topic;
   - the pillar is the one the brief names for the week; with none, the pillar whose definition fits the topic, or `theme` when none fits, saved without `--pillar`;
   - the cadence slot is handed to ideation as a plan slot, and ideation saves the idea once with it: `python3 scripts/new_idea.py <idea-id> --title "<title>" --mode <campaign mode> [--pillar <n>] --campaign <slug> --date <day> --surfaces <surface> [--source <url>]... --body-file <scratch file>`, a `--source` for each campaign URL the idea uses, printing `created <idea-id>`. Saved with `--campaign`, the idea fills a `campaign` slot on its day, not a pillar slot: it is exempt from the cap, so five pillar 3 ideas on the LinkedIn weekdays break no rule, it wins a contested slot by the campaign's `priority` as a campaign post does, and `plan.py` reserves a `child` slot on each other network the campaign's `surfaces` lists (a network the idea lists is its own slot, never a child). Its drafts take the slot over once they exist, and the children are repurposed from them (`planning.md`, Slots).
5. Score each idea as `plan` step 5 does, and probe every file this mode wrote: `python3 -c "import sys; t=open(sys.argv[1],encoding='utf-8').read(); print(sys.argv[1], t.count(chr(8212)), t.count(chr(8211)))" <file>` prints `<file> 0 0` when it is clean.
6. Show the result: the campaign file's path and its frontmatter, then one line per idea in date order (`<day> <surface>: <idea-id>, "<title>", <total>/25`), the breakdown for any idea under 15, and the slots skipped. Offer `plan` for the campaign's first week: "Lay out the week of <first Monday> with `/marketeer:content-planner plan <first Monday>`?"

### learn

1. Run `python3 scripts/learn.py` and read its line.
   - `learn 0 pieces, nothing to write` (exit 1): no published piece has numbers yet. Write nothing. Say so, and say how numbers go in: a week after a post goes out, `python3 scripts/perf.py <id> --impressions N [--reactions N] [--comments N] [--reposts N] [--saves N] [--clicks N]`, on a piece marked posted. Stop.
   - `learn <n> pieces, confidence <level>`: run `python3 scripts/learn.py --write`, which replaces the `## Data` section of `brands/me/playbook.md` and keeps every other section. Never edit that section by hand.
   - Fewer than five pieces: stop after the Data section. Say that the tiers wait for five pieces with numbers (`learning.md`, Rules for an entry), and how many more are needed.
2. Read `brands/me/playbook.md` in full, the Data section as written, and `marketeer/references/learning.md`. Read `brands/me/edits.md` when it exists: each `## <time> <id>` entry is a diff from the draft as written to the text the author left in TryPost. Look for the same change in several pieces (an opening rewritten, a closing line cut, a word swapped, a hashtag dropped). A missing file means no edits have come back yet; say so.
3. Write the four sections after `## Data`, each dated with today's date in Lisbon: `## Quick wins, as of DD/MM/YYYY`, `## Strategic shifts, as of DD/MM/YYYY`, `## Experiments, as of DD/MM/YYYY` and `## Stop, as of DD/MM/YYYY`.
   - Each entry is one bullet in the shape `learning.md` sets out (Do more, Do less, Hypothesis, Stop), with its evidence and its confidence, because `marketeer-context` quotes entries verbatim.
   - Evidence is ids with the rates the Data section prints, or edits by id and time. Never a rate recomputed by hand or a figure the Data section does not print.
   - Confidence counts the pieces behind the entry, never the whole set: Low under 15, Medium under 30, High from 30. Two pieces above the baseline are an Experiment, not a Strategic shift.
   - A tier with nothing in it says `None this run.`
   - Replace the previous run's four sections with the Edit tool, from `## Quick wins, as of` to the end of the `## Stop` section, and keep the title, its paragraph, the Data section and any section the author wrote herself.
   - Probe the playbook for dashes, as `campaign` step 5 does, until it prints `0 0`.
4. Print the top three actions: the three Quick wins or Strategic shifts entries with the highest confidence, and on a tie the most pieces behind them, each with its evidence in one line.

## Outputs

- `plan`: `brands/me/research/signals-<YYYY-MM-DD>.md` from the scout; `brands/me/plans/<monday>.md` from `plan.py --write`, as the second run left it; one idea per idea slot, `brands/me/content/<idea-id>.md`, `type: idea`, `status: idea`, with `scheduled_date` on its day, its `surfaces`, `reactive: true` where the plan asked, a score out of 25 and, after the push, its TryPost card in Unassigned. In the conversation: the grid, each idea with its breakdown, the repurpose notes, what needs the author's eye and the push line.
- `campaign`: `brands/me/campaigns/<slug>.md`, new, and one dated, scored idea per cadence slot with `campaign: <slug>`.
- `learn`: the Data section of `brands/me/playbook.md`, through `learn.py --write`, and from five pieces the four tier sections after it; the top three actions in the conversation.
- The push also writes TryPost state (`trypost`: the idea or post id, `synced_at`, `synced_hash`, on an idea `synced_status` and on a post `synced_scheduled_date`) into every piece it creates or updates, other runs' pieces included.
- Nothing else in the repository changes. Scratch files live in the session's scratchpad directory.

## Rules

- Nothing is approved, scheduled or marked posted by this skill: it never runs `mark.py`, edits a status by hand or moves a card. The author approves, swaps and rejects; the draft run marks an idea `draft` once its drafts exist; the system never posts.
- Each idea takes the day, pillar and networks its plan line gives, and the reactive flag when the line has it. One idea per line; never more ideas than the plan asks for.
- Facts come only from a proof point in `brand-profile.md` (verbatim), a campaign's `sources`, a fact published in `brands/me/swipe/`, a research file's `## Facts the author can use` line with its URL and date, or from the author in the session. A signals row is never a fact: it feeds Timeliness and Difference, and a row worth using goes to `research` first. Never an invented anecdote, number, result, quote or client, and never a finding read from a title or a search snippet.
- Every choice made without the author is recorded: the angle on the idea's `Chosen:` line, and every choice and rework in the summary.
- Every score is shown with its six-line breakdown, each figure with its evidence. A figure with no evidence is lowered until there is some.
- The author's files stay her: `sources.md`, `brand-profile.md`, an existing campaign file and the swipe files are never edited. The plan file is written only by `plan.py --write` and is a printout that nothing reads back, and the playbook's Data section is written only by `learn.py --write`. A date-only change is `python3 scripts/redate.py <id> --date <day>`, never a save with `--force`.
- British English in every word, and no em or en dashes anywhere: ranges are written "3 to 5".

## Boundaries

- No drafts: `write-social-post` drafts an approved idea, `repurpose` writes the child slots that `python3 scripts/plan.py --monday <monday>` lists under `## To repurpose`, `write-longform` the articles and essays, `write-video-script` the Reels, and `/marketeer:run draft <monday>` chains them after approval and marks each drafted idea `draft` with `mark.py`. This skill only notes what they will do.
- No web research: it runs `scripts/scout.py` and reads what `research` saved; for a fresh fact on a topic it offers `research`, never reads the page itself.
- No sync beyond `scripts/trypost_sync.py push`, and `pull` to clear a conflict; it never calls the TryPost API directly and never creates a post in TryPost by hand. The push writes each synced piece's `trypost` state, other runs' pieces included; no other field of theirs changes.
- No network contact: nothing here reads a social network's analytics or posts to one. Every number in the playbook is one the author entered with `perf.py`.
- Writes only through `scripts/scout.py`, `scripts/plan.py --write`, `scripts/new_idea.py` (by way of `ideation`), `scripts/score.py`, `scripts/redate.py` (to put an idea back on its slot's day), `scripts/learn.py --write` and the sync, plus a new campaign file and the playbook's tier sections with the Write and Edit tools.

## Related

- `marketeer/references/planning.md`: the Monday session, the slot model, the cadence rules, the two runs and their commands. `idea-scoring.md`: the five dimensions out of 25. `sources.md`: the scout, the signals file and the seven-day rule. `learning.md`: the engagement rate, confidence and the tiers.
- `ideation`: step 4 of `plan` and step 4 of `campaign` follow it for each idea. `marketeer-context`: its first step, per idea.
- `research`: reads the web on one topic and saves the facts this skill cites. `repurpose`, `write-social-post`, `write-longform`, `write-video-script`, `score` and `brand-review`: the draft run, after the author approves.
- `scripts/scout.py`, `scripts/plan.py`, `scripts/new_idea.py`, `scripts/check.py`, `scripts/score.py`, `scripts/trypost_sync.py`, `scripts/redate.py` (a date-only change), `scripts/mark.py` (The author's approval from the terminal, and `draft` in the draft run), `scripts/perf.py` and `scripts/learn.py`.
