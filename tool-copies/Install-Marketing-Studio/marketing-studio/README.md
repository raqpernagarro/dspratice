# Marketing Studio

A personal content system, built by Hugo França. It finds topics, suggests and scores ideas, drafts content in your voice, tailors each piece to LinkedIn, Instagram and X, writes the field notes behind them for Nagarro colleagues on Viva Engage, and keeps track of what still needs to go out. Long-form pieces for LinkedIn articles and Substack are part of it. The files under `brands/me/` are the source of truth; a local TryPost instance is where the content is seen and handled.

**It never publishes.** Nothing here connects to LinkedIn, Instagram, X, Viva Engage or Substack. You post by hand, and "posted" is a state you set yourself.

**First time here?** Follow `INSTALL.md`, then fill in your brand in `brands/me/` (start with `brand-profile.md`, `voice.md` and `swipe/`).

**The files are the truth.** TryPost can be wiped and rebuilt from `brands/me/` at any time. After a wipe, run `python3 scripts/trypost_sync.py pull --relink` once, before the first `sync`, for posts and ideas alike: it forgets the TryPost drafts and idea cards that are gone (an idea keeps its status and prints `relinked <id>`), so the next push creates them again, each idea card in the column its status names. A plain pull would instead archive every idea whose card is missing.

## Layout

```
brands/me/          voice, rules, pillars, campaigns, sources, research, week plans, content objects and their assets
scripts/            create, check, score, plan, scout and sync tools (Python 3, standard library only)
  lib/              parsing, frontmatter, dates, TryPost client, sync rules
tests/              unit tests with an in-memory fake TryPost
evals/              content quality harness (from Marketeer)
marketeer/          the Claude Code plugin: skills and references that write and score posts
trypost/            the local TryPost stack: compose file, setup scripts, secrets (.env, never share it), README, patched source
docs/               notes on the TryPost API
```

## Running things

Sync the files with TryPost (pull edits, approvals and posted marks; push new and changed drafts):

```bash
python3 scripts/trypost_sync.py sync
```

Mark a piece from the command line:

```bash
python3 scripts/mark.py ds-02-rules-ai-has-never-seen posted
```

Run the tests and the eval harness:

```bash
python3 -m unittest discover tests
```

```bash
python3 evals/run.py
```

TryPost itself: see `trypost/README.md` for start, stop and upgrade, and for the manual channels the drafts sit on. Viva Engage and Substack each have a placeholder channel, "Viva Engage (manual)" and "Substack (manual)", made once with the step in that file's "Adding a manual channel" section; a push that finds no channel for a surface prints a `failed <id>` line naming it.

## Writing

The `marketeer` plugin takes a pillar to three scored drafts, then reviews, edits and repurposes them, and writes long form and Reel scripts. In a session opened in this repository, invoke its skills as `/marketeer:<skill>`:

- `/marketeer:marketeer-context` loads the audience, pillar, voice, hard rules, mode and campaign from `brands/me/` into one block that the other skills start from. It only reads.
- `/marketeer:ideation` turns a pillar or a topic into an idea with angles that each rest on a named fact, hooks and an outline, saved as `brands/me/content/<idea-id>.md`.
- `/marketeer:write-social-post` drafts an idea for LinkedIn, Instagram and X, saved as `<idea-id>-li`, `<idea-id>-ig` and `<idea-id>-x`, each clean under `check.py`, and on request a Viva Engage post from the LinkedIn draft, `<idea-id>-viva`.
- `/marketeer:score` rates a draft from 1 to 10 on hook, voice, value, fit and ready and writes the score. A total of 35 or more with no dimension under 5 moves it to `in-review`. It never approves.
- `/marketeer:brand-review` reads a piece's numbers, names, quotes and claims against their sources and the mode and campaign rules, and writes High, Medium or Low flags with `review.py`. It is advisory, never legal sign-off.
- `/marketeer:edit` runs the seven sweeps on a saved piece, the flags and `check.py` problems first, and writes the body back with `set_body.py`. It never adds a fact.
- `/marketeer:write-longform` drafts a LinkedIn article, a Substack essay and its note from one idea, saved as `<idea-id>-article`, `<idea-id>-essay` and `<idea-id>-note`, each held to its word count by `check.py`.
- `/marketeer:repurpose` turns a written piece into children for the other networks, each rewritten for its network and linked to its source with `parent:`, and a LinkedIn post into a Viva Engage post for colleagues (`-viva`).
- `/marketeer:write-video-script` writes an Instagram Reel's script, caption and visual brief from an idea or a post, saved as the source's id with `-reel` in place of any network ending (`-li`, `-ig`, `-x`), on a free Instagram day.

Two surfaces sit beside the three networks:

- Viva Engage (`viva`), Nagarro's internal network for colleagues only: the field note behind that day's LinkedIn post on Tuesday and Thursday (what we learned, a tool colleagues can use, the story behind a decision, a question for the design community), always in `nagarro` mode, with no hashtags, links inline and no pitch (`marketeer/references/surfaces/viva-engage.md`); in TryPost, a draft on the "Viva Engage (manual)" channel.
- Substack (`substack`): the essays and notes `write-longform` writes (`marketeer/references/surfaces/substack.md`); in TryPost a note is a draft on the "Substack (manual)" channel, and an essay keeps its long-form card in To Do and gains one dated draft on the Substack (manual) channel with its title, subtitle and a pointer to the card, never its body, so you copy the essay from its file.

The gate: a score of 35 or more with no dimension under 5 moves a draft to `in-review`; an article, essay or note has no score, so a brand-review with no High flag on a draft that `check.py` passes moves it to `in-review`, and a High flag sends it back; a High flag or a failing score blocks `mark.py approved`; a new body on an `in-review` piece clears the score and sends it back to `draft`.

The plugin is enabled through `.claude/settings.json` (`marketeer@marketing-studio`, from the marketplace in `.claude-plugin/`), so it should load in a session opened here. Check it in this order: run `/plugin` and look for `marketeer`; if it is absent, run `claude plugin marketplace add .` once from the repository root; if it still does not load, start with `claude --plugin-dir ./marketeer`.

The skills call these scripts, and each can be run by hand. The id is the first argument.

Create an idea, with its body from a file or from stdin:

```bash
python3 scripts/new_idea.py my-idea --title "A working title" --mode personal --pillar 1 --body-file idea.md
```

Create a draft for one network, linked to its idea:

```bash
python3 scripts/new_post.py my-idea-li --title "A working title" --surface linkedin --format text --mode personal --pillar 1 --parent my-idea --date 2026-10-31 --body-file post.md
```

Check one or more objects against the schema and the text rules (`ok <id>`, or one line per problem), or every object:

```bash
python3 scripts/check.py agents-fill-gaps-with-the-same-guess-li
```

```bash
python3 scripts/check.py --all
```

Record a score and apply the review gate:

```bash
python3 scripts/score.py my-idea-li --hook 8 --voice 8 --value 6 --fit 9 --ready 9
```

Record a review's flags (each run replaces the whole set, and a run with no flags records a clean review):

```bash
python3 scripts/review.py my-idea-li --high "body line 3: '40%' has no source"
```

Replace the body of a saved piece and keep every other field:

```bash
python3 scripts/set_body.py my-idea-li --body-file post.md
```

Then `python3 scripts/trypost_sync.py push` puts the new drafts in TryPost with the `review` label.

## The week

You start the week on Monday. The planner gives LinkedIn, Instagram and X a slot every day, and Viva Engage a slot on Tuesday and Thursday, 23 in all: campaign pieces first, then the pieces already dated, then scored ideas for the gaps. Viva Engage never takes an idea: its slot is a child of that day's LinkedIn piece. You approve on the TryPost board, and the drafting run writes what you approved. The rules are in `marketeer/references/planning.md`.

The Monday run is one command in a session opened here, `/marketeer:run monday 2026-10-26` (Claude Code has a built-in skill also called `run`, so the namespaced `/marketeer:run` is the name to type, never `/run`), or its four pieces in order:

```bash
python3 scripts/scout.py
```

```bash
python3 scripts/plan.py --monday 2026-10-26 --write
```

Then `/marketeer:content-planner plan 2026-10-26`, and:

```bash
python3 scripts/trypost_sync.py push
```

The scout reads the feeds and Hacker News searches in `brands/me/sources.md` and writes `brands/me/research/signals-<date>.md`, each row dated and linked to its page. `plan.py` lays out the week, prints the gaps (`## Ideas to choose`) and the child slots to repurpose, and saves a printout as `brands/me/plans/2026-10-26.md`; editing that file changes nothing. `content-planner plan` writes the ideas for the gaps, scores each out of 25 and checks the week again (it runs the scout, the plan and the push itself as well). The push puts each new idea on the TryPost Ideas board, in Unassigned. For a topic worth more than a signal, `/marketeer:research <topic>` reads the pages and writes `brands/me/research/<topic-slug>.md`, whose facts the ideas can cite.

Approving is yours, in TryPost: drag an idea card from Unassigned to To Do to approve it, or delete it to reject it (the slot opens again on the next plan). From the terminal:

```bash
python3 scripts/mark.py my-idea approved
```

Then the drafting run, `/marketeer:run draft 2026-10-26`, pulls the approvals, drafts each approved idea for its networks on its day, repurposes the child slots (the campaign's other networks, and the Tuesday and Thursday Viva Engage posts), takes every new piece through `edit`, `score` and `brand-review`, marks each drafted idea `draft` (In Progress on the board), pushes the drafts to TryPost with the `review` label and prints one table of day, network, id, score, review and status. It never approves, schedules or marks anything posted, and a second run in the same week makes nothing twice.

After a piece goes out, you type in what it earned, from the network's own analytics:

```bash
python3 scripts/perf.py my-idea-li --impressions 1200 --reactions 40 --comments 6
```

`/marketeer:content-planner learn` summarises those numbers into the `## Data` section of `brands/me/playbook.md` (`scripts/learn.py`) and, from five pieces with numbers, writes the quick wins, strategic shifts, experiments and stops, with the edits you made in TryPost (`brands/me/edits.md`) as evidence.

`python3 scripts/redate.py <id> --date 2026-11-02` moves an idea or a post to another day and changes nothing else; the next push carries the day to TryPost. Move days in the files: a day changed on TryPost's calendar lasts only until the next push updates that draft.

`python3 scripts/mark.py <idea-id> draft` marks an approved idea whose drafts are written; the drafting run does it itself.

## Documents

- Design: `docs/superpowers/specs/2026-10-21-marketing-studio-design.md`
- Plans: `docs/superpowers/plans/`
- Acceptance records: `docs/superpowers/plans/2026-10-21-slice-0-acceptance.md`, `docs/superpowers/plans/2026-10-22-slice-1-acceptance.md`, `docs/superpowers/plans/2026-10-22-slice-2-acceptance.md`, `docs/superpowers/plans/2026-10-22-slice-3-acceptance.md`, `docs/superpowers/plans/2026-10-22-slice-4-acceptance.md`
- Research: `docs/research/`
- Playbook notes: `docs/playbook/interview-notes.md`
