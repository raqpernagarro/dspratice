# Repurposing matrix: one piece, the other networks

`repurpose` takes one saved piece, the source, and writes children for other surfaces, each with `parent:` set to the source's id. A child is written for its network, never trimmed from the source: the voice stays, the register shifts, and the child carries only facts the source carries, each with its source. Read this with the surface files (`surfaces/linkedin.md`, `instagram.md`, `x.md`, `substack.md` and `viva-engage.md`), `hooks.md`, `ai-tells.md` and, for long form, `longform.md`.

## Source to derivatives

| Source | Derivatives |
|---|---|
| LinkedIn post | An Instagram caption, with its card or carousel brief; an X post or thread; on Tuesday and Thursday, a Viva Engage post for Nagarro colleagues |
| LinkedIn article | A LinkedIn promo post; an Instagram carousel brief; an X thread |
| Substack essay | A Substack note; a LinkedIn post; an X thread |
| Instagram post | An X post |
| X thread | A LinkedIn post |

- The promo post shares the article on a later day (`content-rules.md`): up to 1,300 characters, a strong first line before the "see more" cut, no link in the body (the FLO brief). The article's URL goes in `first_comment`, but it exists only once the article is live, so until the author gives it, `first_comment` stays empty and you tell her; never a placeholder such as [article link], which `check.py` flags. The same text can also go in the box LinkedIn shows when the author publishes the article, where the article card attaches itself (`PUBLISHING.md`).
- The Instagram carousel brief from an article turns its framework, steps or checklist into slides from `kit.md`: a cover, 3 to 5 interiors, the closing card 38, 8 slides at most.
- The Substack note follows `longform.md`: 2 to 4 sentences, no link, `parent` the essay.
- A LinkedIn post from an essay takes one story or one fact from it, never a summary of the essay. The essay's URL goes in the first comment once it is live.
- The Viva Engage post (`surfaces/viva-engage.md`) is the field note behind the public post, for the people who share the company: what we learned on the work, a tool or checklist colleagues can use this week, the story behind a decision, or a question for Nagarro's design community. It takes the anchor insight and comes at it from inside: what it means for our own projects, with the whole tool or the ask, never the public post trimmed and never a pitch. It comes only from a LinkedIn post (any format but `article`), on the day `plan.py` lists it, Tuesday or Thursday by plan; a day the author names is her call (`planning.md`, Viva Engage). A title line first, no hashtags, links inline, no first comment, and a close that asks colleagues something they answer from their own projects or asks for their examples.

## Insight types to formats

| The insight is | The format |
|---|---|
| Step by step | A carousel (Instagram `carousel`, LinkedIn `carousel-pdf`) or an X thread |
| One counterintuitive claim | A single post: LinkedIn `text`, X `text`, or an Instagram `image` with a family F card |
| A story with a lesson | A LinkedIn post |
| A data point with its source | A single post: X `text`, or a LinkedIn or Instagram `image` with a family D card; the source travels with the number |
| A framework | A carousel |

## Extract, rank, match

1. Extract 3 to 7 insights from the source, one sentence each, each with the facts and sources it rests on. Nothing the source does not support becomes an insight.
2. Rank them, the anchor insight first: the one the source is built on, usually its hook or its thesis. Rank the rest by how well each stands alone for a reader who never saw the source.
3. Match each target surface to one insight and a format from the table above, the anchor first. One child, one insight: a child never tries to carry them all. End with the posting order: which child the author posts first if she posts only one.

## Ids

A child's id is the source's stem plus the suffix of its surface: `-ig` (Instagram), `-x` (X), `-li` (LinkedIn post), `-note` (Substack note), `-promo` (LinkedIn promo post), `-viva` (Viva Engage). The stem is the source id without its own ending: a trailing `-li`, `-ig` or `-x` when the source is on that surface, `-article` on a LinkedIn article, `-essay` on a Substack essay. The children then land where `write-social-post`, `write-longform` and the FLO import put their siblings, so an existing one is found instead of duplicated.

| Source | Children |
|---|---|
| `ds-07-two-versions` | `ds-07-two-versions-ig`, `ds-07-two-versions-x`, `ds-07-two-versions-viva` |
| `<idea-id>-li` | `<idea-id>-ig`, `<idea-id>-x`, `<idea-id>-viva` |
| `flo-01-caring-more-article` | `flo-01-caring-more-promo`, `flo-01-caring-more-ig`, `flo-01-caring-more-x` |
| `flo-01-caring-more-essay` | `flo-01-caring-more-note`, `flo-01-caring-more-li`, `flo-01-caring-more-x` |

An article and its essay share a stem, so they share one X child: whichever is repurposed second finds it under the existing-child rule below.

## What carries over

- `campaign`, `pillar`, `mode` and `sources`, as the source has them, except on Viva Engage: a `viva` child is always `mode: nagarro`, whatever the source's mode, because it is written inside the company, and it leaves out a campaign with `neutral: true`, whose rule is for public pieces. Any other campaign comes along for grouping, without its hashtags or tags.
- `tags_people`, as plain names. On Instagram the caption writes people as plain names too, never @handles, unless the author supplies the handle (`nagarro-overlay.md`). A `viva` child tags nobody: its `tags_people` stays empty.
- The day: the child takes the day of the source's `scheduled_date`, passed as `--date`, and `new_post.py` sets the surface's default time on it (Lisbon: LinkedIn 08:30, Instagram 12:30, X 09:30, Substack 09:00, Viva Engage 10:00). A source with no date gives an undated child. The promo post is the exception: it goes out on a later day than the article (`content-rules.md`), three days after it in the FLO campaign (`campaigns/flo-2026-talks.md`); with no campaign rule, ask the author for the day.
- The title: the source's title. A promo post is titled "Promo: <article title>" and a note "Note: <essay title>", as the FLO import named them.
- The facts, each with its source, said no more strongly than the source says them.

## What never carries over

- The first comment's link, into an Instagram caption. An Instagram child's `first_comment` stays empty; "Link in bio" is the most it says. A `viva` child's `first_comment` stays empty too: on Viva Engage the link sits inline, in the sentence that says what it is.
- "Link in the comments." It belongs to LinkedIn: an Instagram caption never says it, and on X the link sits in the reply.
- The source's hashtags as they are. Each child picks its own within its surface's cap, plus what the campaign requires on that surface. A `viva` child has none.
- `@Name` tags, which belong to LinkedIn in `nagarro` mode only.
- Sentences. A child shares the source's facts and closing intent, not its lines: a sentence found word for word in both, other than a quoted fact, is rewritten for the child's network.
- Status, score and review: a child starts as `draft`.

## Existing children

- An existing `-ig` child whose `labels_extra` holds `needs-caption` (the Design Systems import gave each Instagram child the LinkedIn text as a placeholder caption): write the new caption to a scratch file and run `python3 scripts/set_body.py <child> --body-file <scratch> --remove-label needs-caption`. Only the body, that label and `updated` change, and the gate: a scored child loses its score and an `in-review` one goes back to `draft`, while an `approved` or `scheduled` child keeps its status and its score, given to the old caption. The TryPost link, assets, dates and review flags stay.
- Any other existing child: report `exists <child>` and skip it, because the author may have edited it. Only when the author asks for `--force` is it written again, with `new_post.py ... --force`, which keeps its TryPost link, status, posted date, creation date and review flags, and runs the gate on the score as a new body does: a scored `draft` or `in-review` child loses its score and an `in-review` one goes back to `draft`, while an `approved`, `scheduled` or `published` child keeps its status and its score (`leave_gate` in `scripts/lib/objects.py`). Every other field not passed again is lost, assets and extra labels among them.
- Then run `python3 scripts/check.py` on every child written, until each prints `ok <child>`.
