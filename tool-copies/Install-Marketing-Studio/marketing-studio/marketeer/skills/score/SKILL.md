---
name: score
description: Scores one or more of the author's draft posts (brands/me/content/<id>.md) from 1 to 10 on hook, voice, value, fit and ready, against voice.md, hooks.md, ai-tells.md, the surface file and the swipe posts, writes the score to each file with scripts/score.py and prints a fixed scorecard with every deduction cited and up to three rule-backed fixes. A total of 35 or more with no dimension under 5 moves a draft to in-review; a lower score leaves it in draft, or sends an in-review piece back to draft. Use when the author asks to "score this", "rate the drafts", "is this ready" or "which of the three is weakest". Not for rewriting a draft (use write-social-post, saving over it with --force), not for compliance review or High flags (use brand-review), and never for approving, which is the author's call alone (this skill never sets approved).
---

# score

Rates draft posts the way a hard editor would, against the author's own rules and her best posts, writes the five figures to each file with `scripts/score.py`, and prints one scorecard per piece. The gate lives in `scripts/lib/content.py`: a score passes at a total of 35 or more with no dimension under 5. Passing moves a `draft` to `in-review`; failing moves an `in-review` piece back to `draft`. Nothing here ever sets `approved`. Paths are relative to the repository root.

## Inputs

In any order and wording (`agents-fill-gaps-with-the-same-guess-li` is enough):

- One or more post ids: the file name of `brands/me/content/<id>.md` without `.md`, a `type: post` object. Several ids are scored one after the other, each with its own scorecard.
- An idea id (`type: idea`) is not scored. When the author names one, score the drafts saved from it (`<idea-id>-li`, `<idea-id>-ig`, `<idea-id>-x`, `<idea-id>-viva`, whichever exist) and say so in one line.
- A piece already `approved`, `scheduled`, `published` or `archived` is scored only when the author names it. `score.py` leaves its status as it is, and the scorecard says so.
- A question in place of an instruction ("is this ready", "which of the three is weakest"): score every id it names and answer it in step 7.

## Steps

1. Run `marketeer-context` (`/marketeer:marketeer-context`) with the post's `pillar` (`theme` when it has none), `mode` and `campaign` from its frontmatter, its surface and format, and the id as the task sentence. When several ids share pillar, mode and campaign (the drafts of one idea), run it once and name no surface. Work from its block: the four Voice rows and the two swipe files on the `Swipe:` line, the Hard rules, the Mode rules, the Campaign, Facts available and Gaps.
2. Read, in full, and note each post's `updated` value:
   - the post: the body and the frontmatter (`surface`, `format`, `status`, `scheduled_date`, `first_comment`, `sources`, `parent`, and on Instagram `visual_brief` and `image_prompt`);
   - the parent idea when `parent` is set: its `## Facts and sources` is the list of facts the draft may state, at the strength each line states them. Without a parent, the block's Facts available is the list;
   - `brands/me/voice.md`: the voice card, "I never say", the absence signals, the closing lines;
   - `marketeer/references/hooks.md`, `marketeer/references/ai-tells.md` and `marketeer/references/surfaces/<surface>.md` (`surfaces/viva-engage.md` for `viva`);
   - `brands/me/kit.md`, for a post with a `visual_brief`;
   - the two swipe files on the `Swipe:` line, which are the bar every dimension is measured against;
   - each swipe file that a fact line names as its source: to check that the draft keeps that fact's figures, scope and verbs, and whether that post is out yet. Its `source:` line gives its date; its own object in `brands/me/content/` (`swipe/ds-07.md` is `content/ds-07-*.md`) gives `scheduled_date` and `posted_at`. A post with neither a date nor an object counts as out.
3. Run `python3 scripts/check.py <id>`. It prints `ok <id>`, or one `<id>: <problem>` line per problem. Any problem caps `ready` at 4 and costs 1 point of `ready` per line, and fixing it comes first under Fixes. A line that looks wrong about the draft is still a problem: the fix is to the checker, and the piece stays capped until `check.py` is fixed and the piece is scored again. `check.py` does not read `visual_brief` or `image_prompt`: read them yourself for dashes, American spelling and banned words.
4. Score the five dimensions against the rubric below. For each one:
   1. Start at 8. Start at 10 only when you can name the swipe file and the line or feature the draft matches on that dimension, by the test the rubric gives for it.
   2. Subtract each deduction that applies, at the size the rubric gives, and note the line it concerns and the rule it breaks.
   3. Apply the caps: the score is the lowest of the result and every cap that applies, and never below 1.

   Write each deduction down as you make it. A deduction is never made without a rule or a quoted line behind it, and a point is never kept because the draft is nearly there.
5. Write the score. Before writing, check that `updated` in the file still reads as in step 2; if the file has changed, start that id again from step 2. Then run `python3 scripts/score.py <id> --hook N --voice N --value N --fit N --ready N`. The id is the first argument, not a flag. It prints `score <id> <total>/50 pass|fail`, then `status <id> in-review` or `status <id> draft` when the gate moved the status. No status line means the status did not change. Either of two lines (exit code 2) means nothing was written: `<id>: no such object: <id>`, when the id has no file in `brands/me/content/` (check the spelling against the folder and ask the author; never create the file), and `<id>: <problem>`, when the frontmatter is broken (`check.py` will have named it too). Fix nothing yourself: write `NOT WRITTEN: <problem>` on the TOTAL line and make the problem fix 1.
6. Print the scorecard for each id, in the format below, with its deduction lines under it.
7. Close in a few lines. With several ids, name the weakest (the lowest total; on a tie, the lowest single dimension) and why, in one line. Answer the author's question if she asked one: a passing piece is ready for her review, never "approved". Then offer one next step: "Rewrite `<weakest id>` with `/marketeer:write-social-post <idea-id> <surface>` from these fixes, saving over it with `--force`?" A rewrite clears the score and sends an `in-review` piece back to `draft`, so it is scored again after.

### The scorecard

Fixed: these lines, in this order, spelt so, in one fenced block per id.

```text
SCORE <id> (<surface>)
Hook   N/10  <pattern> · <one line>
Voice  N/10  <one line>
Value  N/10  <one line>
Fit    N/10  <one line>
Ready  N/10  check.py: ok | <n> problems
TOTAL  NN/50  PASS (in-review) | FAIL (draft)
Fixes
1. <rule-backed fix>
2. <rule-backed fix>
3. <rule-backed fix>
```

- `<pattern>` is the `hooks.md` pattern name, or `no pattern`. Each `<one line>` gives the main reason for the figure: the swipe line it matches when it started at 10, otherwise its largest deduction.
- `TOTAL` reads `score.py`'s line. The parentheses hold the status the file has after the run: `PASS (in-review)` or `FAIL (draft)` for a piece that was a draft or in review, whether or not it moved; for any other status, that status and "unchanged" (`PASS (approved, unchanged)`).
- Fixes: up to three, `none` when nothing was deducted. First every `check.py` problem (one fix may cover several lines of the same rule), then fact and timing problems under `ready`, then the deduction that costs the most points: the lowest-scoring dimension first on a tie, then the order of the scorecard, then the order of the rubric, and no dimension twice while another dimension still has a deduction. Each fix says what to change, quotes the line, and names the rule.
- Under the block, one line per deduction, and one per dimension that started at 10:
  ```text
  Deductions
  → Hook -1: "<the line, quoted>" (<file>, <rule>)
  → Fit started at 10: <swipe file>, <what it matches>
  ```

### The rubric

#### hook: does the first thing a reader sees earn the next line?

The hook is, on LinkedIn, lines 1 and 2, up to the fold; on Instagram, the card's text and the caption's first 125 characters, read together; on X, the whole first post; on Viva Engage, the title line and the paragraph after it.

- Starts at 10 when it is one claim or one moment, as short and specific as the swipe openers ("The most expensive AI mistake in product work is the one that passes review.", series-1).
- Caps:
  - The first line holds a banned word or pattern from `ai-tells.md`, or an item from the Never list in `hooks.md`: at most 2.
  - No pattern from `hooks.md` fits: at most 4.
  - It could sit on top of another person's post unchanged (`hooks.md`, Self-check 3): at most 5.
  - LinkedIn: not complete within 210 characters: at most 6. Instagram: the caption's first 125 characters repeat the card: at most 6 (not on a Reel, which has no card and whose caption opens on the spoken hook, `reels.md`). X: the first post does not stand alone: at most 5.
- Deductions:
  - Each "Fails when" of its pattern in `hooks.md` that applies: -1.
  - It does not name the problem, stake or question the rest of the post answers (`hooks.md`, Self-check 2, and the pattern's "What it does"): -1.
  - LinkedIn: complete within 210 characters but not within 140, the mobile fold: -1.
  - Instagram: the card's text alone could top another person's post, and the grid shows it without the caption: -1.
  - Instagram: the caption's first 125 characters bring a new angle but also restate the card's claim in other words (`instagram.md`, Structure: "never a repeat of the image"): -1. A restatement with nothing new is the cap above.

#### voice: would the author recognise it as her own?

- Starts at 10 when it reads as the swipe posts do from end to end: a long sentence that carries the mechanism next to a short one that lands it, contained conviction, nothing to cut. Name the passage it matches.
- Caps:
  - One absence signal from `voice.md`: at most 5. Two or more: at most 3. The signals: a rhetorical question answered in the next line more than once; three parallel phrases used for rhythm; "Here's the thing" or "Let's dive in"; a generic positive ending; an emoji used as decoration; a hashtag inside a sentence; a number without a source (a figure in digits with no source in its sentence, the first comment or `sources`; an approximate figure in words is scored under `ready`).
  - A word from "I never say" in `voice.md` or from the banned lists in `ai-tells.md`, in any form: at most 4. Three or more: at most 2.
- Deductions:
  - A consultancy, corporate, selling, motivational or performatively enthusiastic register (`voice.md`, My tone, and We are / We are not): -2.
  - A rhythm unlike the swipe posts: sentences all of one mid length, with no short line landing the mechanism (`ai-tells.md`, Structure tells): -1.
  - One-line fragments stacked for effect (`voice.md`, My tone): -1.

#### value: would a reader save it?

- Starts at 10 when it teaches one mechanism with specifics and gives the reader a test, question or action to use this week, as series-5 does (25 fixed prompts, counted, every release) or series-1 (the last ten components AI touched, checked against the system). Series-2 teaches a mechanism but leaves the reader no test or action, so it is not the value anchor.
- Caps:
  - Nothing specific: every sentence would fit any post on the topic: at most 2.
  - No action, test or question the reader can use this week: at most 5.
- Deductions:
  - The closing action or question is vague, or the reader has to invent the thing it asks for because the piece never shows one: -1.
  - The mechanism is asserted, not shown: no example, figure or case: -2.
  - The bridge from an analogy to the reader's case says more than the analogy supports: it presents the study as a measure of the reader's case, or states as fact, unhedged, something its source did not show (a quality, a cause, a share) on either side: -1, quoting the line. Framing the analogy in one line, as series-2 does ("The same machinery that invents a package invents a token"), is the limit, not a fault (`write-social-post`, step 2).
  - Two points compete, or it restates a swipe post's thesis without adding a case, a step or a test: -1.
  - The fix is deferred ("more on that next week"), so the reader leaves with the problem only: -1.

#### fit: is it made for this network?

The surface file's sections are the rules. What `check.py` enforces is scored under `ready`, not here.

- Starts at 10 when one swipe post, named, matches it on all four: a body within 150 characters of that post's; a longest paragraph no longer than that post's longest; a closing line of the same kind as that post's, which the closing-line rule allows; and a first comment that does what that post's does, or none when the draft has neither a link nor a named source. Only series-1 (a question from the reader's own work) and ds-15 (thanks by name) close in a way the rule allows; the other swipe posts end on a statement or "Link in the comments.", so they never anchor fit. The swipe files are all LinkedIn posts, so on Instagram, X and Viva Engage fit starts at 8.
- Caps:
  - The closing line breaks the rule: not a concrete question from the reader's own work, one action for this week, thanks by name on an event post, or on Viva Engage an ask for colleagues' examples (`voice.md`, Closing lines; the surface's Closing line): at most 5.
- Deductions:
  - Length outside the surface's aim: LinkedIn `text` under 900 or over 1,500 characters; an Instagram caption as long as the LinkedIn draft of the same idea; a Viva Engage post under 900 or over 1,500 characters (`viva-engage.md`, Limits): -1.
  - Structure (the surface's Structure): a LinkedIn paragraph over about 420 characters (the longest in the swipe posts), a block of text on Instagram, a dash bullet, a numbered list that is not a sequence, a thread post with two ideas: -1 each.
  - Register on LinkedIn: not a point of view or field note with one mechanism explained with specifics (`linkedin.md`, What works for the author): -2.
  - Register on Instagram and X: an Instagram caption that is not warmer and shorter, or an X post or thread that is the LinkedIn post trimmed rather than rewritten (`instagram.md`, What works; `x.md`, What works: "rewritten for X, not trimmed"), shown by sentences shared word for word with the LinkedIn draft apart from quoted facts, or by its beats run in the LinkedIn order: -2.
  - Hashtags on LinkedIn: a broad tag where a niche one would do (`linkedin.md`, Hashtags: "pick niche ones over broad ones"): -1 for the set.
  - Register on Viva Engage, colleague-first (`viva-engage.md`, Structure and What works for the author): written to the market or to prospects rather than to people who share the company, or the LinkedIn source trimmed, shown by sentences shared word for word with it apart from quoted facts, or by its beats run in its order: -2.
  - A pitch on Viva Engage: an offering sold to colleagues, "Nagarro offers", a call to book or buy, a teaser that holds the tool back (`viva-engage.md`, Structure: "No pitch"): -2.
  - No usable tool on Viva Engage: nothing a colleague can use or answer this week, neither a tool or checklist given whole, nor the story behind a decision, nor a question for the design community (`viva-engage.md`, What works for the author): -1.
  - First comment: on LinkedIn or X, a link not inside a sentence that says what it is; on Instagram and Viva Engage, anything in it: -1.
  - Instagram: each item `instagram.md` lists for `visual_brief` or `image_prompt` that is missing, and each `kit.md` rule the card breaks (one lime accent, the key phrase, the chip text, the forbidden colours): -1 each. The kit rules judge cards this system briefs or makes; an imported campaign asset listed in `assets` (the Design Systems series cards, the FLO visuals) is a fixed deliverable the author already has, so it takes no kit deduction and fit judges the caption against the card as it is.

#### ready: could it go out as it stands?

- Starts at 10 when the draft's `check.py` prints `ok` and every fact in it carries its source in the sentence that states it, the way series-2 states its study ("A 2025 USENIX Security study tested 16 code-generating models across 19,000 prompts"). The anchor is that one feature: series-2's own first comment still holds a "[handbook link]" placeholder.
- Caps:
  - Any `check.py` problem: at most 4, and -1 for each line.
  - A fact that is not on the fact list (step 2), or is said more strongly than its line says it: a share rounded up, an analogy stated as a finding, a swipe line's verb changed, a hedge dropped: at most 4.
  - A figure in digits without its source in the same sentence, the first comment or `sources`: at most 4.
  - The draft relies on a Gaps line of the context block ("needs a fact from the author"): at most 4.
- Deductions:
  - A swipe fact whose own post is not out by the draft's `scheduled_date` (step 2): it is not yet "already published" (`marketeer-context`, Facts available): -1.
  - An illustrative or approximate figure, in digits or words, that is not labelled as one ("the few hundred decisions an agent makes in a quarter") (`content-rules.md`, Numbers and sources): -1.
  - An "I" sentence about something the author did not say, write or do in a source on the fact list: -2.
  - A dash, an American spelling or a banned word in `visual_brief` or `image_prompt`: -1 each.
  - An AI tell from `ai-tells.md` that `check.py` cannot see and that voice has not already scored: a phrase from the Replacements table, a "not X, but Y" contrast the checker misses, a banned word in a form it does not match ("unlocks"), "In conclusion" or a last paragraph that restates the first: -1 each.

## Outputs

- `score` on each scored post, `{total, hook, voice, value, fit, ready}`, with `updated` set to the time of the run, both written by `score.py`.
- `status`: `in-review` when the score passes (a total of 35 or more and no dimension under 5) and the piece was a `draft`; `draft` when it fails and the piece was `in-review`; otherwise unchanged. Never `approved`.
- One scorecard per id with its deduction lines, and the closing lines of step 7.
- Nothing else changes: the body, every other frontmatter field, the parent idea and every other file stay as they were.

## Rules

- A generous scorer is useless: The author needs to know what stops a piece, not to be reassured. Torn between two figures, take the lower and cite why.
- Cite the line for every deduction: the draft's words, quoted, and the rule with its file. No citation, no deduction; no deduction, no point lost.
- Never above 8 unless the draft matches the swipe pieces on that dimension, and the swipe line is named.
- Score what is on disk. If anything but this run's `score.py` changes the file during the run, score it again from step 2.
- `score.py` is the only way a file changes. Never edit a score, a status or any other field by hand.
- Never move a piece to `approved`, and never call one approved: passing means ready for the author's review.
- British English in every word the skill writes, and no em or en dashes anywhere. The "·" in the scorecard is not a dash.

## Boundaries

- No rewriting: the fixes say what to change, and `write-social-post` changes it.
- No compliance review: legal risk, claims and High flags belong to `brand-review`. A claim flag from `check.py` is scored under `ready` like any other problem.
- No sync: it never calls the TryPost API or `scripts/trypost_sync.py`.
- No approving, scheduling or date changes: a timing problem becomes a fix for the author.
- Writes only through `scripts/score.py`, and only to the ids it scored.

## Related

- `write-social-post`: saves the drafts this skill scores, and rewrites the weakest with `--force`.
- `marketeer-context`: step 1; its block names the swipe files and the facts available.
- `scripts/score.py` writes the score and applies the gate in `scripts/lib/content.py` (`SCORE_PASS_TOTAL`, `SCORE_PASS_MIN`). `scripts/check.py` is the deterministic half of `ready`.
- `marketeer/references/hooks.md`, `ai-tells.md` and `surfaces/`: the rules behind the deductions. `brands/me/voice.md` and `brands/me/swipe/`: the voice and the bar.
- `evals/fixtures/drafts/good-linkedin.md` and `bad-slop.md`: the calibration pair. By this rubric the first totals 35 or more and the second under 25 with `ready` at 4 or lower (44 and 12 when the skill was written); a rubric change that breaks either is wrong.
