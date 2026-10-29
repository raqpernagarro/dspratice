---
name: marketeer-context
description: Loads the author's brand context from the seeded brands/me/ workspace and prints one context block under eight fixed headings (Audience, Pillar, Voice, Hard rules, Mode, Campaign, Facts available, Gaps). Use when the author asks to "load the author's context", for "brand context", "what are the rules" or "which mode", and run this first before ideation, write-social-post or score, which all start from its block. Optional hints are a pillar number, a mode (personal by default, or nagarro), a campaign slug and a surface. It only reads, because the workspace already exists, so there is no interview and no file is written. Not for writing or scoring a piece (use ideation, write-social-post or score) and not for editing brand-profile.md, voice.md, content-rules.md or any other workspace file, which the author edits by hand.
---

# marketeer-context

Reads the author's seeded workspace in `brands/me/` and prints the context block that `ideation`, `write-social-post` and `score` start from. The block is a contract: the eight headings below, in this order, spelt exactly so, every time, even when a heading has nothing to report. Paths are relative to the repository root.

## Inputs

All optional, in any order and wording (`pillar 1, personal` is enough):

- A pillar: a number from 1 to 4, or `theme` for the occasional authority theme in `brand-profile.md`. With none, the block lists the four pillars.
- A mode: `personal` (the default) or `nagarro`. With no campaign named, the word `neutral` means `personal` plus the neutral rule.
- A campaign: its slug, which is the file name of `brands/me/campaigns/<slug>.md` without `.md`.
- A surface: `linkedin`, `instagram`, `x` or `viva` (Viva Engage, Nagarro colleagues only), with the format when the caller has one (`image`, `carousel`, `carousel-pdf`, `video`, `thread`). With none, the three public networks: `viva` is named only for a Viva Engage piece.
- The task in a sentence: the angle, topic or post id the calling skill is working on. It is used only to look for missing facts.

## Steps

1. Read these files from `brands/me/`, in this order. A missing file never stops the run: note it for Gaps and carry on.
   1. `brand-profile.md`: the audience sentence, the Audiences table, the Pillars and the Proof points.
   2. `voice.md`: the Voice card.
   3. `content-rules.md`: the mechanical rules behind Hard rules.
   4. `kit.md`, only when a visual is in play: the surface is `instagram`, no surface is named (the three surfaces include Instagram), or the format is `image`, `carousel`, `carousel-pdf` or `video`.
   5. `nagarro-overlay.md`, only when the mode is `nagarro` as step 2 resolves it (surface `viva`: always, whatever the campaign or the hint says): with a campaign named, its frontmatter `mode:` line decides (look at it now); otherwise the hint decides.
   6. `campaigns/<slug>.md`, when a campaign is named: the frontmatter keys `title`, `mode`, `goal`, `start`, `end`, `neutral`, `surfaces`, `required_hashtags_linkedin`, `tags_people` and `sources`, and the brief below the frontmatter.
   7. `playbook.md`.
   8. Two files from `swipe/` that match the mode. Each swipe file opens with header lines: `mode:` (`personal` or `nagarro`), then `source:`, then `title:` in some. Read the header lines and the first line of text after them in every file, and keep the files whose `mode:` equals the mode as step 2 resolves it (`personal` in a neutral piece). Of those, pick the two whose title and first line come nearest to the pillar's definition, or to the task when no pillar is named, and note in a few words why. When you cannot tell them apart, or there is neither pillar nor task, take the first two in alphabetical order. Read those two in full.
2. Resolve the mode.
   - A named campaign's `mode` wins over the hint; when they differ, the Mode heading says so.
   - With no campaign, the hint decides; with no hint, the mode is `personal`.
   - A campaign with `neutral: true` adds the neutral rule on top of its mode.
   - Surface `viva`: the mode is `nagarro`, over the campaign and the hint, because a Viva Engage piece is written inside the company (`surfaces/viva-engage.md`), and a campaign's neutral rule is dropped, since it is for public pieces. The Mode heading says so.
3. Print the context block: one fenced code block that follows the template below, with the eight headings in order. What goes under each heading is set out after the template.
4. Stop. Do not draft, suggest angles or write hooks. When another skill called this one, hand back to it with the block in the conversation.

### The template

```text
CONTEXT hugo · pillar <n | theme | none> · <mode>[, neutral] · campaign <slug | none> · surface <surface | all>

Audience
<the audience sentence, verbatim>
Reader: <first cell of the pillar's row in the Audiences table>
Keeps getting wrong: <second cell>
When they get it right: <third cell>

Pillar
<n>. <title>. <definition>
Networks: <the networks named at the end of the pillar line>

Voice
I open by: <row, verbatim>
My sentences: <row, verbatim>
I end by: <row, verbatim>
My tone: <row, verbatim>
Swipe: brands/me/swipe/<file>.md, brands/me/swipe/<file>.md (<why these two>)

Hard rules
→ <one rule per line>

Mode
<mode> (from campaign <slug> | from the hint | default)
→ <one rule per line>

Campaign
<slug>: <title>
Goal: <goal, verbatim>
Dates: <start> to <end>
Surfaces: <surfaces>
Required hashtags (LinkedIn): <required_hashtags_linkedin | none>
Tags: <tags_people | none>
Sources:
→ <one URL per line | none>
Brief: <the text below the frontmatter, verbatim>

Facts available
Proof points (brand-profile.md):
→ <proof point, verbatim, ending with its Source>
→ <one line per fact>

Gaps
→ <one gap per line | none>
```

### What goes under each heading

#### Audience

- The audience sentence from `brand-profile.md`, verbatim.
- The pillar's row of the Audiences table, its three cells verbatim, under the labels in the template. The pillar line's "For ..." sentence names the reader. Today the rows match as follows: pillars 1 and 3 take "Design and product people" (pillar 3 says "product and design leaders"); pillar 2 takes "Business leaders (CEOs, CTOs, heads of digital, Portugal and Europe)"; pillar 4 takes both "Talent the author might hire" and "Design and product people", printed one after the other; `theme` takes "Professionals building a presence". If the file no longer matches this, follow the file and add a Gaps line.
- With no pillar: `Reader: not set, no pillar named`.
- Surface `viva`: the row is "Nagarro colleagues", whatever the pillar, its three cells verbatim under the same labels, then `Note: on Viva Engage the reader is a colleague; the pillar sets the topic.`

#### Pillar

- The pillar's line from `brand-profile.md` without the bold markers and without its "For ..." sentence (the reader is under Audience): number, title, definition. Then `Networks:` with the networks that close the line.
- When the surface hint is not one of those networks, add `Note: <surface> is not one of this pillar's networks in brand-profile.md; write it for that network all the same.` For `viva` the note reads `Note: viva is no pillar's network; it is a child of that day's LinkedIn piece, on Tuesday and Thursday (planning.md, Viva Engage).`
- `theme`: the "occasional theme" sentence, verbatim, and `Networks: not set`.
- With no pillar: the four pillars, one line each, as `<n>. <title> (<networks>)`.

#### Voice

- The four voice card rows "I open by", "My sentences", "I end by" and "My tone", verbatim.
- `Swipe:` the two files picked in step 1, as paths, with the reason in parentheses. They are the bar for rhythm, length and openings; the calling skills read them.
- When `playbook.md` has entries: `Playbook:` with at most three of them that bear on the pillar or the surface, verbatim. When it has none, say nothing here; Gaps reports it.
- Surface `viva`: add `Viva Engage voice: The author's posts for the FLO talks in ~/Claude/Flo-2026-Presentations/_share/SHARE-MESSAGES.md (outside the repository; the voice only, never a source of facts)`, as `surfaces/viva-engage.md` (What works for the author) names them.

#### Hard rules

Take them from `content-rules.md` and `voice.md`. The lines below are today's wording; if a file now says something different, print what the file says and add a Gaps line.

```text
→ British English (en-GB): colour, optimise, licence, organisation. Never Portuguese.
→ No em or en dashes anywhere, ranges included: write "0 to 3".
→ Hashtags only at the end, never inside a sentence: LinkedIn 0 to 3 plus any the campaign requires, Instagram up to 5, X 0 to 1.
→ Links: LinkedIn in the first comment (the body may say "Link in the comments."), X in a reply, Instagram "Link in bio" at most.
→ Closing line: a concrete question the reader answers from their own work, or one action for this week; thanks by name on event posts. Never "Thoughts?" or "Agree?".
→ Every number, client name, award or quote carries its source; a number without one is removed.
→ No giveaway gated behind a comment ("Comment GUIDE and I'll send it").
→ Never "screens" for products: say features, flows, products.
→ In stories and examples: no client, colleague or project names, and nothing that points to them; client work disguised beyond recognition. Tags the overlay or the campaign sets, and thanks to hosts and speakers by name, are not stories.
```

When `kit.md` was read, add two lines from it, on the same terms (today's wording; the file wins):

```text
→ Visual (kit.md): cards 1080×1350 (4:5); Figtree for titles and body, IBM Plex Mono for artefacts; petrol #1F434F, off-white #F7F9FB, one lime #C0E50A accent per card, grey-blue #A6BAC7, cream #F1F3EA; never black, yellow, pink, photographic gradients, glows or blur; photos only of the author, or of the person the post is about; no stock.
→ Card families (kit.md): Covers per post 01 to 32 (except 08, 21, 24, 25), A Carousel interior 33 to 38, B Before / after 39 to 42, C the author's face 43 to 45, D Data 46 to 49, E Artefacts as image 50 to 54, F Typographic 55 to 59, G Patterns 60 to 62.
```

#### Mode

First line: the resolved mode and where it came from. When a campaign overrode the hint, add `Note: the hint said <hint>; the campaign's mode wins.` Then the rules for that mode:

- `personal`:
  ```text
  → the author's own voice and views. Nagarro may be named as a fact (her employer, an event she attended), never promoted.
  → Never in a personal piece: AI-Ready Design Systems, AI Readiness Diagnostic, a nagarro.com/en/services link, #FluidicIntelligence, "Nagarro offers" or "our services".
  → Client stories fully disguised.
  ```
- `nagarro`, from `nagarro-overlay.md`:
  ```text
  → nagarro-overlay.md applies: Nagarro may be named and promoted, in a practical, outcome-led, human-centric frame; never commodity IT, consulting language or AI hype.
  → Offerings: <each offering with its public page, as the overlay lists them>.
  → Campaign hashtag: <the overlay's Campaign hashtags line>.
  → Tagging: <the overlay's Tagging lines, joined>.
  → Never: client names from Nagarro's work, competitor comparisons.
  ```
- Internal, for surface `viva`, in place of the overlay's Offerings, Campaign hashtag and Tagging lines. Its Never line stays, and its first line drops the promotion, since nothing is pitched inside the company:
  ```text
  → nagarro-overlay.md applies: Nagarro may be named, in a practical, outcome-led, human-centric frame; never commodity IT, consulting language or AI hype.
  → Internal (Viva Engage, Nagarro colleagues only): a field note written as the author to people who share the company: what we learned on the work, a tool or checklist they can use this week, the story behind a decision, a question for Nagarro's design community.
  → The overlay's promotion rules do not apply inside the company: no campaign hashtag, no tags, no offering pitched, no "Nagarro offers". An offering may be named as a fact, or its internal page linked as a resource.
  → Client confidentiality, no hype, British English and no dashes apply as everywhere: the lesson, never the client.
  → No hashtags. Links inline, in the sentence that says what they are, internal pages included; no first comment.
  → Close with a question colleagues answer from their own projects, or an ask for their examples.
  ```
- Neutral, added to the mode when the campaign has `neutral: true`, or when no campaign is named and the hint said `neutral`:
  ```text
  → Neutral: never mention Nagarro, FLO, a talk, a keynote, slides or the room, in the title, body or first comment. Client stories fully disguised.
  ```

#### Campaign

- With a campaign: the lines in the template, from the campaign file. `required_hashtags_linkedin`, `tags_people` and `sources` print `none` when the key is missing or the list is empty.
- When today's date is outside `start` to `end`, add `Note: today (<date>) is outside the campaign's dates.`
- When the surface hint is not in the campaign's `surfaces`, add `Note: <surface> is not one of this campaign's surfaces.` For `viva` the note reads `Note: viva is no campaign's surface; the piece carries its LinkedIn source's campaign for grouping only, without its hashtags or tags, and never a neutral one.`
- With no campaign: `none named (campaign files: <the slugs in brands/me/campaigns/>)`. List the folder; do not read the files.
- With an unknown slug: `<slug>: no file at brands/me/campaigns/<slug>.md (campaign files: <slugs>)`, and a Gaps line.

#### Facts available

What a draft may state as fact, and nothing else:

- `Proof points (brand-profile.md):` then each proof point verbatim on its own line, ending with its `Source:` as written. Never shortened, merged, rounded or recomputed.
- After a proof point, a note in parentheses on the next line when the rules limit it:
  - In a neutral piece, a proof point that names Nagarro, FLO or a talk: `(neutral: leave out Nagarro, FLO and the talks; use only what still stands without them)`.
  - A proof point that names a company the work was done for as a client, such as the BMW Group: `(names a client: ask the author before naming it; content-rules.md, Confidentiality)`.
- In `nagarro` mode: `Approved claims (nagarro-overlay.md):` then each claim verbatim with its source.
- With a campaign: `→ Campaign sources: the URLs under Campaign. A fact from them is what the page says, quoted and never extended.` When the campaign's `sources` is empty: `→ Campaign sources: none`.
- Always these two closing lines:
  ```text
  → Swipe: a fact already published in brands/me/swipe/ may be reused as published, with the source the post cites.
  → Anything else needs a fact from the author.
  ```

#### Gaps

One line per gap, `none` when there is none. A gap is any of these:

- A missing file: `brands/me/<file> is missing`.
- An empty playbook (nothing beyond its heading and the note that the `learn` mode fills it): `playbook.md is empty until content-planner learn fills it; the swipe files are the bar.`
- Fewer than two swipe files in the mode: `only <n> swipe file(s) in <mode> mode`.
- A file that no longer matches this skill (an audience row, a hard rule, a kit line), or a copied line that held a dash (see Rules).
- The task names a number, client, award, quote or result that is not under Facts available: `needs a fact from the author: <what is missing>`.

## Outputs

- The context block, printed once in the conversation.
- No file is written, created or changed: `git status --short` reads the same before and after a run.

## Rules

- Read-only. Never create, edit, move or delete a file, in `brands/me/` or anywhere else.
- Copy the audience sentence, the audience row, the voice card rows, the campaign goal and brief, the proof points and the approved claims verbatim.
- Never summarise a proof point into a new number: no rounding, no totals, no percentages worked out, no "about" added or dropped, no two proof points merged into one claim.
- Never fill a gap with a guess. A fact that is not in the files is a Gaps line, never a line under Facts available.
- The eight headings always appear, in this order, spelt exactly: Audience, Pillar, Voice, Hard rules, Mode, Campaign, Facts available, Gaps. A heading with nothing to report prints `none`, or `not available: <file> is missing`.
- Keep each heading to a few lines. Hard rules and Facts available may run longer, one line per rule or fact.
- British English in every word the skill writes. Lines copied verbatim from the author's files stay as they are, apart from dashes.
- No em or en dashes in anything printed. If a line copied from a file holds one, print "to" in its place for a range and a comma otherwise, and add a Gaps line naming the file and the line so the author can fix the source.

## Boundaries

- No interview and no brand creation: the workspace already exists. If `brands/me/` itself is missing, every heading prints `not available: brands/me/ is missing` and the run stops.
- No writing: no drafts, angles, hooks, idea files or Content Objects. Those belong to `ideation` and `write-social-post`.
- No scoring. That belongs to `score`.
- No TryPost: the skill never calls the TryPost API or `scripts/trypost_sync.py`, and it runs no script at all.
- No edits to the workspace files. The author edits them by hand.

## Related

- `ideation`, `write-social-post` and `score`: each starts by running this skill with its pillar, mode, campaign and surface, and works from the block.
- `marketeer/references/surfaces/` (`linkedin.md`, `instagram.md`, `x.md`, `substack.md`, `viva-engage.md`): the per-network detail behind the hard rules and the internal rule. The calling skills read them; this one does not.
- `marketeer/references/ai-tells.md` and `marketeer/references/hooks.md`: read by the calling skills.
- `brands/me/`: the files this skill reads.
