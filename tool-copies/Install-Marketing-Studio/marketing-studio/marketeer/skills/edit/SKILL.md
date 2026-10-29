---
name: edit
description: Improves one of your saved pieces (brands/me/content/<id>.md) with the seven sweeps (Clarity, Voice, So what, Prove it, Specificity, Care, Closing, then the quick pass), taking brand-review's review_flags and any check.py problem as the first fixes. It writes the body back with scripts/set_body.py, which keeps every other field; an in-review piece loses its score and goes back to draft, an approved one keeps both and you re-read it. It prints a change summary with the line before, the line after and the reason for every change, sweep by sweep; changes to other fields are suggestions for you. It never changes the message and never adds a fact, a number or a claim the piece's sources do not carry. Use when you ask to "edit this", "tighten" a draft, "improve the draft", "run the sweeps" or "fix the flags". Not for scoring (use score), not for reviewing claims or raising flags (use brand-review), and not for writing from scratch or adding a fact (use write-social-post or write-longform).
---

# edit

Runs the editing pass on a saved piece: the seven sweeps in `marketeer/references/seven-sweeps.md`, in order, one concern at a time, then the quick pass. The flags `brand-review` left on the piece and the problems `scripts/check.py` names are the first fixes. The new body goes back to the same file through `scripts/set_body.py`, which changes the body and `updated` and keeps the TryPost link, the first comment, the review flags and every other field. The one exception is the gate: a piece that carried a score loses it, because the score was given to the old body, and an `in-review` piece, scored or not, goes back to `draft` until `score` runs again on a post, or `brand-review` on an article, essay or note (`review.py`'s long-form gate: a clean review on a draft that passes `check.py` moves it to `in-review`). An `approved` or `scheduled` piece keeps its status and its score, because TryPost holds its label: the summary tells the author that her approval was given to the old text, and she re-reads it on the board. A change to any other field has its own path (step 5). The skill improves how the piece says what it already says: the message and the facts stay. Paths are relative to the repository root.

## Inputs

In any order and wording (`agents-fill-gaps-with-the-same-guess-li` is enough):

- One or more post ids: the file name of `brands/me/content/<id>.md` without `.md`, a `type: post` object on any surface (a LinkedIn post or article, an Instagram caption, an X post or thread, a Substack essay or note, a Reel). Several ids are edited one after the other, each with its own change summary.
- An idea id (`type: idea`) is not edited. When the author names one, edit the posts whose `parent` is that idea, one after the other, and say so in one line.
- The status decides whether a piece is edited:
  - `draft` and `in-review`: edited.
  - `approved` and `scheduled`: edited only when the author names that piece by id. The save keeps its status and its score, and the summary says that her approval was given to the old text, so she re-reads it on the board before it goes out.
  - `published` and `archived`: never edited, because the post is out as it stands. Say so in one line.
- The author's notes in the session ("the hook is too long", "less formal"): first fixes like a flag, made in the sweep they belong to and under the same limits. A note that needs a fact the sources do not carry is not made; it goes under `Needs a fact from the author` in the summary. Once the author adds the fact to the idea's `## Facts and sources`, a later run may use it.

## Steps

1. Run `marketeer-context` (`/marketeer:marketeer-context`) with the piece's `pillar` (`theme` when it has none), `mode` and `campaign` from its frontmatter, its surface and format, and the id as the task sentence. When several ids share pillar, mode and campaign, run it once and name no surface. Work from its block: the four Voice rows and the two swipe files on the `Swipe:` line, the Hard rules, the Mode rules (the neutral rule included), the Campaign, Facts available and Gaps.
2. Read, in full, and note the piece's `updated` value:
   - `marketeer/references/seven-sweeps.md`: what each sweep looks for, the order, the loop-back rule and the quick pass. `marketeer/references/ai-tells.md`: the banned words, patterns, structure tells and replacements.
   - The piece: the body, and the frontmatter fields `title`, `surface`, `format`, `status`, `mode`, `campaign`, `parent`, `first_comment`, `sources`, `review_flags`, `score` and `trypost`; on long form also `subtitle`, `seo_title` and `seo_description`; on a piece with a card, `visual_brief` and `image_prompt`; on a Reel, `script` and `visual_brief`; and `labels_extra`, `assets` and `scheduled_date`, which step 5 needs when a field other than the body changes.
   - The fact list: the parent idea's `## Facts and sources`, each line at the strength it states its fact. Without a parent, the block's Facts available. The piece's `sources`, its first comment and, on long form, its footnotes and Sources section name where the facts already in the piece come from. These are the only facts a change may rest on.
   - The core message. With a parent, the idea's `Chosen:` angle; without one, the claim the hook makes and the closing line answers. Write it in one sentence: it heads the summary, and every change is read against it.
   - `brands/me/voice.md` (the voice card, "I never say", the absence signals, the closing lines) and `brands/me/content-rules.md`. The voice card wins over any sweep.
   - `marketeer/references/surfaces/<surface>.md` (`surfaces/viva-engage.md` for `viva`): the limits, the structure, the links, the closing line. `marketeer/references/longform.md` for an article, an essay or a note; `marketeer/references/reels.md` for a Reel.
   - The two swipe files on the `Swipe:` line: the bar for rhythm and length.
   - `review_flags`, when the piece has them. Each flag reads `<Severity>: <location>: <issue>`, where the location names the field and the line (`body line 12`, `title`, `first comment`). List them: they are the first fixes.
3. Run `python3 scripts/check.py <id>`. It prints `ok <id>`, or one `<id>: <problem>` line per problem. Each problem is a first fix, like a flag, in the sweep the table below names. A schema problem or an unknown campaign is not a text fix: `set_body.py` refuses to save a piece whose frontmatter is invalid, so stop and name the problem to the author.
4. Run the sweeps.
   1. First fixes. Make the flags (High, then Medium, then Low), the `check.py` problems and the author's notes before anything else, each in the sweep the table names, at the start of that sweep. Find a flagged line by the words its issue quotes or describes; when the line number and the words disagree, the words win. A High or Medium flag is always fixed. A Low flag is the author's call: fix it when its sweep agrees, otherwise the summary says why it stays. A fix that needs a fact the sources do not carry removes the figure or the claim (never softens it into "about" or "some") and adds a `Needs a fact from the author` line.
   2. The seven sweeps, in order: Clarity, Voice, So what, Prove it, Specificity, Care, Closing. For each one, read the whole piece for what `seven-sweeps.md` says that sweep looks for, over every field the reader sees: the title, the body, the first comment, on long form the subtitle and the SEO fields, the on-image copy in a visual brief or an image prompt, and on a Reel the script. Change only a line that fails the sweep. Every other line stays word for word, so a line the author or the writer got right keeps its wording.
   3. For every line a sweep changes, write down the line before, the line after and the reason: what the sweep caught and the rule behind it, with its file. Quote whole sentences. A cut line has `(cut)` as its after. When a later sweep changes the same line again, it is a second change under that sweep, with the earlier after as its before.
   4. The loop-back rule, after each sweep: re-read the piece against the sweeps already done. A cut in Prove it can leave a So what with nothing to stand on; a sharper verb in Specificity can break Voice. Fix that before the next sweep, and record it under the sweep that makes the fix, with `loop-back` in its reason.
   5. The quick pass, after the seventh sweep: weak intensifiers, passive voice that hides who acted, nominalisations, sentences over 25 words (`seven-sweeps.md`, The quick pass). Count the words of every sentence that looks long. Then read `ai-tells.md` once more, top to bottom.
   6. Every change obeys these limits. A change that cannot is not made, and the summary says why:
      - No new fact, number, name, quote, client, colleague, result or claim. A consequence is a claim too: So what uses only a consequence the piece or its fact list already states, moved next to its fact or put in the reader's terms. Specificity makes a line more exact with words the piece or its fact lines already hold, never more detailed than its facts.
      - A fact keeps its figures, its subject, its scope, its hedges and its verbs as its fact line states them: "on average" stays, "nearly half" stays, "rarely" and "often" stay. A study offered as an analogy stays framed as one.
      - Prove it cuts a claim with no source; it never softens it and never supplies proof that was not there.
      - A figure (a percentage, an amount, a number with a thousands separator) keeps a source cue in its own sentence ("study", "found", "source", "according to", "report", "survey") unless the piece lists `sources` or has a Sources section, because `check.py` reads each figure's own sentence. When the quick pass splits a sentence that carries figures, every part that keeps a figure keeps a cue ("It found ...").
      - The voice card wins. When a sweep's change would break it (a row of short fragments, a consultancy register, a line the author would not say), the line stays as it is and the summary says so.
      - The surface's rules still hold after the change: the hook complete before the fold on LinkedIn (about 210 characters, 140 on mobile), the caption's first 125 characters on Instagram, at most 280 characters per post on X with the `---` lines kept, the length aim (900 to 1,500 characters for a LinkedIn `text` post), the long-form word counts, the hashtags last, links only where the surface allows them.
      - On long form, footnote definitions, the Sources section, links and the Substack markers (`[SUBSCRIBE BUTTON]`, `[SHARE BUTTON]`, `[PULL QUOTE]`) stay as they are.
      - When a fix would change the core message, because the line it cuts carries the claim the piece makes, stop before writing anything: tell the author the piece needs a fact or a rewrite, and offer `write-social-post` or `write-longform`.
5. Save the body.
   - Write the new body with the Write tool to a scratch file outside the repository: the session's scratchpad directory when it has one, otherwise a temporary directory. Never pass a body inline or through a heredoc, because quotes and apostrophes break the shell. Keep everything no sweep changed: the blank lines, the `---` lines of a thread, the hashtag line and the final line break.
   - Count the body: `python3 -c "import sys; print(len(open(sys.argv[1], encoding='utf-8').read().strip()))" <scratch file>`, before and after, and check the length aim from step 4. List the sentences over 25 words: `python3 -c "import re, sys; t = open(sys.argv[1], encoding='utf-8').read().replace('et al.', 'et al'); [print(len(s.split()), s[:60]) for s in re.split(r'(?<=[.!?])\s+|\n', t) if len(s.split()) > 25]" <scratch file>`. Each one it prints goes back to the quick pass. On LinkedIn, count the first line too: the hook must still end within the fold.
   - Check that `updated` in the file still reads as in step 2. If it has changed (a pull from TryPost, the author's own edit), start that id again from step 2.
   - Run `python3 scripts/set_body.py <id> --body-file <scratch file>`. The id is the first argument, not a flag. It prints `updated <id>`. `<id>: no such object: <id>` (exit code 2) means the id has no file: check the spelling against `brands/me/content/` and ask the author; never create the file. Any other `<id>: <problem>` line means nothing was written: name it to the author.
   - A change to any field other than the body (the title, `first_comment`, `subtitle`, an SEO field, `visual_brief`, `image_prompt`, a Reel `script`), whether it comes from a flag, a `check.py` line or a sweep, is never written by `set_body.py`, which writes the body only. It goes under `Suggested for the author` in the summary, with its before, after and reason (`seven-sweeps.md`, How to run them). It is written only when the author asks, in the session, for that change on that piece, and then through the rebuild below; otherwise it stays a note for the author to apply.
   - The rebuild, `new_post.py <id> --force`, writes the whole frontmatter again from the flags it is given. It keeps `trypost`, `status`, `posted_at`, `created`, `review` and `review_flags`, and the gate (`leave_gate` in `scripts/lib/objects.py`) runs on every rebuild, even when the body is unchanged: a `draft` or `in-review` piece that carried a score loses it, and an `in-review` one goes back to `draft`; an `approved` or `scheduled` piece keeps its status and its score. Everything else is lost unless passed again, so pass every field the piece has, from the file as it stands, with only the changed field new: `--title`, `--surface`, `--format`, `--mode`, `--pillar`, `--campaign`, `--parent`, `--date` (the first ten characters of `scheduled_date`), `--first-comment`, `--source` once per URL, `--tags-people` once per name, `--visual-brief`, `--image-prompt`, `--seo-title`, `--seo-description`, `--subtitle`, `--cover`, `--script`, `--document-title`, whichever it has, each long value from its own scratch file as `"$(cat <file>)"`, and the body as saved with `--body-file`. No flag carries `labels_extra`, `assets`, `performance` or a time of day: after the rebuild, add each extra label back with `python3 scripts/set_body.py <id> --body-file <the same body file> --add-label <name>` (the body is unchanged, so the gate does not move), and a `scheduled_date` whose time is not the surface's usual one with `python3 scripts/redate.py <id> --date <YYYY-MM-DDTHH:MM>`. A piece whose `assets` or `performance` is filled is never rebuilt: the change stays a note for the author.
   - After a rebuild, run `git diff brands/me/content/<id>.md`: it shows the changed field, `updated`, the `score` line cleared to `null` on a scored `draft` or `in-review` piece, and the `status` line on any `in-review` one. Those lines are the gate's, not a field you missed: they need no second rebuild. A field may move to another line; no other value may change. Any other value that changed is a field you did not pass: rebuild again with it.
6. Run `python3 scripts/check.py <id>` until it prints `ok <id>`, or until every line left is in a field this run does not write (a dash in the title, a problem in the first comment), each listed under `Suggested for the author`. For each `<id>: <problem>` line in the body, fix the scratch file under the limits of step 4, record the fix under its sweep, save again with `set_body.py` and run the check again. When a piece needs a third round, stop and read the rule that keeps tripping, in `ai-tells.md` and the surface's `## Checklist`, before the next fix.
7. Print the change summary for each id, in the format below. Then offer the next steps in one line: for a post, "Score it again with `/marketeer:score <id>`, and run `/marketeer:brand-review <id>` to re-evaluate the flags?"; for an article, essay or note, "Run `/marketeer:brand-review <id>` again: a clean review moves it back to `in-review`?" A piece that was `in-review`, or a scored `draft`, is an unscored `draft` until it is scored again (a post) or reviewed clean again (an article, essay or note, through the long-form gate), because `set_body.py` or the rebuild cleared the old body's score and took it out of review; an `approved` or `scheduled` piece kept its status and its score, both given to the old text, so the author re-reads it on the board before it goes out. The flags on the file were given to the old body too.

### The change summary

Fixed: these lines, in this order, in one fenced block per id. A sweep with no change says `no change` and, in a few words, what it checked.

```text
EDIT <id> (<surface>, <format>)
Message: <the core message, one sentence>
First fixes: none | <n> flags, <n> check.py problems, <n> notes from the author

1. Clarity: <n> change(s) | no change (<what it checked>)
   Before: "<the line as it was>"
   After:  "<the line as it is now>"
   Why:    <what the sweep caught, and the rule with its file>
2. Voice: ...
3. So what: ...
4. Prove it: ...
5. Specificity: ...
6. Care: ...
7. Closing: ...
Quick pass: ...

Suggested for the author: none | <field>: Before "<...>", After "<...>", Why <...>
Needs a fact from the author: none | <what is missing, and the line it would support>
Left as is: none | <a flag or a sweep's catch not changed, and why>
Length: <n> characters before, <n> after (aim <the surface's aim>)
check.py: ok <id>
Saved: updated <id> (status <status>, unchanged | status draft, was in-review; score cleared | score kept | no score)
```

- A first fix is listed under the sweep that made it, with its flag or `check.py` line in the reason ("High flag, body line 4").
- `Length` gives words instead of characters for an article or an essay, and per post for an X thread.
- For a piece that was `approved` or `scheduled`, the `Saved` line adds "her approval was given to the old text; re-read it on the board".
- The `Saved` line reads the status and the score from the file after the save: `set_body.py` clears the old body's score and sends an `in-review` piece back to `draft`, and keeps the status and the score of an `approved` or `scheduled` one.

### Where a problem goes

| The flag's issue or the `check.py` line | Sweep |
|---|---|
| An unclear "it", "this" or "they"; jargon the reader does not share | Clarity |
| A banned word or pattern, a hedge, "screens" for products, an off-voice sentence, promotion in a personal piece, a neutral campaign's banned mention, a missed tagging convention | Voice |
| A claim that leaves the reader without the reason to care | So what |
| A number, name, award or quote without its source; an absolute, comparative or guaranteed claim; a result presented as typical; an unattributed quote; a close paraphrase; a detail that identifies a client, a colleague or a project; a placeholder | Prove it |
| A vague claim ("a lot of", "many companies", "studies show", "experts agree"); a round figure that feels made up; an abstraction where the piece has a concrete noun | Specificity |
| Fear, urgency or guilt; a feeling announced instead of earned | Care |
| "Thoughts?" or "Agree?", a slogan, a generic positive ending, a gated giveaway, a link in the body, a hashtag inside the text or over the cap, a missing required hashtag | Closing |
| An em or en dash, an American spelling, a sentence over 25 words, a weak intensifier, a hidden actor, a nominalisation, a length or word count outside the surface's limits, uniform rhythm | Quick pass |

## Outputs

- The body of each edited piece, written by `set_body.py`, with `updated` set to the time of the run. Every other field stays as it was (`trypost`, `first_comment`, `sources`, `review`, `review_flags`, the labels and the dates), except the gate: a scored piece has `score: null`, and an `in-review` one is `draft` until it is scored again, while an `approved` or `scheduled` piece keeps its status and its score. A field other than the body changes only through the rebuild of step 5, when the author asked for it.
- One change summary per id, and the offer of step 7.
- `python3 scripts/check.py <id>` prints `ok <id>` after the run.
- A piece already in TryPost keeps its link; the next push carries the new body, the date and the labels to its draft there. It does not send the notes again: after a rebuild, a first comment, visual brief, image prompt or script that TryPost already shows as a note keeps its old text there, so the summary tells the author to update that note by hand.
- Nothing else in the repository changes: the parent idea, the other pieces and the workspace files stay as they were, and the scratch files live outside the repository. `git diff` on the piece shows the body and the `updated` line, plus the `score` line on a scored piece and the `status` line on an `in-review` one.

## Rules

- The core message and the facts are untouched: no new fact, number, name, quote or claim, and no fact said more strongly or more weakly than its fact line says it.
- The voice card in `voice.md` wins over any sweep, and the swipe files are the bar.
- Every change has a before, an after and a reason that names its rule and file. No reason, no change: a line that passes every sweep stays word for word. A handful of exact changes beats a rewrite.
- Flags first: `review_flags` and the `check.py` problems are fixed before the sweeps' own reading.
- Writes the body through `scripts/set_body.py`, and another field only through the rebuild of step 5 when the author asks for it. Never edit the frontmatter by hand.
- Never show a result that `check.py` rejects.
- British English in every word, and no em or en dashes anywhere, in the piece and in the summary.

## Boundaries

- No new facts. A point that needs one goes to the author under `Needs a fact from the author`.
- No scoring: `score` rates the edited piece, through `scripts/score.py`. This skill never runs `score.py`; `set_body.py` clears the old body's score, so the piece has none until `score` runs again.
- No review: `brand-review` raises and lifts the flags through `scripts/review.py`. This skill never runs `review.py` and never writes, clears or edits `review` or `review_flags`; a fixed flag stays on the file until `brand-review` runs again.
- No rewriting from scratch: when the message has to change, or most lines would, the piece goes back to `write-social-post` or `write-longform`.
- No sync: it never calls the TryPost API or `scripts/trypost_sync.py`.
- No status, date or approval changes of its own: the only status change is the gate's, when `set_body.py` or the rebuild sends an `in-review` piece back to `draft`.
- Writes only the ids it edits, and no other file in `brands/me/`, the parent idea included: The author edits the workspace by hand.

## Related

- `marketeer/references/seven-sweeps.md`: the seven sweeps, the loop-back rule and the quick pass. `marketeer/references/ai-tells.md`: what never goes in.
- `marketeer-context`: step 1; its block gives the voice rows, the swipe files, the mode rules and the facts available.
- `brand-review`: writes the `review_flags` this skill fixes first, and re-evaluates them after the edit.
- `score`: rates the edited piece with `scripts/score.py`.
- `write-social-post` and `write-longform`: write the drafts this skill edits, and rewrite one when the message has to change.
- `brands/me/voice.md`, `content-rules.md` and `swipe/`: the voice, the rules and the bar. `marketeer/references/surfaces/`, `longform.md` and `reels.md`: the rules per surface.
- `scripts/set_body.py` saves the body; `scripts/new_post.py --force` rebuilds a piece when the author asks for a change to another field; `scripts/check.py` checks it.
