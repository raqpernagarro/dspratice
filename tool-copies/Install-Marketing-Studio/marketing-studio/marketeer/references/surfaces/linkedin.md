# LinkedIn

The author's primary network: points of view and field notes for business, product and design leaders (`brand-profile.md`). Read this with `voice.md`, `content-rules.md`, `ai-tells.md` and `hooks.md`; if anything here seems to differ from `content-rules.md`, `content-rules.md` wins. Values marked [S] come from third-party guides cited in `docs/research/content-intelligence.md` §3 and are approximate.

## Limits

- Up to 3,000 characters in the body, for every format except `article`. The first comment does not count.
- About 210 characters show before "see more" on desktop, and about 140 on mobile [S]. The first two lines carry the hook.
- Aim for 900 to 1,500 characters on text posts [S].

## Formats

| `format` | What to draft |
|---|---|
| `text` | The post alone, 900 to 1,500 characters. |
| `image` | The post plus one 1080×1350 (4:5) card built from `kit.md`, described in `visual_brief` the way `instagram.md` sets out. |
| `carousel-pdf` | The post plus a PDF of 6 to 12 slides at 1080×1350: one idea per slide, a cover that states the payoff, a last slide with the action [S]. A `document_title` under 300 characters. `kit.md` caps its own carousels at 8 slides (a cover, 3 to 5 interiors from family A with one B, D or E when the post has a visual argument, then the closing card 38), so a kit carousel runs 6 to 8. |
| `video` | The post plus a 4:5 video that works muted, with captions burned in [S]. |
| `poll` | The question and its context as the body, the options in `poll_options`. The author creates the poll by hand; the sync shows the options as a note on the TryPost draft. |
| `article` | Long form, drafted by `write-longform`. Not drafted from this file. |

## Structure

- Lines 1 and 2: the hook, complete before the fold (`hooks.md`).
- Short lines, one idea each, and a blank line between ideas.
- Lists use "→", never dash bullets. Numbered lists only for real sequences, such as steps in order.
- Emojis only when functional (a flag, a pin, an arrow for a list), few, never in the first line.
- The post stands on its own: someone who never opens the image, document or video still gets the point.
- People: in `nagarro` mode, when the overlay asks for a tag, the text names the person as `@Name`, as the author's own posts do (`ds-01`, `ds-15`), and `tags_people` holds the plain name. In `personal` mode nobody is tagged, and a person the author thanks is a plain name. This is the rule `write-social-post` follows.
- The hashtag lines come last. "Link in the comments." can sit just before them, after the closing line, as in `ds-01`.

## Hashtags

- 0 to 3 at the end, plus any hashtag the campaign requires (`required_hashtags_linkedin` in the campaign file). Never inside a sentence.
- The Design Systems campaign (`ai-ready-design-systems`, `nagarro` mode) requires `#FluidicIntelligence` on every LinkedIn post, with at most two topic tags beside it (`nagarro-overlay.md`). `check.py` would allow three beside it; the overlay's two is the rule.
- In `personal` mode `#FluidicIntelligence` counts as promotion and fails the check.
- The research finds hashtags carry little reach weight, so pick niche ones over broad ones.

## Links

- Never in the body: no URL, no "www.", and no bare domain such as nagarro.com, which `check.py` catches as readily as a full URL.
- The link goes in `first_comment`, inside a sentence that says what it is: "Noel's full article: https://www.nagarro.com/en/blog/designing-ai-ready-systems".
- The body may say "Link in the comments."
- Links in the body are widely reported, though not officially confirmed, to reduce reach [S].

## Closing line

- A concrete question the reader answers from their own work: "Of the last ten components AI touched, how many did anyone check against the system?"
- Or one action for this week: "List ten rules your team follows that nobody wrote down."
- On event posts, thanks to hosts and co-speakers, by name when they are public figures or hosts.
- Never "Thoughts?" or "Agree?", never a slogan, never a generic positive ending.

## Timing

- Post between 08:00 and 10:00 Lisbon time, then reply to comments in the first hour (`brand-profile.md`).
- `new_post.py --date YYYY-MM-DD` sets `scheduled_date` to 08:30 Lisbon on that day.
- The author's goal until about 20 January 2027 is one LinkedIn post a day; the Design Systems campaign posts on weekdays. The author publishes by hand; the system never posts.

## Content Object fields

- `id`: `<idea-id>-li`, with `parent: <idea-id>`.
- `format`: one of the six above.
- `first_comment`: the link and the sentence around it. `check.py` reads it for dashes, banned words, gated giveaways, spelling, placeholders, absolute claims and figures without a source; a link is fine here.
- `tags_people`: the plain names, without "@"; the text carries the `@Name` (Structure). In `nagarro` mode (`nagarro-overlay.md`): Noel Cunningham on posts built from her article "Most design systems are not ready for AI"; Nagarro on posts that point to an offering page and on the series recap; Carlos Sousa on the recap only if she agreed to be tagged.
- `sources`: the URL behind each fact in the post: one of the campaign's `sources`, a source cited in a swipe post, or one the author gave.
- `document_title`: `carousel-pdf` only, under 300 characters, the title shown with the document.
- `poll_options`: `poll` only, the options in order.
- `new_post.py --document-title "<title>"` sets `document_title`. It has no flag for `poll_options` yet: when a poll needs them, give the author the options; do not edit the frontmatter by hand.

## What works for the author

- Reframes and field notes for pillars 1 to 3. The five `series-*` files in `swipe/` are the bar: a reframe or bold claim on top, one mechanism explained with specifics, no hype.
- Nagarro-aligned posts that point to one article or offering and keep the same voice (`ds-01`, `ds-07`, `ds-15` in `swipe/`).
- Event posts that thank the people involved, by name.
- Carousels for frameworks and checklists. The research calls the PDF carousel the best-performing B2B format, with a median engagement of about 5.7% (Oktopost, March 2026) [S].
- `playbook.md` fills from entered performance data through `content-planner learn`; until it has entries, the swipe files are the bar.

## Checklist

What `scripts/check.py` enforces on a LinkedIn post, in the order it runs:

1. The campaign in `campaign`, if set, exists in `brands/me/campaigns/`; if it does not, that is the only problem reported.
2. Schema: `id`, `type`, `title`, `status`, `brand`, `surface`, `format`, `mode`, `author`, `timezone`, `created` and `updated` are present and not empty; `type` is `post`; `surface` is one of linkedin, instagram, x, substack, viva; `status` is one of idea, draft, in-review, approved, scheduled, published, archived; `mode` is `personal` or `nagarro`; `format` is one of text, image, carousel-pdf, video, poll, article; a `score`, if set, has `total` plus hook, voice, value, fit and ready, each a whole number from 1 to 10 adding up to `total`; `scheduled_date` and `posted_at`, if set, are ISO datetimes with an offset.
3. No em or en dash in the title, body or first comment.
4. No banned word (`ai-tells.md`) in the body or first comment.
5. No banned pattern in the body: "it's not X, it's Y", "Here's the thing", "Let's dive in", the hedges, the vague claims, or "Thoughts?" or "Agree?" as the last line.
6. No giveaway gated behind a comment, in the body or first comment.
7. British spelling in the body and first comment, in every form of a word: optimise, organising, analysed, realised, prioritised, colour, behaviour, favourite, centre, defence, catalogue, grey, labelled, modelling, cancelled, travelled, fulfil, enrolment, skilful and the rest of their families.
8. No bracketed placeholder such as [handbook link] in the body or first comment.
9. No absolute or comparative claim in the body or first comment, each matched as whole words: guaranteed, guarantee and guarantees (except in "guarantee nothing", "guarantees nothing" and "no guarantee"), risk-free, no risk, 100%, #1, best in the world, always wins, never fails, proven to, double your, triple your, unlike our competitors, competitors can't, beats every. So "#10" passes. "The only", "better than" and "instantly" are not on the list: `brand-review` judges them by its claim test (`compliance.md`).
10. Every figure (a percentage, a currency amount, a number with million, billion or thousand, a number with a thousands separator) has a source cue in its sentence: a footnote reference, a link, the word "found", or a word starting "source", "according", "study", "studies", "report" or "survey". A `Source:` label anywhere on the figure's line counts too, for every figure on that line. "Open source:", "data source:" and "the source:" do not count as that label, and "open source" is not a cue in the sentence either. The rule is skipped when `sources` is filled or the body has a `## Sources` heading. A figure followed by a unit of format, as in "1,500 characters", is a measure and passes.
11. A `format: article` runs 1,000 to 1,400 words, counted as `longform.md` sets out (Word count); other formats are not counted. A Substack essay runs 1,800 to 2,500 (`substack.md`).
12. In a campaign with `neutral: true`: no Nagarro, no FLO, no "talk" or "talks" after my, the, a, this, that, our, her or her, no keynote, no slide or slides, and no "the room", in the title, body or first comment.
13. In `personal` mode: no AI-Ready Design Systems, AI Readiness Diagnostic, nagarro.com/en/services or #FluidicIntelligence; no "Nagarro" followed by offers, can help, helps you, provides or delivers; no "our" or "Nagarro's" followed by offering, service, services or diagnostic; in the title, body or first comment.
14. No link in the body: nothing starting with http:// or https:// or www., and no bare domain ending in .com, .org, .net, .io, .ai, .pt, .dev, .app or .co.uk. Skipped for `article`.
15. Hashtags only in the block of hashtag-only lines at the end; at most 3 there, not counting the campaign's required ones; every required hashtag present. Skipped for `article`.
16. The body is at most 3,000 characters. Skipped for `article`.
