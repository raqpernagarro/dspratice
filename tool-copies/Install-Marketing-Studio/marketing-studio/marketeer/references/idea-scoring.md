# Idea scoring: five dimensions out of 25

An idea is scored before the author sees it on the board, so the week's ideas can be ranked and the weak ones reworked before they cost her a decision. Five dimensions, each a whole number from 0 to 5, total out of 25; an idea passes at 15. The pass mark is the script's, `IDEA_SCORE_PASS` in `scripts/lib/content.py`, and `scripts/score.py` prints `pass` or `fail` against it. This is not the post score: a draft is scored 1 to 10 on hook, voice, value, fit and ready by the `score` skill, and that score gates review. An idea's score gates nothing in the scripts: `scripts/score.py` records it and never changes the idea's status, and `mark.py <id> approved` never checks it. Read this with `planning.md`, `sources.md` and the `marketeer-context` block for the idea's pillar.

## Where it comes from

The research report's company rubric (`docs/research/content-intelligence.md` §4) scores ideas 0 to 5 on relevance to the pillar and reader, timeliness, expertise and proof, differentiation, format and network fit, and past performance, weighted, and says to show the breakdown and never a black-box number. This rubric keeps that shape for one person, with three changes:

- Differentiation there means low overlap with competitor coverage, found through a search API. That signal is dropped with the competitor monitor (spec §8.1, `competitor-monitor` dropped on 21 October 2026). Difference here is read against what the signals show everyone saying.
- Past performance of similar posts is not a dimension. The playbook carries it (`learning.md`), and `marketeer-context` shows its entries.
- No weights: each dimension counts the same, so the breakdown reads at a glance.

## The dimensions

The anchors below are 5, 3, 1 and 0; a 4 or a 2 sits between the anchors either side, and Proof spells out its 4.

### Relevance

Does the idea speak to its pillar's reader about what they keep getting wrong? Read the pillar's row of the Audiences table in `brands/me/brand-profile.md` (the context block's `Reader:` and `Keeps getting wrong:` lines).

- 5: it names the reader and argues against the exact mistake in "Keeps getting wrong", towards "When they get it right".
- 3: the right reader and the pillar's subject, but not the mistake they keep making.
- 1: the pillar's subject with no reader in it.
- 0: it fits no pillar's definition.

### Timeliness

Is there a reason to post it this week?

The seven days count back from the idea's `scheduled_date`, the day the post goes out, never from the day the idea is written or the scout ran: a signal dated 15 October makes a post of 1 November no more timely than any other old page. An event counts when it falls in the week of that day. An idea with no date counts back from the day it is scored, and is scored again once it has one.

- 5: a signal dated within the seven days before the idea's day, in the newest `brands/me/research/signals-*.md` or a `research/<topic>.md` file, that the idea answers; or an event or date in the week it goes out.
- 3: a conversation the signals show over those seven days, with no single item the idea answers.
- 1: a signal or an event older than that, or a date outside the week.
- 0: evergreen, with no signal or date behind it. That is right for a reactive fallback; score it honestly all the same.

A Hacker News date is a posting date, not when the page was written (`sources.md`): an old page posted there this week earns no timeliness from the posting date. Open it and go by its own date.

### Proof

Can every claim in the angle be backed? The facts are those the context block lists under Facts available, the facts in a `research/<topic>.md` file (each read on a page, with its URL and date), and what the author gives.

- 5: a specific fact with a source that can be checked: a proof point from `brand-profile.md`, verbatim; a campaign `sources` page; a number, name or date read on a page with its URL (a `research/<topic>.md` fact).
- 4: a fact already published in `brands/me/swipe/`, reused as published; or a checkable fact offered as an analogy for another field and framed as one (a design system's savings argued for AI, a study of code models argued for agents using products), because it backs the comparison, not the claim itself.
- 3: something only the author can tell (a moment she lived, a call she made), not yet given in the session.
- 1: a general observation with no fact behind it.
- 0: the idea needs a fact nobody has. It cannot pass until the author gives one or the angle changes.

### Fit

Do the idea's networks and its suggested format suit it?

- 5: every network in the idea's `surfaces` is one its pillar is written for (`brand-profile.md`, and `PILLAR_NETWORKS` in `planning.md`), and the per-network note names the format the insight calls for in `repurposing-matrix.md` (Insight types to formats): a step by step is a carousel or a thread, one counterintuitive claim a single post.
- 3: the networks fit, but the format fights the insight (a framework squeezed into one X post), or one network is outside the pillar's.
- 1: the idea needs a format a network does not have, such as a long argument on Instagram with no visual idea.
- 0: no network in the idea fits its pillar.

### Difference

Is this the author's angle, or what everyone is saying? Read the signals and research files for the topic first.

- 5: no signal of the last seven days takes this position, and it rests on the author's own fact or experience.
- 3: a topic the signals are full of, with a position of her own on it.
- 1: the angle most signals already take, said again.
- 0: it restates a headline from the signals.

## The total

| Total | What it means |
|---|---|
| 20 to 25 | Strong. Offer it first for its slot. |
| 15 to 19 | Passes. It goes on the board. |
| Under 15 | Fails. Rework the weakest dimension (a stronger fact, a fresher signal, a sharper angle) or write another idea for the slot, and say which dimension sank it. |

Where two ideas compete for one slot, offer the higher total first (spec §5.2, "highest score first"), and on a tie the higher proof. This is the skill's judgement, not the planner's: `plan.py` gives a slot to saved ideas in id order and shows the rest as `(also <id>)`.

## Recording it

Score after `check.py` prints `ok <id>`, then run:

```bash
python3 scripts/score.py <idea-id> --relevance N --timeliness N --proof N --fit N --difference N
```

It prints `score <idea-id> <total>/25 pass|fail` (pass from 15) and writes `score: {total, relevance, timeliness, proof, fit, difference}` to the file. Post flags on an idea (`--hook`, `--voice`) are an error. Saving the idea again with `new_idea.py --force` drops the score, so score it again after.

## Always the breakdown

Never show a total alone. Every time a score is shown to the author, the five figures come with it, each with the one thing it rests on:

```text
<idea-id>: <total>/25, passes | fails (15)
Relevance <n>: <the reader and the "Keeps getting wrong" cell it speaks to>
Timeliness <n>: <the signal's title and DD/MM/YYYY, or the event and its date, or "evergreen">
Proof <n>: <the fact and its source, or "needs a fact from the author: <what>">
Fit <n>: <the networks against the pillar's, and the format against the insight>
Difference <n>: <the signals it differs from, or repeats, by title and date>
```

Each line names its evidence: the reader's cell, the signal with its date, the fact with its source, the networks and format, the signals it differs from. A figure with no evidence on its line is a guess; lower it until there is evidence. The TryPost card shows the total (`Pillar <n> · score <total>/25`); the breakdown lives in the file and in the conversation.
