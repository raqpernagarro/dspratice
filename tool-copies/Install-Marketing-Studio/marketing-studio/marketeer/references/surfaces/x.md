# X

Fast takes, event coverage and one data point at a time, for design and product people (pillars 1 and 3 in `brand-profile.md`). Read this with `voice.md`, `content-rules.md`, `ai-tells.md` and `hooks.md`; if anything here seems to differ from `content-rules.md`, `content-rules.md` wins. Values marked [S] come from third-party guides cited in `docs/research/content-intelligence.md` §3 and are approximate.

## Limits

- 280 characters per post. The research notes much longer posts with a Premium plan; the author's drafts do not use them, and `check.py` holds every post to 280.
- A thread runs 4 to 8 posts.
- 0 to 1 hashtags.

## Formats

| `format` | What to draft |
|---|---|
| `text` | One post of 280 characters or fewer. |
| `thread` | 4 to 8 posts, each 280 characters or fewer, separated by a line holding only `---`. |

A thread body looks like this; `check.py` splits it on the `---` lines and counts each post on its own:

```
The first post: the hook and the point, complete on its own.

---

The second post: one idea.

---

The last post: the closing line, then the hashtag if there is one.
```

## Structure

- The first post stands alone: hook and point, worth reading if nobody opens the rest. It carries no numbering, no "1/" and no "Thread" label. Leave the later posts unnumbered too; the `---` lines already split them.
- One idea per post, in a sentence or two.
- Direct and conversational, first person, no corporate tone. The voice card and the banned words still apply.
- Emojis only when functional, few, never in the first line.
- Never a line holding only `---` inside a `text` post.

## Hashtags

- 0 to 1, on its own line at the end of the last post (or of the single post), never inside a sentence. `check.py` reads a hashtag at the end of a line of text, or anywhere else in a thread, as inside the text.
- A campaign's X tags (`required_hashtags_x`) count towards the one. No campaign requires one today.
- In `personal` mode `#FluidicIntelligence` counts as promotion and fails the check.

## Links

- Never in a post. The link goes in a reply, stored in `first_comment` inside a sentence that says what it is.
- Reach on posts with links is widely reported as suppressed, though the evidence is anecdotal [S].
- `check.py` flags any URL, "www." or bare domain such as nagarro.com in any post of the body.

## Closing line

- The single post, or the last post of a thread, ends with a concrete question the reader answers from their own work, or one action for this week.
- On event coverage, thanks to the speakers and hosts by name.
- Never "Thoughts?" or "Agree?", never a slogan, never a generic positive ending.

## Timing

- `new_post.py --date YYYY-MM-DD` sets `scheduled_date` to 09:30 Lisbon on that day.
- The author's goal until about 20 January 2027 is one X post a day. Event coverage belongs to the day of the event. The author publishes by hand; the system never posts.

## Content Object fields

- `id`: `<idea-id>-x`, with `parent: <idea-id>`.
- `format`: `text` or `thread`.
- `first_comment`: the reply with the link. `check.py` reads it for dashes, banned words, gated giveaways, spelling, placeholders, absolute claims and figures without a source; a link is fine here.
- `tags_people`: plain names. `sources`: the URL behind each fact, as on LinkedIn.

## What works for the author

- Fast takes on pillars 1 and 3: one sharp point from a longer LinkedIn piece, rewritten for X, not trimmed.
- Event coverage: what a speaker said, with their name, on the day.
- One data point with its source, such as the 2025 USENIX Security finding that on average 19.6% of the packages code-generating models recommended did not exist (`series-2` in `swipe/`).
- The research lists fast commentary on tech news, live event coverage, short contrarian takes and data points as what works on X (§3).

## Checklist

What `scripts/check.py` enforces on an X post, in the order it runs:

1. The campaign in `campaign`, if set, exists in `brands/me/campaigns/`; if it does not, that is the only problem reported.
2. Schema: `id`, `type`, `title`, `status`, `brand`, `surface`, `format`, `mode`, `author`, `timezone`, `created` and `updated` are present and not empty; `type` is `post`; `surface` is one of linkedin, instagram, x, substack, viva; `status` is one of idea, draft, in-review, approved, scheduled, published, archived; `mode` is `personal` or `nagarro`; `format` is `text` or `thread`; a `score`, if set, has `total` plus hook, voice, value, fit and ready, each a whole number from 1 to 10 adding up to `total`; `scheduled_date` and `posted_at`, if set, are ISO datetimes with an offset.
3. No em or en dash in the title, body or first comment.
4. No banned word (`ai-tells.md`) in the body or first comment.
5. No banned pattern in the body: "it's not X, it's Y", "Here's the thing", "Let's dive in", the hedges, the vague claims, or "Thoughts?" or "Agree?" as the last line.
6. No giveaway gated behind a comment, in the body or first comment.
7. British spelling in the body and first comment, in every form of a word: optimise, organising, analysed, realised, prioritised, colour, behaviour, favourite, centre, defence, catalogue, grey, labelled, modelling, cancelled, travelled, fulfil, enrolment, skilful and the rest of their families.
8. No bracketed placeholder such as [article link] in the body or first comment.
9. No absolute or comparative claim in the body or first comment, each matched as whole words: guaranteed, guarantee and guarantees (except in "guarantee nothing", "guarantees nothing" and "no guarantee"), risk-free, no risk, 100%, #1, best in the world, always wins, never fails, proven to, double your, triple your, unlike our competitors, competitors can't, beats every. So "#10" passes. "The only", "better than" and "instantly" are not on the list: `brand-review` judges them by its claim test (`compliance.md`).
10. Every figure (a percentage, a currency amount, a number with million, billion or thousand, a number with a thousands separator) has a source cue in its sentence: a footnote reference, a link, the word "found", or a word starting "source", "according", "study", "studies", "report" or "survey". A `Source:` label anywhere on the figure's line counts too, for every figure on that line. "Open source:", "data source:" and "the source:" do not count as that label, and "open source" is not a cue in the sentence either. The rule is skipped when `sources` is filled or the body has a `## Sources` heading. A figure followed by a unit of format, as in "280 characters", is a measure and passes.
11. In a campaign with `neutral: true`: no Nagarro, no FLO, no "talk" or "talks" after my, the, a, this, that, our, her or her, no keynote, no slide or slides, and no "the room", in the title, body or first comment.
12. In `personal` mode: no AI-Ready Design Systems, AI Readiness Diagnostic, nagarro.com/en/services or #FluidicIntelligence; no "Nagarro" followed by offers, can help, helps you, provides or delivers; no "our" or "Nagarro's" followed by offering, service, services or diagnostic; in the title, body or first comment.
13. No link in the body: nothing starting with http:// or https:// or www., and no bare domain ending in .com, .org, .net, .io, .ai, .pt, .dev, .app or .co.uk.
14. Hashtags only in the block of hashtag-only lines at the very end of the body; at most 1 there, the campaign's required ones included; every required hashtag present.
15. Length: a `text` post is at most 280 characters; a `thread` has 4 to 8 posts between `---` lines, each at most 280 characters.
