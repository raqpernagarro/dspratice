---
name: write-social-post
description: Drafts one idea for LinkedIn, Instagram and X from the idea object ideation saved (brands/me/content/<idea-id>.md), or from a topic plus a chosen hook, and saves <idea-id>-li, <idea-id>-ig and <idea-id>-x as draft Content Objects, each written for its own network and born clean, so every draft passes scripts/check.py before it is shown. When the author asks for it, it also writes <idea-id>-viva, a Viva Engage post for Nagarro colleagues, from the LinkedIn draft. Use when the author asks to "write the post", "draft this for LinkedIn", for "the three versions", to "turn this idea into posts", for an "Instagram caption" or an "X thread". Not for articles, essays or Reel scripts (use write-longform or write-video-script), not for scoring a draft (use score), and not for repurposing a published piece (use repurpose).
---

# write-social-post

Turns one idea into three drafts, one per network: a LinkedIn post, an Instagram caption with its visual brief and image prompt, and an X post or thread. Each is saved through `scripts/new_post.py` as a Content Object (`type: post`, `status: draft`) and passes `scripts/check.py` before the author sees it. Paths are relative to the repository root.

## Inputs

In any order and wording (`agents-fill-gaps-with-the-same-guess` is enough):

- An idea id: the file name of `brands/me/content/<idea-id>.md` without `.md`, a `type: idea` object that `ideation` saved. Or a topic in a sentence plus the hook the author chose: then the facts are only those under the context block's Facts available or given by the author in the session, the id is a kebab-case slug of the topic (at most 40 characters, not starting with `ds-` or `flo-`), and the drafts have no `parent`. When the topic still needs angles or hooks, offer `ideation` first.
- Surfaces: `linkedin`, `instagram`, `x`, or any two of them. All three by default. `viva` (Viva Engage, Nagarro colleagues only) is added only when the author asks for it, and only with `linkedin` or beside a LinkedIn draft that exists: a Viva Engage post is never the first home of an idea (step 9).
- A date: `--date YYYY-MM-DD`, the day to publish. `new_post.py` sets the surface's usual time on it (Lisbon): LinkedIn 08:30, Instagram 12:30, X 09:30, Viva Engage 10:00. Without one the drafts have no `scheduled_date`.
- A mode (`personal` or `nagarro`) or a campaign slug. An override fills a value the idea leaves empty, such as a campaign on an idea with `campaign: null`. When the idea has a value and the override differs, the idea's value wins: say so in one line.

## Steps

1. Run `marketeer-context` (`/marketeer:marketeer-context`) with the idea's pillar, mode and campaign, and the idea id as the task sentence. Name no surface when drafting all three, so `kit.md` is read for Instagram; name the one surface otherwise. Work from its block: the four Voice rows and the two swipe files on the `Swipe:` line, the Hard rules, the Mode rules, the Campaign's required hashtags, tags and sources, Facts available, and Gaps.
2. Read, in full:
   - the idea file: `pillar`, `mode`, `campaign` and `sources` in the frontmatter; in the body, the `Chosen:` angle, the hook marked `★ Recommended`, the `## Outline`, the three `## Per network` lines (the format and the visual idea for each network) and `## Facts and sources`;
   - `marketeer/references/ai-tells.md` and `marketeer/references/hooks.md`;
   - `marketeer/references/surfaces/<surface>.md` for each surface, down to its `## Checklist`, which is what `check.py` runs (`surfaces/viva-engage.md` for `viva`);
   - `brands/me/kit.md` when drafting Instagram; `brands/me/campaigns/<slug>.md` when the idea has a campaign; `brands/me/nagarro-overlay.md` in `nagarro` mode;
   - the two swipe files on the `Swipe:` line: the bar for rhythm, length and openings.

   Then write this run's fact list in the scratch directory (step 7): one line per fact under `## Facts and sources`, with its source, the chosen angle's facts first. These are the only facts the drafts may state, and a draft need not use them all.
   - A fact keeps its figures, its subject, its scope and its verbs exactly as the source states them.
   - A share stays a share: when 45% of the invented packages came back every time, that is "nearly half", so most did not, and it never becomes "every time", "each time" or "always" in a draft.
   - A finding about one thing is offered as an analogy for another, framed as one, the way `series-2` does it ("The same machinery that invents a package invents a token"). A study of code models recommending packages is never a finding about agents describing a product.
   - A swipe line keeps its verbs: "answers confidently with what it found" does not become "invents".
   - When a fact's source has no URL, the sentence that states the fact names the source, with the authors when the source gives them ("In a 2025 USENIX Security study by Spracklen et al., nearly half (45%) ..."). When it has one, the URL goes in `sources`.
   - The idea's hooks, outline and per-network lines can say more than its facts. Check each one you will use against its fact line; where they differ, the fact line wins and the draft says only what the fact says.
3. Write the LinkedIn draft (`<idea-id>-li`), following `surfaces/linkedin.md`:
   - The format from the idea's LinkedIn line; `text` when it names none.
   - The hook the idea's LinkedIn line names, or the one marked `★ Recommended` when it names none, in lines 1 and 2, complete before the fold: about 210 characters show on desktop and 140 on mobile. Change its wording only to keep a rule or its fact line.
   - 900 to 1,500 characters for `text`, under 3,000 for every format. Follow the outline beat by beat: short paragraphs, one idea each, a blank line between them; a long sentence that carries the mechanism next to a short one that lands it, as the swipe files do.
   - Lists use "→", only for separate, real items; numbered lists only for real sequences.
   - The closing line is the outline's last beat: a concrete question the reader answers from their own work, or one action for this week. "Link in the comments." may follow it when the first comment holds a link. The hashtag line comes last.
   - Hashtags: 0 to 3 niche ones on the last line, plus the campaign's `required_hashtags_linkedin`. In `nagarro` mode at most two beside `#FluidicIntelligence` (`nagarro-overlay.md`); in `personal` mode never `#FluidicIntelligence`.
   - `first_comment`: the link inside a sentence that says what it is. With no link, it may give the full reference of a source the body names, as `series-2` does ("The study is Spracklen et al., ..."); otherwise leave it empty.
   - People: in `nagarro` mode, when the overlay asks for a tag, write `@Name` in the text where the person is named, as the author's own posts do (`ds-01`, `ds-15`), and pass the plain name to `--tags-people`. In `personal` mode nobody is tagged; a person the author thanks by name is written as a plain name.
4. Write the Instagram draft (`<idea-id>-ig`), following `surfaces/instagram.md` and `kit.md`:
   - The format from the idea's Instagram line: `image` or `carousel`.
   - The text on the card is the first hook, taken from the idea's visual idea. The caption's first 125 characters carry a second hook that promises a different angle on it, never a repeat; print them to check where the cut falls (step 6).
   - Build the caption around the card, not around the LinkedIn draft: it picks up the card's words and takes them where the card does not go, and it never follows the LinkedIn paragraphs in order.
   - Under 2,200 characters, and warmer and shorter than the LinkedIn draft, in the same voice: one short sentence per line, pairs of lines with a blank line between them, "→" for lists. Only a sentence that states a fact with its source runs longer. The caption stands alone: a reader who sees only Instagram gets the whole point and every fact's source.
   - No link. "Link in bio" at most, and only when there is a link the author can put there. Never "link in the comments": `first_comment` stays empty on Instagram.
   - Up to 5 hashtags on the last line, the campaign's Instagram tags included. People are plain names, also in `--tags-people`.
   - `visual_brief`: a paragraph a designer can build from. It names the kit family, and the card number only when `kit.md` states which card it is (its table gives ranges, so the family and the card's kind, such as "the struck-through card", is the usual answer); the background (petrol or off-white); the one lime accent and the words it marks; the on-image copy word for word; the type (Figtree for titles and body, IBM Plex Mono for artefacts); the chip. A carousel adds one line per slide.
   - `image_prompt`: one paragraph a person can paste into an image tool: the size, the kit's colours as hex values, the on-image copy, and what is forbidden (black, yellow, pink, photographic gradients, glows and blur). It never asks for a person; a card with a photo uses one the author supplies.
5. Write the X draft (`<idea-id>-x`), following `surfaces/x.md`:
   - The format from the idea's X line: `text`, one post of at most 280 characters, or `thread`, 4 to 8 posts of at most 280 characters each, separated by a line holding only `---` with a blank line on each side. A `text` post never holds a `---` line.
   - Build it around one sharp point from the idea, not around the LinkedIn outline: the first post makes the point, the others support it, and a thread never follows the LinkedIn paragraphs in order. One data point at a time: at most one figure in the whole draft unless the point needs two, and never more than one per post.
   - The first post stands alone: the hook the idea's X line names (the recommended one when it names none), plus one sentence that makes the point when the hook alone does not. It is worth reading if nobody opens the rest. No "1/", no "Thread" and no numbering on any post.
   - One idea per post, in a sentence or two, direct and in the first person. A fact keeps its source in the same post.
   - The last post ends with the closing line, then 0 or 1 hashtag. A link goes in `first_comment`, the reply, inside a sentence that says what it is; never in a post. With no link, `first_comment` stays empty.
6. The born-clean pass. Before saving, read each draft line by line against `ai-tells.md` and the surface's `## Checklist`, then count:
   - British English, and no em or en dash anywhere: the bodies, the title, the first comment, the visual brief and the image prompt (`check.py` does not read the last two). Ranges are written "900 to 1,500".
   - No banned word in any form, quoted lines included: `ds-07` says "three screens deep", so a line taken from it is paraphrased with its meaning kept. Never "screens" for products.
   - No banned pattern: "it's not X, it's Y" in any form ("that is not X, it is Y" too), "Here's the thing", the hedges, the vague claims ("a lot of", "studies show"). At most one question answered in the next line per draft; no stacked one-line fragments; a list of three only when there are exactly three real things.
   - Every figure (a percentage, an amount, a number with a thousands separator such as 19,000) has a source cue in its own sentence ("study", "found", "source", "according to", "report", "survey") unless the draft lists `sources`.
   - The Instagram caption never says "link in the comments", and no link appears in any body.
   - No absolute claim (`check.py` matches whole words): "guaranteed", "guarantee" and "guarantees" (except in "guarantee nothing", "guarantees nothing" and "no guarantee"), "100%", "#1", "proven to", "risk-free". "The only", "better than" and "instantly" pass the check and `brand-review` reads them in context: use them only where they are true.
   - The word "comment" followed within 60 characters by a word in capitals of three letters or more ("USENIX", "API") or by a quoted word reads as a gated giveaway: keep them apart.
   - Every number with its source in the same sentence or in `sources`; every fact on this run's fact list and said no more strongly than its line says it (step 2); no client, colleague, project, anecdote or result that is not on it.
   - An "I" sentence states only what the author said, wrote or did in a source on the fact list ("I wrote about this in design systems" for a swipe post). Never an Admission she did not make, such as "I have started treating ...".
   - The mode: in `personal`, nothing promoted (no offering, no nagarro.com/en/services, no `#FluidicIntelligence`, no "our services"), and a line taken from a `nagarro` swipe post comes without its promotion (`ds-07`'s "I wrote about what it takes to design for both", which points to a Nagarro article, or "Link in the comments" to an offering). In a neutral campaign, no Nagarro, FLO, talk, keynote, slides or "the room".
   - The closing line is a concrete question or one action for this week; never "Thoughts?" or "Agree?", a slogan or a generic positive ending.
   - Lengths: count each body with `python3 -c "import sys; print(len(open(sys.argv[1], encoding='utf-8').read().strip()))" <scratch file>`; print the caption's cut with `python3 -c "import sys; print(open(sys.argv[1], encoding='utf-8').read()[:125])" <scratch file>`; count each thread post on its own.
   - Read the three side by side. They share the idea, the facts and the closing intent. A sentence found word for word in two drafts, other than a quoted fact, is rewritten in the second for its network; so is a run of paraphrased sentences in the same order. The Instagram and X drafts each have their own order: when either walks through the LinkedIn paragraphs one by one, rebuild it from step 4 or step 5.
7. Save each draft.
   - Write the body with the Write tool to a scratch file outside the repository, one per surface: the session's scratchpad directory when it has one, otherwise a temporary directory. Never pass a body inline or through an unquoted heredoc, because quotes and apostrophes break the shell. Write the first comment, the visual brief and the image prompt to scratch files too, and pass each as `"$(cat <file>)"`.
   - Run `python3 scripts/new_post.py <idea-id>-<li|ig|x> --title "<title>" --surface <linkedin|instagram|x> --format <format> --mode <mode> --pillar <n> --parent <idea-id> [--campaign <slug>] [--date <YYYY-MM-DD>] [--first-comment "$(cat <file>)"] [--source <url>]... [--tags-people "<name>"]... [--visual-brief "$(cat <file>)"] [--image-prompt "$(cat <file>)"] --body-file <scratch file>`. The id is the first argument, not a flag. Leave out `--pillar` for a `theme` idea and `--parent` for a topic with no idea.
   - The title is the idea's title on all three drafts; the ids tell them apart. It holds no double quotes, `$` or backticks.
   - Pass `--source` once for each URL in the idea's `sources` that the draft relies on. Never look up or guess a URL.
   - A frontmatter string keeps a real line break: `"$(cat <file>)"` passes the file's lines and the file stores them as `\n`. A backslash and an `n` typed on the command line stay two literal characters, so never type them; a one-card brief and every prompt are one paragraph.
   - It prints `created <id>`. `exists <id> (use --force)` means a draft is already there: when this run did not save it, ask the author before overwriting, because she may have edited it. `<id>: <problem>` means nothing was written: fix what it names and run it again.
8. Run `python3 scripts/check.py <idea-id>-li <idea-id>-ig <idea-id>-x` (only the ids drafted). For each `<id>: <problem>` line, fix the scratch file, save that draft again with the same command plus `--force` (it prints `updated <id>` and keeps the TryPost link, status and created date; a draft that was scored loses its score, and an `in-review` one goes back to `draft`), and run the check again, until every id prints `ok <id>`. When a draft needs a third round, stop and read step 6 against the rule that keeps tripping before the next fix.
9. The Viva Engage draft, only when `viva` is among the surfaces. It is written from the LinkedIn draft, never from the idea alone: once `<idea-id>-li` prints `ok` in step 8, or when it already existed, follow `repurpose` (`marketeer/skills/repurpose/SKILL.md`, steps 1 to 6) with `<idea-id>-li` as the source and `viva` as the only target. Its step 1 runs `marketeer-context` with surface `viva`, so the block carries the internal rule. It saves `<idea-id>-viva` with `parent: <idea-id>-li`, `mode: nagarro`, the LinkedIn draft's pillar and campaign (never a neutral one) and its day at 10:00 Lisbon, and checks it until `check.py` prints `ok <idea-id>-viva`. Viva Engage posts go out on Tuesday and Thursday (`surfaces/viva-engage.md`, Timing): when the idea's day is another, say so in one line and keep the day the author gave. With no LinkedIn draft, saved or written in this run, write nothing for `viva` and say why.
10. Show the result: for each draft, the id and path, the body as saved, its character count (per post for a thread) and the first comment; for Instagram, the visual brief and the image prompt; then the facts used, each with its source; and the `ok` lines. Offer the next step in one line: "Score them with `/marketeer:score <idea-id>-li <idea-id>-ig <idea-id>-x`?", with `<idea-id>-viva` added when step 9 wrote it.

## Outputs

- `brands/me/content/<idea-id>-li.md`, `<idea-id>-ig.md` and `<idea-id>-x.md`: `type: post`, `status: draft`, `parent: <idea-id>`, the idea's mode, pillar and campaign, the surface and format, `scheduled_date` at the surface's time when `--date` was given, `first_comment`, `sources` and `tags_people`; on Instagram also `visual_brief` and `image_prompt`.
- When the author asked for `viva`: `brands/me/content/<idea-id>-viva.md`, `parent: <idea-id>-li`, `surface: viva`, `mode: nagarro`, the LinkedIn draft's pillar and campaign (never a neutral one), at 10:00 Lisbon on its day, `first_comment` and `tags_people` empty.
- Each prints `ok <id>` under `scripts/check.py`.
- Nothing else in the repository changes: the idea file keeps `status: idea`, and the scratch files live outside the repository.

## Rules

- Never show a draft that `check.py` rejects.
- Never add a fact the idea does not carry, and never stretch one. Facts come only from its `## Facts and sources` (or, with no idea, from the context block's Facts available and from the author in the session). Never an invented anecdote, number, result, quote, client or colleague. A share is never rounded up into "every time", and a study of one thing is an analogy for another, never a finding about it. A number without its source in the same sentence or in `sources` is removed, not softened.
- The three drafts share one idea and one closing intent, and each is written for its network, not a trimmed copy: LinkedIn carries the mechanism, Instagram is warmer and shorter and leans on the card, X makes one point per post.
- The Instagram caption never says "link in the comments", and its first comment stays empty.
- The X first post stands alone.
- The voice is `voice.md`'s card, and the two swipe files are the bar: a reframe or a moment on top, one mechanism with specifics, contained conviction, no hype.
- British English in every word, and no em or en dashes anywhere, the visual brief and the image prompt included.
- People: `@Name` only on LinkedIn in `nagarro` mode where the overlay asks for the tag; plain names everywhere else; `tags_people` always holds plain names.
- Viva Engage only on the author's word, and only from the LinkedIn draft: written to colleagues, with no hashtag, no pitch and no first comment (`surfaces/viva-engage.md`).
- Drafts stay `draft`. The author publishes by hand; the system never posts.

## Boundaries

- No scoring: `score` rates the drafts and moves a passing one to `in-review`.
- No editing pass on a draft the author has already worked on (that is `edit`), and no long form: articles, essays and Substack notes come from `write-longform`.
- No video or Reel scripts: `write-video-script` writes them.
- No sync: it never calls the TryPost API or `scripts/trypost_sync.py`.
- No dates beyond the optional `--date`: no week planning, which is `content-planner`'s.
- Writes only the drafts, through `scripts/new_post.py`, and edits no other file in `brands/me/`, the idea file included: The author edits the workspace by hand.

## Related

- `ideation`: saves the idea this skill drafts, with its hooks, outline, per-network note and facts.
- `score`: rates the three drafts this skill saves.
- `marketeer-context`: step 1; its block gives the voice rows, the swipe files, the rules for the mode and the facts.
- `marketeer/references/surfaces/linkedin.md`, `instagram.md`, `x.md` and `viva-engage.md`: the limits, structure, fields and checklist per network. `repurpose`: writes the Viva Engage draft in step 9. `marketeer/references/ai-tells.md` and `marketeer/references/hooks.md`: what never goes in, and how the first line works.
- `scripts/new_post.py` saves each draft and `scripts/check.py` checks it.
