# Instagram

Visual first, warmer and shorter than LinkedIn, in the same voice. Pillar 4 lives here (`brand-profile.md`), next to Instagram versions of the author's LinkedIn ideas. Read this with `voice.md`, `content-rules.md`, `kit.md`, `ai-tells.md` and `hooks.md`; if anything here seems to differ from `content-rules.md`, `content-rules.md` wins. Values marked [S] come from third-party guides cited in `docs/research/content-intelligence.md` §3 and are approximate.

## Limits

- Caption up to 2,200 characters; about 125 show before it is cut.
- Up to 5 hashtags, the limit Instagram rolled out in December 2025 [S].
- A carousel holds up to 10 slides here. The app allows up to 20, but the API may still stop at 10 [S]. A carousel built from `kit.md` stops at 8.

## Formats

Every post needs a visual: an image, a carousel or a Reel. A caption never goes out alone.

| `format` | What to draft |
|---|---|
| `image` | The caption plus one card at 1080×1350 (4:5, the safe feed size) or 1080×1440 (3:4, which fits the profile grid) [S]. |
| `carousel` | The caption plus up to 10 slides at 4:5 or 3:4, from the kit's families A to G. `kit.md` assembles a carousel as a cover (01 to 32, or C), 3 to 5 interiors (A, with one B, D or E in the middle when the post has a visual argument) and the closing card 38. |
| `reel` | 9:16, 1080×1920 [S]. Text inside the safe zone and the first 1 to 2 seconds carry the hook [S]. The script is written by `write-video-script`, under the rules in `marketeer/references/reels.md`. |
| `story` | A valid format; the research suggests Stories daily during events [S]. |

`write-social-post` and `repurpose` draft `image` or `carousel`; a `reel` comes from `write-video-script`. The kit families: A carousel interior (index, definition, source or quote, arrow list, numbered action, closing), B before and after, C the author's face, D data, E artefacts as image, F typographic, G patterns.

## Structure

- The text on the image is the first hook. The caption's first 125 characters carry a second one that promises a different angle, never a repeat of the image (`hooks.md`). A Reel is the exception: it has no card, and its caption's first line repeats the spoken hook (`reels.md`, The caption).
- The caption stands alone: a reader who only sees Instagram gets the whole point. It never says "link in the comments".
- Warmer and shorter than LinkedIn, the same voice: short lines, one idea each, blank lines between ideas, "→" for lists, no dash bullets.
- Emojis only when functional (a flag, a pin, an arrow for a list), few, never in the first line. The research allows more; `content-rules.md` wins.
- Mentions are plain names, not @handles, unless the author supplies the handle (`nagarro-overlay.md`).

## Hashtags

- Up to 5, at the end, never inside a sentence.
- A campaign's Instagram tags (`required_hashtags_instagram`) count towards the 5. The Design Systems campaign requires none here.
- In `personal` mode `#FluidicIntelligence` counts as promotion and fails the check.

## Links

- No links in the caption. "Link in bio" at most.
- Never "link in the comments": `first_comment` stays empty on Instagram.
- `check.py` flags any URL, "www." or bare domain such as nagarro.com in the caption.

## Closing line

- A concrete question the reader answers from their own work, or one action for this week, kept short.
- On event posts, thanks to hosts and co-speakers by name, as plain names.
- Never "Thoughts?" or "Agree?", never a slogan, never a generic positive ending.

## Timing

- `new_post.py --date YYYY-MM-DD` sets `scheduled_date` to 12:30 Lisbon on that day.
- The author's goal until about 20 January 2027 is one Instagram post a day. The author publishes by hand; the system never posts.

## Content Object fields

- `id`: `<idea-id>-ig`, with `parent: <idea-id>`. An Instagram version of a LinkedIn post has that post as `parent`, as the Design Systems children do.
- `format`: `image`, `carousel`, `reel` or `story`.
- `visual_brief`: a short paragraph a designer can build from. It names the kit family (and card number when one fits), the background (petrol or off-white), the one lime accent and the words it marks, the on-image copy word for word, and the type: Figtree for titles and body, IBM Plex Mono for anything that is an artefact (a file, a token, a terminal line, a quote source). For a carousel, add one line per slide.
- `image_prompt`: one paragraph a person can paste into an image tool. It gives the size, the kit's colours as hex values (petrol #1F434F, off-white #F7F9FB, lime #C0E50A, grey-blue #A6BAC7, cream #F1F3EA, mist #D9E4E9, pistachio #E4EFBF), the on-image copy, and what is forbidden (black, yellow, pink, photographic gradients, glows and blur). No photo of anyone but the author: the prompt never asks for a person, and a card with a photo uses one the author supplies (`kit.md`), never a generated face or a stock photo.
- `assets`: empty until the author adds the file.
- `tags_people`: plain names.
- `sources`: as on LinkedIn, the URL behind each fact.
- `visual_brief` and `image_prompt` show as notes on the TryPost draft. `check.py` does not read them, so check them yourself for dashes and British spelling.

An example, adapted from the `series-3` swipe post:

- Visual brief: "Family F, typographic, one card at 1080×1350. Petrol background. Title in Figtree 500, off-white: 'A design system a machine can use lists what does not exist.' The words 'what does not exist' in lime, the only accent. Outline chip top left: 'Field notes'."
- Image prompt: "A flat typographic social card, 1080×1350, 28px rounded corners, solid petrol background #1F434F. One large sentence in a clean geometric sans serif, off-white #F7F9FB: 'A design system a machine can use lists what does not exist.' The last four words in lime #C0E50A. A small outlined uppercase label in the top left corner reading 'FIELD NOTES' in off-white. Wide margins, nothing else on the card. No people, no photos, no black, yellow or pink, no gradients, glows or blur."

## What works for the author

- Pillar 4, caring as the moat: leading design teams, culture, hiring, life at Product Studio and Nagarro Portugal (`brand-profile.md`).
- Instagram versions of LinkedIn ideas as a carousel or one card, such as the eight-slide `ds-02-rules-ai-has-never-seen-ig` carousel in `content/`.
- People, culture, event moments and carousel explainers. The research, written for Nagarro's own accounts, finds these work on Instagram and dense thought leadership does not (§3).
- The register is warmer and shorter; the voice card, the banned words and the closing line rule do not change.

## Checklist

What `scripts/check.py` enforces on an Instagram post, in the order it runs:

1. The campaign in `campaign`, if set, exists in `brands/me/campaigns/`; if it does not, that is the only problem reported.
2. Schema: `id`, `type`, `title`, `status`, `brand`, `surface`, `format`, `mode`, `author`, `timezone`, `created` and `updated` are present and not empty; `type` is `post`; `surface` is one of linkedin, instagram, x, substack, viva; `status` is one of idea, draft, in-review, approved, scheduled, published, archived; `mode` is `personal` or `nagarro`; `format` is one of image, carousel, reel, story; a `score`, if set, has `total` plus hook, voice, value, fit and ready, each a whole number from 1 to 10 adding up to `total`; `scheduled_date` and `posted_at`, if set, are ISO datetimes with an offset.
3. No em or en dash in the title, caption or first comment.
4. No banned word (`ai-tells.md`) in the caption or first comment.
5. No banned pattern in the caption: "it's not X, it's Y", "Here's the thing", "Let's dive in", the hedges, the vague claims, or "Thoughts?" or "Agree?" as the last line.
6. No giveaway gated behind a comment, in the caption or first comment.
7. British spelling in the caption and first comment, in every form of a word: optimise, organising, analysed, realised, prioritised, colour, behaviour, favourite, centre, defence, catalogue, grey, labelled, modelling, cancelled, travelled, fulfil, enrolment, skilful and the rest of their families.
8. No bracketed placeholder such as [handbook link] in the caption or first comment.
9. No absolute or comparative claim in the caption or first comment, each matched as whole words: guaranteed, guarantee and guarantees (except in "guarantee nothing", "guarantees nothing" and "no guarantee"), risk-free, no risk, 100%, #1, best in the world, always wins, never fails, proven to, double your, triple your, unlike our competitors, competitors can't, beats every. So "#10" passes. "The only", "better than" and "instantly" are not on the list: `brand-review` judges them by its claim test (`compliance.md`).
10. Every figure (a percentage, a currency amount, a number with million, billion or thousand, a number with a thousands separator) has a source cue in its sentence: a footnote reference, a link, the word "found", or a word starting "source", "according", "study", "studies", "report" or "survey". A `Source:` label anywhere on the figure's line counts too, for every figure on that line. "Open source:", "data source:" and "the source:" do not count as that label, and "open source" is not a cue in the sentence either. The rule is skipped when `sources` is filled or the body has a `## Sources` heading. A figure followed by a unit of format, as in "2,200 characters", is a measure and passes.
11. In a campaign with `neutral: true`: no Nagarro, no FLO, no "talk" or "talks" after my, the, a, this, that, our, her or her, no keynote, no slide or slides, and no "the room", in the title, caption or first comment.
12. In `personal` mode: no AI-Ready Design Systems, AI Readiness Diagnostic, nagarro.com/en/services or #FluidicIntelligence; no "Nagarro" followed by offers, can help, helps you, provides or delivers; no "our" or "Nagarro's" followed by offering, service, services or diagnostic; in the title, caption or first comment.
13. No link in the caption: nothing starting with http:// or https:// or www., and no bare domain ending in .com, .org, .net, .io, .ai, .pt, .dev, .app or .co.uk.
14. Hashtags only in the block of hashtag-only lines at the end; at most 5 there, the campaign's required ones included; every required hashtag present.
15. The caption is at most 2,200 characters.
