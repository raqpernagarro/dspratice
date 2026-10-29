# Viva Engage

Nagarro's internal network, surface id `viva`: The author's field notes for the people who share the company, read by Nagarro colleagues only (`brand-profile.md`, Audiences). A Viva Engage post is never the first home of an idea: it is the colleagues' version of that day's LinkedIn post, on Tuesday and Thursday. Read this with `voice.md`, `content-rules.md`, `nagarro-overlay.md`, `ai-tells.md`, `hooks.md` and `repurposing-matrix.md`; if anything here seems to differ from `content-rules.md`, `content-rules.md` wins.

## Limits

- Up to 3,000 characters in the body, for every format; `check.py` counts them.
- Aim for about 1,200 characters, within 900 to 1,500.
- No hashtags.
- One post on Tuesday and one on Thursday, by plan; a day the author names is her call (`write-social-post` and `repurpose` accept a named day).

## Formats

| `format` | What to draft |
|---|---|
| `text` | The post alone, about 1,200 characters. |
| `image` | The post plus one image the author attaches when she posts: the source's card from its `assets`, or a page of a deck. `visual_brief` names which. The post stands without it. |
| `video` | The post plus a video the author attaches, named in `visual_brief`. The post stands without it. |

`repurpose` writes a Viva Engage post from a LinkedIn post (any format but `article`); `write-social-post` writes one beside an idea's LinkedIn draft when the author asks for it, from that draft.

## Structure

- Line 1: a title on its own line, a claim or a question for colleagues. The author's own Viva Engage posts carry a title, and she uses this line as the post's title when she posts.
- Then a field note, written as the author to people who share the company: "we" and "our projects" where the work is shared, and the reader a colleague who knows Nagarro, never a prospect.
- One field note, one kind (What works for the author): what we learned on the work, a tool or checklist to use this week, the story behind a decision, or a question for Nagarro's design community.
- Short paragraphs, one idea each, a blank line between them. Lists use "→", never dash bullets; numbered lists only for real sequences, such as the steps of a checklist.
- Client-safe, inside the company as outside: the lesson, never the client (`content-rules.md`, Confidentiality). No client name, product, incident date or project figure, even for colleagues.
- No pitch. The overlay's promotion rules (an offering page to point to, the campaign hashtag, the tags, "Nagarro offers") do not apply inside the company: colleagues know the offerings. A post may name one as a fact, or link its internal page as a resource, and never sells it.
- Nobody is tagged, and `@Name` never appears. A person is named only where `content-rules.md` allows it, such as thanks to hosts and speakers on an event post.
- Emojis only when functional, few, never in the first line.
- The post stands on its own: a colleague who never saw the LinkedIn post gets the whole point, the tool included.

## Hashtags

- None. The campaign's required hashtags, such as `#FluidicIntelligence`, belong to LinkedIn and never come along.
- `check.py` sets no cap and requires no campaign hashtag on Viva Engage: it flags only a hashtag inside a sentence, so a hashtag line at the end passes the check and is yours to catch. `brand-review` flags any hashtag on Viva Engage as Medium (`compliance.md`, Internal pieces).

## Links

- Inline, inside the sentence that says what it is: internal pages (a deck, a page on the intranet, a community) and public sources alike.
- No "Link in the comments.": the link sits in the text, and `first_comment` stays empty.
- A figure still carries its source in its sentence or in `sources` (`content-rules.md`, Numbers and sources); a link to the source in that sentence is the cue.
- `check.py` runs no link rule on Viva Engage.

## Closing line

- A question colleagues answer from their own projects: "Which rule does your team follow that nobody wrote down?"
- Or an ask for their examples: "If your project keeps a decision record, share how you started it."
- Or one thing to try this week on something they work on.
- Never "Thoughts?" or "Agree?", never a slogan, never a generic positive ending, and never an ask gated behind a comment.

## Timing

- Tuesday and Thursday at 10:00 Lisbon. `new_post.py --date YYYY-MM-DD` sets `scheduled_date` to 10:00 on that day.
- `viva` is a child network only (`CHILD_ONLY` in `scripts/lib/planner.py`): `plan.py` reserves a `viva` child slot on Tuesday and Thursday from that day's top-ranked LinkedIn piece, a saved idea's LinkedIn surface included (`planning.md`, Viva Engage, has the ranking), and lists it under `## To repurpose` as `- <day> viva: from <source id>`. It never asks for a pillar idea for Viva Engage, and no other day has a slot (`planning.md`, Viva Engage).
- The author posts by hand; the system never posts. In TryPost the piece is a draft on the "Viva Engage (manual)" channel, a placeholder that borrows TryPost's `facebook` platform because TryPost has no Viva Engage (`trypost/README.md`, Manual channels). Copy the text from the draft into Viva Engage, attach what `visual_brief` names, then mark the piece posted. Never use Publish in TryPost.

## Content Object fields

- `id`: `<stem>-viva`, the LinkedIn source's stem plus `-viva` (`repurposing-matrix.md`, Ids): `ds-07-two-versions-viva`, `<idea-id>-viva`.
- `surface: viva`; `format: text`, `image` or `video`.
- `parent`: the LinkedIn piece it comes from.
- `mode: nagarro`, always, whatever the source's mode: the piece is written inside the company.
- `campaign`: the source's, for grouping, except a campaign with `neutral: true`, which is left out, because the neutral rule is for public pieces and the author names FLO and her talks to colleagues. The campaign's LinkedIn hashtags and tags do not apply.
- `pillar`: the source's.
- `title`: the source's title, as the matrix sets it. The title colleagues see is the body's first line.
- `sources`: the source's, each URL behind a fact in the post.
- `first_comment`: empty. `tags_people`: empty.
- `visual_brief`: `image` and `video` only, the attachment the author adds.
- `scheduled_date`: 10:00 Lisbon on the source's day.

## What works for the author

- Field notes from the work, client-safe: what we learned on a project; a tool or checklist colleagues can use this week; the story behind a decision; a question for Nagarro's design community.
- The field note behind the public post: the LinkedIn post makes the point to the market, and the Viva Engage post tells colleagues what it means for our own projects, with the tool or the ask.
- Generous: the whole checklist, the steps, the template. Colleagues are never sold to.
- The author's own Viva Engage posts for the FLO talks (`~/Claude/Flo-2026-Presentations/_share/SHARE-MESSAGES.md`, outside this repository: read them for the voice, never as a source of facts) share one shape: a title that is a claim or a question; a moment or a fact up top; what is attached; the mechanism, often as a "→" list; one example per point; then a question colleagues answer from their own field, or a test to run this week on something they work on.
- Until `playbook.md` holds an entry for Viva Engage, the FLO posts above are the bar for the shape, not for their length or their project figures: the limits and the confidentiality rule above still hold.

## Checklist

What `scripts/check.py` enforces on a Viva Engage post, in the order it runs:

1. The campaign in `campaign`, if set, exists in `brands/me/campaigns/`; if it does not, that is the only problem reported.
2. Schema: `id`, `type`, `title`, `status`, `brand`, `surface`, `format`, `mode`, `author`, `timezone`, `created` and `updated` are present and not empty; `type` is `post`; `surface` is one of linkedin, instagram, x, substack, viva; `status` is one of idea, draft, in-review, approved, scheduled, published, archived; `mode` is `personal` or `nagarro`; `format` is one of text, image, video; a `score`, if set, has `total` plus hook, voice, value, fit and ready, each a whole number from 1 to 10 adding up to `total`; a `review`, if set, holds whole counts and a `reviewed_at`, and every flag in `review_flags` starts with High, Medium or Low; `scheduled_date` and `posted_at`, if set, are ISO datetimes with an offset.
3. No em or en dash in the title, body or first comment.
4. No banned word (`ai-tells.md`) in the body or first comment.
5. No banned pattern in the body: "it's not X, it's Y", "Here's the thing", "Let's dive in", the hedges, the vague claims, or "Thoughts?" or "Agree?" as the last line.
6. No giveaway gated behind a comment, in the body or first comment.
7. British spelling in the body and first comment, in every form of a word: optimise, organising, analysed, realised, prioritised, colour, behaviour, favourite, centre, defence, catalogue, grey, labelled, modelling, cancelled, travelled, fulfil, enrolment, skilful and the rest of their families.
8. No bracketed placeholder, such as [deck link], in the body or first comment. Substack's markers count as placeholders here; footnotes (`[^1]`), links and images never are.
9. No absolute or comparative claim in the body or first comment, each matched as whole words: guaranteed, guarantee and guarantees (except in "guarantee nothing", "guarantees nothing" and "no guarantee"), risk-free, no risk, 100%, #1, best in the world, always wins, never fails, proven to, double your, triple your, unlike our competitors, competitors can't, beats every. So "#10" passes. "The only", "better than" and "instantly" are not on the list: `brand-review` judges them by its claim test (`compliance.md`).
10. Every figure (a percentage, a currency amount, a number with million, billion or thousand, a number with a thousands separator) has a source cue in its sentence: a footnote reference, a link, the word "found", or a word starting "source", "according", "study", "studies", "report" or "survey". A `Source:` label anywhere on the figure's line counts too, for every figure on that line. "Open source:", "data source:" and "the source:" do not count as that label, and "open source" is not a cue in the sentence either. The rule is skipped when `sources` is filled or the body has a `## Sources` heading. A figure followed by a unit of format, as in "1,200 characters", is a measure and passes.
11. In a campaign with `neutral: true`: no Nagarro, no FLO, no "talk" or "talks" after my, the, a, this, that, our, her or her, no keynote, no slide or slides, and no "the room", in the title, body or first comment. A Viva Engage post leaves a neutral campaign out (Content Object fields), so this rule finds nothing to read.
12. In `personal` mode: no AI-Ready Design Systems, AI Readiness Diagnostic, nagarro.com/en/services or #FluidicIntelligence; no "Nagarro" followed by offers, can help, helps you, provides or delivers; no "our" or "Nagarro's" followed by offering, service, services or diagnostic; in the title, body or first comment. A Viva Engage post is always `nagarro`, so this rule does not run on it.
13. Hashtags only in the block of hashtag-only lines at the end: a hashtag inside a sentence is a problem. On Viva Engage there is no cap on that block and no required hashtag, the campaign's included.
14. The body is at most 3,000 characters.

No link rule and no word count run on Viva Engage: links are welcome inline, a hashtag line at the end is yours to catch, and the aim of about 1,200 characters is yours to keep, as the sections above say.
