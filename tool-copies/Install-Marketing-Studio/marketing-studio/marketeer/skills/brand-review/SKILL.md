---
name: brand-review
description: Reviews one or more of the author's pieces (brands/me/content/<id>.md) before she posts them, the way a careful editor would, against content-rules.md, voice.md, the Nagarro overlay in nagarro mode and the campaign's neutral rule. Every number, name, award and quote is read against its source, every flag cites its line, and the flags are written to the piece as High, Medium or Low with scripts/review.py. A High flag blocks approval, so scripts/mark.py refuses approved until a later review has none. The review is advisory, for the author's own check, and never legal sign-off. Use when the author asks to "review this", "is this safe to post", "check the claims", for a "brand check" or "any flags". Not for scoring a draft (use score), not for rewriting it or fixing the flags (use edit), and never for approving, which is the author's call alone (this skill never sets approved).
---

# brand-review

Reads a piece the way a careful editor would before the author posts it: every claim against its source, every name against the confidentiality rules, every line against the mode and the campaign. Each problem becomes a flag with a severity, written to the piece with `scripts/review.py`, and each piece gets one table and one gate line in the conversation. The gate lives in `scripts/lib/content.py` (`approval_blockers`): while the latest review holds a High flag, `python3 scripts/mark.py <id> approved` refuses, and the next sync shows the `blocked` label in TryPost. The skill never edits the text and never sets `approved`. Paths are relative to the repository root.

## Inputs

In any order and wording (`agents-fill-gaps-with-the-same-guess-li` is enough):

- One or more post ids: the file name of `brands/me/content/<id>.md` without `.md`, a `type: post` object of any surface and format (post, article, essay, note, reel). Several ids are reviewed one after the other, each with its own table and gate line.
- An idea id (`type: idea`) is not reviewed. When the author names one, review the posts whose `parent` is that idea, found with `grep -l "^parent: <idea-id>$" brands/me/content/*.md`, and say so in one line.
- Any status. A review changes the status only through `review.py`'s long-form gate, its one exception to the rules below: an article, essay or note has no score, so a review with no High flag on a `draft` that `check.py` passes moves it to `in-review` and a High flag moves an `in-review` one back to `draft` (it prints `status <id> <new>`); a post, and a piece already `approved` or `scheduled`, never moves, and the closing lines say so (step 7).
- A question in place of an instruction ("is this safe to post", "any flags"): review every id it names and answer it in step 7.

## Steps

1. Run `marketeer-context` (`/marketeer:marketeer-context`) with the piece's `pillar` (no pillar when it has none), `mode` and `campaign` from its frontmatter, its surface and format, and the id as the task sentence. When several ids share pillar, mode and campaign, run it once, naming the surface only when they share that too. Work from its block: the Hard rules, the Mode rules (with the neutral line when the campaign sets `neutral: true`), the Campaign's required hashtags, tags and sources, Facts available and Gaps.
2. Read `marketeer/references/compliance.md` in full. Its severities, its High, Medium and Low lists, its table from `check.py` messages to severities and its output shape are this skill's rulebook. Nothing below loosens them except three routes, all in step 4 and the only ones: an estimate inside the piece's own scenario, a quote from someone the piece must disguise, and the claim test, which tells a claim from an opinion for the absolute and comparative words `check.py` does not list ("the only", "better than", "instantly", and the superlatives it cannot list). Then read, in full, and note each piece's `updated` value:
   - the piece: the title and the body, and every field a reader or a designer sees: `first_comment`, `subtitle`, `seo_title`, `seo_description`, `document_title`, `visual_brief`, `image_prompt`, `script`, whichever it has; and `mode`, `campaign`, `surface`, `format`, `status`, `parent`, `sources`, `tags_people`, and `review_flags` from an earlier review, which are context only: this run judges the piece as it stands, raises again every earlier flag that still holds, and drops the ones that no longer do;
   - the parent when `parent` is set: an idea's `## Facts and sources` is the list of facts the piece may state, at the strength each line states them; a parent post's body and `sources` carry the facts of a repurposed child. Without a parent, the block's Facts available is the list;
   - `brands/me/content-rules.md` (Numbers and sources, Confidentiality, Hashtags, Links) and `brands/me/voice.md` ("I never say", the absence signals, Closing lines);
   - `brands/me/nagarro-overlay.md` in `nagarro` mode: Approved claims, Tagging and Never;
   - `brands/me/campaigns/<slug>.md` when the piece has a campaign: `neutral`, `required_hashtags_linkedin`, `tags_people`, `sources` and the brief;
   - `marketeer/references/ai-tells.md`, `hooks.md`, `seven-sweeps.md` (The quick pass) and `surfaces/<surface>.md` (`surfaces/viva-engage.md` for `viva`); `longform.md` for an article, essay or note; `reels.md` for a reel; `brands/me/kit.md` for a piece with a `visual_brief`.

   Number the body's lines, so every flag can name its line:
   ```bash
   python3 -c "import sys; from scripts.lib import content; [print(n, line) for n, line in enumerate(content.load(sys.argv[1])[1].split('\n'), 1)]" brands/me/content/<id>.md
   ```
   `body line N` in a flag is the number this prints, blank lines included. Footnote definitions and the Sources section are body lines too.
3. Run `python3 scripts/check.py <id>`. It prints `ok <id>`, or one `<id>: <problem>` line per problem. Each line becomes one flag at the severity `compliance.md` gives it ("From check.py to a severity"), never downgraded, even when the hit reads harmlessly ("guaranteed" inside "nothing is guaranteed"): its fix is a rewording, because `check.py` keeps failing until the words go. `check.py` does not flag "the only", "better than" or "instantly", and passes "guarantee" in "guarantee nothing" and "no guarantee": step 4, item 4 finds those words by reading. Give each the location it concerns:
   - `em dash on line N` and `en dash on line N` count the title, then the body, then the first comment, as one text: line 1 is the title, line N is `body line N-1` while N-1 is within the body, and the lines after the body are the first comment.
   - The other messages name a word or a figure, not a line: find it in the piece and cite each line it is on.
   - `<id>: no such object` means the id has no file: check the spelling against `brands/me/content/` and ask the author. Never create the file.

   `check.py` cannot see everything. It reads the title for dashes, Nagarro and promotion only, and the body and first comment for the rest. It never reads `subtitle`, `seo_title`, `seo_description`, `document_title`, `visual_brief`, `image_prompt` or `script`. A non-empty `sources`, or a `## Sources` heading in the body, silences every number line for the whole piece. Step 4 covers what it misses.
4. Read the piece by hand, field by field and line by line, from the title to the last field, against the three lists in `compliance.md`. Look in particular at what the checker cannot see:
   1. Every number, client name, award and quote, in digits or in words. Its source must be in its sentence, a footnote, the Sources section, `sources` or the first comment, and it must say what the piece says, at the same strength: the fact list from step 2 is the test. A figure its source does not carry, a share rounded up or a hedge dropped has no source as written: High. Exception one, the estimate: an approximate figure in words that sits inside the piece's own scenario, never a claim about the world, a market, a client or a result ("the few hundred decisions an agent makes in a quarter"), is Medium when it is not labelled as an estimate: label it or cut it (`content-rules.md`, Numbers and sources). "Nine in ten teams" and "half of all design systems" are claims about the world, so they are High without a source. In `nagarro` mode an approved claim from the overlay counts as sourced only as the overlay words it, with its attribution.
   2. Anything that identifies a client, a colleague or a project, directly or indirectly: a name, an incident date, a product name, a city plus an industry, exact numbers tied to their project ("six weeks to three hours" on one project, where "from weeks to hours" is disguised). Thanks by name to hosts and speakers on an event post, and the tags the overlay or the campaign sets, are not stories. Nor is a proof point from `brand-profile.md` stated as written with its source: one that names no client, such as the RMS Design System with its date and figures, is no flag; only one that names a client, such as the BMW Group project, waits for the author, and named without her word it is High (`content-rules.md`, Confidentiality; `marketeer-context`, Facts available).
   3. Every quote: who said it, and where. Exception two, the disguised quote: when the author heard the words herself from a client or a colleague whom Confidentiality makes the piece disguise, the sentence that says so ("a client asked me", "a developer on my team said") is the attribution, the disguise standing for who and the author's own conversation for where. Any other quote (a public figure, a book, an article, a study, a post) needs the name and the source: High without them. Every passage drawn from a source text you can read in the repository (a swipe file, the parent, a file in `brands/me/research/`): set the two side by side for close paraphrase.
   4. Claims: absolute, superlative and comparative words ("the best", "the fastest", "nobody else", "the most", "the only", "better than", "instantly"); a competitor comparison, in any mode; a guarantee ("you will cut your review time"); one project's result offered as what anyone will get. A word `check.py` lists is already a High flag from step 3. For the others, the claim test (`compliance.md`, The claim test): High when the words are about an offering, a product, a result or a competitor, or state something a reader could check and the piece gives no source. When they frame the author's opinion and leave nothing to check ("The most expensive AI mistake in product work is the one that passes review", "where AI creates the most value"), they are Medium when the body does not back the opinion (`hooks.md`, Bold claim, Fails when) and no flag when it does. Words that make no claim at all ("not the only reason", "the agent answered instantly" in a story) are no flag.
   5. The mode and the campaign: in a `personal` piece, a Nagarro offering, its page or its campaign hashtag promoted, in any wording (naming Nagarro as a fact is fine); in a neutral piece, Nagarro, FLO, a talk, slides, a keynote, the room, and anything else that assumes a stage. On Viva Engage (`surface: viva`), the internal rule in `compliance.md` (Internal pieces) instead: the overlay's promotion rules do not apply inside the company, so a missing campaign hashtag, tag or offering pointer is no flag; confidentiality and every other list apply in full; any hashtag, a pitch to colleagues, a `@Name` tag or a name in `tags_people` is Medium; a neutral campaign still on the piece is Medium on its `campaign` field.
   6. Placeholders in the fields `check.py` does not read: one in the title, `subtitle`, `seo_title`, `seo_description`, `document_title` or `script` is High, as in the body. In `visual_brief` and `image_prompt`, one inside the on-image copy (the words the card will show) is High; a bracketed note to the designer or to the author outside that copy ("[photo from the author]") is Medium, because it must be settled before the card is made.
   7. The Medium list: banned words and patterns in any form, dashes in the fields `check.py` does not read, hashtags and links against the surface file, a missed required hashtag, "screens", off-voice sentences, the overlay's tagging conventions against `tags_people`, the closing line.
   8. The Low list: the hook against `hooks.md`, rhythm, the quick pass in `seven-sweeps.md`, a word repeated close to itself, a visual brief against `kit.md`.

   Write each flag down as `<location>: <issue>`, with the location as `compliance.md` names it (`title`, `body line 12`, `first comment`, `subtitle`, `seo_description`, `visual brief`, `script`, `footnote [^2]`). The issue quotes the words and names the rule with its file, and the Fix says what to change. One flag per problem and location: a `check.py` line and your own reading of the same words make one flag, not two, quoting the longer of the two passages. Two problems on one line (a figure with no source that also points to a project) make two flags. When a problem fits two severities, take the higher.
5. Write the flags. First check that `updated` in the file still reads as in step 2; if the file has changed, start that id again from step 2. Then pass every flag of this review in one run, repeating each option once per flag:
   ```bash
   python3 scripts/review.py <id> --high "<location>: <issue>" --medium "<location>: <issue>" --low "<location>: <issue>"
   ```
   - The id is the first argument, not a flag. Each run replaces the whole set, so a flag left out of this run is gone. Inside a flag, quote words with single quotes and never type a double quote, `$` or a backtick. A quoted line that holds a dash is quoted with the words "em dash" or "en dash" in place of the character.
   - With nothing to flag, run `python3 scripts/review.py <id>` with no options: that records a clean review. Never `--clear` in a review: it forgets the review altogether, so the piece reads as never reviewed. Run it only when the author asks to forget one; it prints `review <id> cleared`.
   - It prints `review <id> high=N medium=N low=N blocked|clear`. Read it back: the three counts must match the flags you passed, and `blocked` means at least one High flag stands. When the counts differ, run it again with the full set before printing anything.
   - `<id>: <problem>` (exit code 2) means nothing was written: the piece is missing or its frontmatter is broken. Fix nothing yourself: the gate line reads `NOT WRITTEN: <problem>`.
6. Print the review for each id: one line naming the piece, the table, the gate line. After the last id, the advisory sentence, once.
7. Close in a few lines. Answer the author's question if she asked one: a `BLOCKED` piece is not ready until its High flags are fixed and the piece is reviewed again; a `CLEAR` piece with Medium flags is ready once they are fixed; `CLEAR` never means safe, legal or approved. When `review.py` also printed `status <id> <new>` (the long-form gate, on an article, essay or note), relay that line: `in-review` means the piece is ready for the author to read, and `draft` means a High flag took it out of review. When a reviewed piece is already `approved` or `scheduled` and now holds a High flag, say that its status has not changed, that the next push shows `blocked` beside it in TryPost, and that what to do is the author's call. Then, when any flag stands, offer one next step, naming every id with flags: "Fix these with `/marketeer:edit <id>`, which takes the flags as its first changes, then run `/marketeer:brand-review <id>` again to lift them?"

### The review

Fixed: these lines, in this order, for each id.

```text
REVIEW <id> (<surface> <format>, <mode>[, neutral], campaign <slug | none>)
```

| Severity | Location | Issue | Fix |
|---|---|---|---|
| High | body line 4 | '30%' has no source in its sentence, a footnote, the first comment or `sources` (`content-rules.md`, Numbers and sources) | remove the figure, or ask the author for the source and cite it in the sentence |
| Medium | body line 9 | 'leverage' is a banned word (`ai-tells.md`) | 'use' |
| Low | body line 2 | one sentence runs to 31 words (`seven-sweeps.md`, The quick pass) | split it after the first clause |

```text
BLOCKED: <n> High flag | BLOCKED: <n> High flags | CLEAR: approval is the author's
```

- The rows: High first, then Medium, then Low. Within a severity, in the order the locations appear: title, subtitle, the body by line (footnotes and the Sources section included), first comment, `seo_title`, `seo_description`, `document_title`, visual brief, image prompt, script.
- Issue: the words quoted and the rule with its file. Fix: what to change, in a few words. A Fix never supplies a missing fact, source, figure or attribution: it asks the author for it, or removes the claim.
- A piece with no flags prints `No flags.` in place of the table.
- The gate line reads `review.py`'s line: `BLOCKED` when it says `blocked`, with N from `high=N` ("flag" for one, "flags" for more, as `mark.py` words it); `CLEAR: approval is the author's` when it says `clear`.
- After the last gate line of the run, this sentence, verbatim and once:

This review is advisory, for the author's own check; it is not legal sign-off.

## Outputs

- On each reviewed piece, written by `review.py`: `review: { high, medium, low, reviewed_at }`, a top-level `review_flags` list (`"High: body line 4: ..."`, one entry per flag), and `updated` set to the time of the run.
- While `review.high` is above 0, `python3 scripts/mark.py <id> approved` exits 2 with `blocked <id>: <n> High flag(s) from brand-review` on stderr, and the next `trypost_sync.py push` adds the `blocked` label. A later review with no High flag lifts both.
- In the conversation: per id, the piece line, the table and the gate line; the advisory sentence once; the closing lines of step 7.
- On an article, essay or note, `status` too, through `review.py`'s long-form gate: a review with no High flag on a `draft` that `check.py` passes moves it to `in-review`, and a High flag moves an `in-review` one back to `draft`. A post's status never moves here; its score gates it.
- Nothing else changes: the title, the body and every other field stay as they were, and so does every other file.

## Rules

- Never edit the text. `review.py` is the only way a file changes, and it writes only the review and, on an article, essay or note, the status its long-form gate sets. Fixing is `edit`'s job.
- Cite the line for every flag: the location, the words quoted, and the rule with its file. No citation, no flag.
- Never downgrade or drop a `check.py` line, however harmless it reads. The words it does not list are the claim test's, in step 4.
- A careful reviewer is the only useful one: torn between two severities after the tests in step 4, take the higher and say why in the Issue.
- Never supply a fact, a source or an attribution, and never guess one. A missing source is a question for the author in the Fix column.
- Review what is on disk. If anything but this run's `review.py` changes the file during the run, start that id again from step 2.
- Never set `approved`, and never call a piece approved, safe or cleared for posting: `CLEAR` means no High flag stands, and approval is the author's.
- Every review ends with the advisory sentence from `compliance.md`, verbatim, once per run.
- British English in every word the skill writes, the flags included, and no em or en dashes anywhere.

## Boundaries

- No scoring: `score` rates the piece. A claim line from `check.py` costs points under `ready` there and becomes a High flag here.
- No rewriting: the Fix column says what to change, and `edit` changes it.
- No legal sign-off: the review is advisory, for the author's own check.
- No approving, scheduling or date changes, and no status change beyond the one `review.py`'s long-form gate makes on an article, essay or note. No edits to the workspace files: a rule that looks wrong is a note for the author, who edits them by hand.
- No sync: it never calls the TryPost API or `scripts/trypost_sync.py`; the next push carries the `blocked` label.
- Writes only through `scripts/review.py`, and only to the ids it reviewed.

## Related

- `edit`: fixes the flags, taking `review_flags` as its first changes. A body change keeps the flags until this skill runs again, so review after every edit.
- `score`: rates the same pieces; run it before or after, in either order.
- `marketeer-context`: step 1; its block gives the mode rules, the neutral line and the facts available.
- `marketeer/references/compliance.md`: the severities, the lists, the mapping from `check.py` and the output. `brands/me/content-rules.md`, `voice.md`, `nagarro-overlay.md` and `campaigns/`: the rules behind the flags.
- `scripts/review.py` writes the flags; `scripts/check.py` is the deterministic half; `content.approval_blockers` in `scripts/lib/content.py` is the gate, which `scripts/mark.py` and the sync's pull enforce.
- `evals/judges/compliance.md` with `evals/fixtures/drafts/bad-compliance.md` and `good-linkedin.md`: the calibration pair. The first must raise a High flag for every risk the judge lists for it, each of them High under `compliance.md` and the claim test in step 4; the second must raise none.
