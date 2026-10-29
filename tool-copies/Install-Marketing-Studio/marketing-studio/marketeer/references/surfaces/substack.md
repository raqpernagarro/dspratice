# Substack

The author's newsletter, new with the FLO essays in October 2026: The author writing about building products, design and AI from practice, in personal essays and the short notes that point to them. Read this with `longform.md`, `voice.md`, `content-rules.md`, `ai-tells.md` and `hooks.md`; if anything here seems to differ from `content-rules.md`, `content-rules.md` wins.

## Limits

- An essay runs 1,800 to 2,500 words, by `check.py`'s count (`longform.md`).
- A note runs 2 to 4 sentences. `check.py` sets no length for a note, so count them yourself.
- The subtitle is one sentence.
- The social preview is 1456×1048; inline images are 1456×816, 2 or 3 per essay.
- No hashtags, in essays or notes.

## Formats

| `format` | What to draft |
|---|---|
| `essay` | The personal essay, as `longform.md` sets it out: the same topic as the LinkedIn article from another angle, sharing facts and never sentences. |
| `note` | 2 to 4 sentences: a promo for the essay, with `parent` the essay, or a standalone thought. |

`write-longform` drafts the essay and its note together with the article; `repurpose` writes a note for an essay that has none.

## Structure

- The essay opens on a scene or a moment, never a thesis, and follows the arc: the scene, what it made the author notice, the stories, what she does now, what it means for the reader.
- 3 to 5 H2s. Short paragraphs, one idea each; "→" for lists, numbered lists only for real sequences.
- One or two pull quotes, each a line `> [PULL QUOTE] <the line>`.
- `[SUBSCRIBE BUTTON]` on its own line about a third of the way in and again at the end; `[SHARE BUTTON]` on its own line before the sign-off; then "The author", then the P.S.
- Sources as footnotes: `[^1]` in the sentence, the definitions at the very end.
- Images as `![alt](images/<image-id>.png)`, each with an italic caption line under it.
- Warmer and more in the first person than the article, in the same voice: the voice card and the banned words do not change.
- A note is plain sentences: no heading, no image, no marker.

## Hashtags

- None, in essays or in notes.
- `check.py` runs its hashtag rule on LinkedIn, Instagram, X and Viva Engage, never on Substack, so a hashtag on Substack is yours to catch.

## Links

- Essays: links are fine in the body (`content-rules.md`); sources go in footnotes, with titles and URLs.
- Notes: no link. Substack attaches the essay to the note.
- `check.py` runs its link rule on LinkedIn, Instagram and X only, so check a note yourself.
- To point to the newsletter from LinkedIn, the author uses a comment or her profile's Featured section, never the body of a post (`PUBLISHING.md`, `surfaces/linkedin.md`).

## Closing line

- The essay ends by `voice.md`'s rule: never a slogan, never a generic positive ending.
- Its question goes in the P.S.: one specific thing readers reply with, from their own work. The first FLO essay asks for one place where they, or their team, went straight to the answer.
- A note ends on the reason to open the essay, or on a question the reader answers from their own work.
- Never "Thoughts?" or "Agree?".

## Timing

- Thursday at 09:00 Lisbon, by the FLO schedule: the LinkedIn article on Tuesday, the essay and its note on the Thursday of the same week (`campaigns/flo-2026-talks.md`, cadence `substack: thursday`).
- `new_post.py --date YYYY-MM-DD` sets `scheduled_date` to 09:00 Lisbon on that day, for an essay and a note alike. The imported FLO notes sit at 09:30, half an hour after their essay.
- The author publishes by hand, as an email and on the web; the system never posts.

In TryPost, Substack is the "Substack (manual)" channel: a placeholder that borrows TryPost's `mastodon` platform, because TryPost has no Substack, and is never published from (`trypost/README.md`, Manual channels). A note syncs as a draft on that channel, on its day, like a post on any network: The author copies its text into Substack and marks it posted. An essay keeps its Idea card with the `long-form` label, in To Do, and gains one dated draft on the Substack channel that puts its day on the calendar: the essay's title, its subtitle and one line pointing to its Ideas card, never the essay's body. The draft carries the essay's campaign, pillar and mode labels and `long-form`, never a status label, and the next push carries a changed title, subtitle or date to it. It is written from the file: when its text was edited in TryPost, the push prints `conflict <id>` and leaves it alone.

## Content Object fields

- `id`: `<idea-id>-essay` and `<idea-id>-note` from `write-longform`; `flo-<nn>-<topic>-essay` and `-note` for the imported ones.
- `surface: substack`; `format: essay` or `note`.
- `title`: the essay's title; a note's is "Note: <essay title>".
- `subtitle` (essay): one sentence, the inbox preview. Set with `--subtitle`.
- `seo_title` and `seo_description` (essay): set with `--seo-title` and `--seo-description`.
- `cover` (essay): the social preview at 1456×1048, as `images/<image-id>.png`. Set with `--cover`.
- `parent`: the essay, on a note; the idea, on an essay drafted from one.
- `visual_brief` (essay): one line per image, in the form `longform.md` gives.
- `sources`: optional, since the footnotes carry the essay's sources. A non-empty `sources` makes `check.py` treat every figure as sourced, so each figure still needs its footnote.
- `first_comment`: empty.

## What works for the author

- Stories from her own practice told in the first person, then what she does now and what it means for the reader. The first FLO essay has the shape: a moment at home, the waves of sameness, the stories, the framework, a P.S. that asks for a reply.
- One topic a week, paired with the LinkedIn article: the article is the method, the essay the stories behind it.
- The first issue opens or closes with a short note on what the newsletter is (the FLO brief). The cadence is not settled, so it is never stated.
- A note for each essay, to promote it on Substack.
- `playbook.md` fills from entered performance data through `content-planner learn`; until it has entries, the FLO essays show the shape.

## Checklist

What `scripts/check.py` enforces on a Substack piece, in the order it runs:

1. The campaign in `campaign`, if set, exists in `brands/me/campaigns/`; if it does not, that is the only problem reported.
2. Schema: `id`, `type`, `title`, `status`, `brand`, `surface`, `format`, `mode`, `author`, `timezone`, `created` and `updated` are present and not empty; `type` is `post`; `surface` is one of linkedin, instagram, x, substack, viva; `status` is one of idea, draft, in-review, approved, scheduled, published, archived; `mode` is `personal` or `nagarro`; `format` is `essay` or `note`; a `score`, if set, has `total` plus hook, voice, value, fit and ready, each a whole number from 1 to 10 adding up to `total`; a `review`, if set, holds whole counts and a `reviewed_at`, and every flag in `review_flags` starts with High, Medium or Low; `scheduled_date` and `posted_at`, if set, are ISO datetimes with an offset.
3. No em or en dash in the title, body or first comment.
4. No banned word (`ai-tells.md`) in the body or first comment.
5. No banned pattern in the body: "it's not X, it's Y", "Here's the thing", "Let's dive in", the hedges, the vague claims, or "Thoughts?" or "Agree?" as the last line.
6. No giveaway gated behind a comment, in the body or first comment.
7. British spelling in the body and first comment, in every form of a word: optimise, organising, analysed, realised, prioritised, colour, behaviour, favourite, centre, defence, catalogue, grey, labelled, modelling, cancelled, travelled, fulfil, enrolment, skilful and the rest of their families.
8. No bracketed placeholder, such as [Newsletter name], in the body or first comment. The markers `[SUBSCRIBE BUTTON]`, `[SHARE BUTTON]` and `[PULL QUOTE]` are allowed on Substack, and footnotes (`[^1]`), links and images are never placeholders.
9. No absolute or comparative claim in the body or first comment, each matched as whole words: guaranteed, guarantee and guarantees (except in "guarantee nothing", "guarantees nothing" and "no guarantee"), risk-free, no risk, 100%, #1, best in the world, always wins, never fails, proven to, double your, triple your, unlike our competitors, competitors can't, beats every. So "#10" passes. "The only", "better than" and "instantly" are not on the list: `brand-review` judges them by its claim test (`compliance.md`).
10. Every figure (a percentage, a currency amount, a number with million, billion or thousand, a number with a thousands separator) has a source cue in its sentence: a footnote reference, a link, the word "found", or a word starting "source", "according", "study", "studies", "report" or "survey". A `Source:` label anywhere on the figure's line counts too, for every figure on that line. "Open source:", "data source:" and "the source:" do not count as that label, and "open source" is not a cue in the sentence either. The rule is skipped when `sources` is filled or the body has a `## Sources` heading. A figure followed by a unit of format, as in "2,500 words", is a measure and passes.
11. An essay runs 1,800 to 2,500 words, counted as `longform.md` sets out. A note is not counted.
12. In a campaign with `neutral: true`: no Nagarro, no FLO, no "talk" or "talks" after my, the, a, this, that, our, her or her, no keynote, no slide or slides, and no "the room", in the title, body or first comment.
13. In `personal` mode: no AI-Ready Design Systems, AI Readiness Diagnostic, nagarro.com/en/services or #FluidicIntelligence; no "Nagarro" followed by offers, can help, helps you, provides or delivers; no "our" or "Nagarro's" followed by offering, service, services or diagnostic; in the title, body or first comment.

No link, hashtag or length rule runs on Substack: those are yours to check, as the sections above say.
