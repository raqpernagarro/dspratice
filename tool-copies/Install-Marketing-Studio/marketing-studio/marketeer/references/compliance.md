# Compliance: what brand-review flags

`brand-review` reads a piece the way a careful editor would before the author posts it: every claim against its source, every name against the confidentiality rules, every line against the mode and the campaign. It writes each problem as a flag with a severity through `scripts/review.py`, and it never edits the text; fixing is `edit`'s job. The rules come from `content-rules.md`, `voice.md`, `nagarro-overlay.md` in `nagarro` mode, and the campaign file when it sets `neutral: true`; this file never loosens them.

## Severities

| Severity | What it means |
|---|---|
| High | Blocks `approved`. While the latest review holds a High flag, `python3 scripts/mark.py <id> approved` refuses with `blocked <id>: 1 High flag from brand-review` (or the count), and the sync shows the `blocked` label in TryPost. A later review with no High flag, or `review.py <id> --clear`, lifts it. |
| Medium | Must be fixed before the author posts. It does not block the gate. |
| Low | Style. The author's call: it never blocks and never needs a fix. |

The `blocked` label in TryPost follows High flags only: the push puts it on a post while the latest review holds a High flag and takes it off once none stands (`labels_for` in `scripts/lib/sync_plan.py`). A failing score blocks `approved` too, in `mark.py` and on pull, but never shows `blocked`. When the author adds the `approved` label in TryPost to a `draft` or `in-review` piece whose score fails the gate, the next pull leaves the file's status as it is, prints `blocked <id>: score <total>/50 fails the gate`, adds the note `Blocked: score <total>/50 fails the gate` to the post and takes the `approved` label off, with no `blocked` label in its place. When a High flag stands as well, the line and the note name both reasons and the `blocked` label goes on.

## High

- A number, client name, award or quote without a source: nothing in its sentence, a footnote, the article's Sources section or the piece's `sources`. In `nagarro` mode the overlay's approved claims count as sourced only as the overlay words them, with its attribution.
- An absolute or comparative claim. The words `check.py` lists, each matched as whole words, are High wherever they stand: "guaranteed", "guarantee" and "guarantees" (outside "guarantee nothing", "guarantees nothing" and "no guarantee"), "risk-free", "no risk", "100%", "#1", "best in the world", "always wins", "never fails", "proven to", "double your", "triple your", "unlike our competitors", "competitors can't" and "beats every". The words it leaves to this review ("the only", "better than", "instantly") and the ones it cannot list ("the best", "the fastest", "nobody else") are High when the claim test below says so.
- A guarantee, or a result presented as typical: an outcome the reader is promised ("you will cut your review time"), or one project's result offered as what anyone will get.
- A detail that identifies a client, a colleague or a project, directly or indirectly: a name, an incident date, a product name, a city plus an industry, exact numbers tied to their project (`content-rules.md`, Confidentiality). Thanks by name to hosts and speakers on an event post, and the tags the overlay or the campaign sets, are not stories. Nor is a proof point from `brand-profile.md` stated as written with its source: a Nagarro project there that names no client, such as the RMS Design System with its date and figures, is no flag; only one that names a client, such as the BMW Group project, waits for the author, and named without her word it is High.
- In a neutral piece: Nagarro, FLO, a talk, slides, a keynote or "the room", in the title, body or first comment. Anything else that assumes a stage is flagged the same way: the conference, a presentation, a session, a workshop the author gave, a deck, an audience, "raise your hand" (the FLO brief).
- In a personal piece: a Nagarro offering, its page or its campaign hashtag promoted: AI-Ready Design Systems, AI Readiness Diagnostic, a nagarro.com/en/services link, #FluidicIntelligence, "Nagarro offers", "our services". Naming Nagarro as a fact (The author's employer, an event she attended) is fine.
- A competitor comparison, in any mode: `nagarro-overlay.md` lists it under Never, and `check.py` flags its common phrasings in every piece.
- A quote without attribution: who said it, and where.
- Text closely paraphrased from a source: the source's sentences, in the source's order, with a few words swapped. Quote it with its attribution, or say it in the author's own words.
- A placeholder left in the copy, such as [article link], [Newsletter name] or [HUGO: ...]. On a Substack piece `[SUBSCRIBE BUTTON]`, `[SHARE BUTTON]` and `[PULL QUOTE]` are markers, not placeholders; footnote references, links and images never are.

## Medium

- Banned words and patterns (`ai-tells.md`), in any form, including the ones the checker misses: "unlocks", "journey" for a project, stacked one-line fragments, a group of three used for rhythm.
- An em or en dash anywhere, the visual brief, the image prompt and a Reel script included.
- Hashtag and link breaches: over the surface's cap, a hashtag inside a sentence, a link in a LinkedIn or X body, a link or "link in the comments" in an Instagram caption, a link or a hashtag on Substack where `surfaces/substack.md` allows none, any hashtag on Viva Engage.
- A missed required campaign tag (`required_hashtags_linkedin`, such as #FluidicIntelligence in the Design Systems campaign).
- "Screens" for products.
- Off-voice sentences: consultancy language, hype, performative enthusiasm, anything under "I never say" in `voice.md`.
- A missed tagging convention from the overlay: Noel Cunningham on posts built from her article, Nagarro on posts that point to an offering page and on the series recap, Carlos Sousa on the recap only if she agreed, plain names rather than @handles on Instagram.
- A closing line that breaks the rule: "Thoughts?", "Agree?", a slogan, a generic positive ending, a gated giveaway.
- An absolute, superlative or comparative word that frames the author's opinion, leaves nothing to check, and that the body does not back (the claim test below).

## Low

- A hook that another pattern in `hooks.md` would carry better.
- Uniform rhythm: several sentences of the same mid length in a row.
- The quick pass in `seven-sweeps.md`: weak intensifiers, passive voice, nominalisations, sentences over 25 words.
- A word repeated close to itself.
- A visual brief that drifts from `kit.md` in type, family or chip.

## The claim test

`check.py` lists only the phrases that make a claim wherever they stand. An absolute, superlative or comparative word that reads harmlessly as often as not ("the only", "better than", "instantly", "the best", "the fastest", "the most", "nobody else") is left to this review, which reads it in its sentence:

- High when the words are about an offering, a product, a result or a competitor, or state something a reader could check and the piece gives no source.
- Medium when they frame the author's opinion and leave nothing to check ("The most expensive AI mistake in product work is the one that passes review", "where AI creates the most value"), and the body does not back the opinion (`hooks.md`, Bold claim, Fails when).
- No flag when the body backs that opinion, or when the words make no claim at all ("not the only reason", "the agent answered instantly" in a story).

## Internal pieces

A piece with `surface: viva` goes to Viva Engage, read by Nagarro colleagues only (`surfaces/viva-engage.md`). It is always `nagarro` mode, and it is still a piece the author signs, so most of this file holds as written:

- Apply in full: the confidentiality rule (a client, a client's product, an incident date or a figure tied to a client's project stays out inside the company as outside it, High; a proof point from `brand-profile.md` stated as written is no flag, as in the High list), numbers, quotes and their sources, the absolute and comparative claims with the claim test, a promised outcome, competitor comparisons, close paraphrase, placeholders, the banned words and patterns, dashes, British English, off-voice sentences and hype, the closing line, and the overlay's Approved claims and Never list.
- Do not apply: the overlay's promotion rules. Inside the company there is no offering page to point to, no campaign hashtag and no tagging convention, so a missing `#FluidicIntelligence`, a missing tag or a missing offering pointer is no flag. Naming an offering as a fact, or linking its internal page as a resource, is no flag either. The personal-mode promotion rule never runs, since the piece is `nagarro`, and the neutral rule finds nothing, since a `viva` piece leaves a neutral campaign out (`repurposing-matrix.md`, What carries over). One that still carries a neutral campaign gets a Medium flag on its `campaign` field, and every `neutral piece mentions` line `check.py` prints on it stays High, as the table below says.
- Flag as on any surface, with what is particular to this one: a piece left in `personal` mode, Medium on its `mode` field (`check.py` already refuses it with a `mode:` line, and the review names it as well); any hashtag, Medium; a link outside its sentence, or "link in the comments", Medium; a pitch to colleagues (an offering sold, "Nagarro offers", a call to book or buy), Medium, as a selling register (`voice.md`, My tone); a `@Name` tag or a name in `tags_people`, Medium; a post written to the market rather than to colleagues, Low, for `score` to weigh under fit.
- A link in the body is fine on Viva Engage, and `check.py` sends no `link in body:` line for it.

## From check.py to a severity

`brand-review` runs `python3 scripts/check.py <id>` first. Every `<id>: <problem>` line becomes a flag at the severity below, never downgraded. A hit that reads harmlessly ("guaranteed" inside "nothing is guaranteed") still stands, and its fix is a rewording, because `check.py` keeps failing until the words go. The words `check.py` no longer lists ("the only", "better than", "instantly") never reach this table: the review finds them by reading, and the claim test above decides their severity. A "guarantee" the checker passes ("I guarantee nothing", "there is no guarantee") promises nothing and is not a flag on its own.

| The message starts with | Severity |
|---|---|
| `unsubstantiated/absolute claim:` or `comparative/disparaging claim:` | High |
| `neutral piece mentions` | High |
| `personal piece promotes` | High |
| `number without a source:` | High |
| `placeholder:` | High |
| Anything else: `em dash on line`, `en dash on line`, `banned word:`, `pattern:`, `comment-gated giveaway`, `spelling:`, `link in body:`, `hashtag inside the text:`, a hashtag count over the cap, `missing required hashtag`, a character, thread or word count, a schema problem (`missing field:`, `format:`, `score:`, `review:`, `scheduled_date:`), `unknown campaign:` | Medium |

The checker cannot see most of the High list (identifying details, unattributed quotes, close paraphrase, a promised outcome, the claim words it leaves to this review, competitor comparisons, a stage implied without the words it knows) or most of the Medium and Low lists. Read those by hand, against the piece's `sources`, `first_comment`, footnotes and Sources section, and against the Facts available in the `marketeer-context` block.

## Recording the flags

- Each flag is `<location>: <issue>`. The location names the field and the line: `title`, `body line 12`, `first comment`, `subtitle`, `seo_description`, `visual brief`, `script`, `footnote [^2]`.
- `python3 scripts/review.py <id> --high "<flag>" --medium "<flag>" --low "<flag>"`, repeating each option once per flag, records them. Each run replaces the whole set, so pass every flag of this review. With nothing to flag, run it with no flags: that records a clean review. `--clear` forgets the review altogether, so the piece reads as never reviewed.
- It prints `review <id> high=N medium=N low=N blocked|clear`. Read it back: `blocked` means at least one High flag stands.

## The output

One table per piece: High first, then Medium, then Low, each in the order its locations appear.

| Severity | Location | Issue | Fix |
|---|---|---|---|
| High | body line 4 | a percentage with no source in its sentence, a footnote or `sources` | remove the figure, or ask the author for the source and cite it in the sentence |
| Medium | body line 9 | "leverage" is a banned word | "use" |
| Low | body line 2 | one sentence runs past 25 words | split it after the first clause |

Under the table, the gate line: `BLOCKED: <n> High flag(s)` or `CLEAR: approval is the author's`. Then the sentence every review ends with:

This review is advisory, for the author's own check; it is not legal sign-off.
