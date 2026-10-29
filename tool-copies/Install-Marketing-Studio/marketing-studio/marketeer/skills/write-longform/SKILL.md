---
name: write-longform
description: Writes one idea as the author's long form from the idea object ideation saved (brands/me/content/<idea-id>.md), a LinkedIn article that teaches the method and a Substack essay that tells the stories behind it, sharing facts and never sentences, plus a Substack note that gives a reason to open the essay, saved as <idea-id>-article, <idea-id>-essay and <idea-id>-note drafts with the title, subtitle, SEO title and description, cover and a visual brief that specifies every image, each clean under scripts/check.py with its word count. Use when the author asks to "write the article", for "the Substack essay", "long-form", "the newsletter issue" or to "turn this idea into an article and an essay". Not for LinkedIn, Instagram or X posts (use write-social-post), not for the promo post that shares an article or a note for an essay already written (use repurpose), and not for scoring or reviewing a piece (use score or brand-review).
---

# write-longform

Turns one idea into the author's long form: a LinkedIn article that teaches the method, a Substack essay on the same topic that tells the stories behind it, and a Substack note that points to the essay. Each is saved through `scripts/new_post.py` as a Content Object (`type: post`, `status: draft`) and passes `scripts/check.py`, word counts included, before the author sees it. The rules for all three are in `marketeer/references/longform.md`, the author's FLO brief as the import applied it; this skill is the order of the work. Paths are relative to the repository root.

## Inputs

In any order and wording (`fabrication-rate-every-release` is enough):

- An idea id: the file name of `brands/me/content/<idea-id>.md` without `.md`, a `type: idea` object that `ideation` saved. With only a topic, offer `ideation` first: long form needs an idea's facts, and the three ids hang off its id.
- A date or a week. With a campaign whose `cadence` names the days (`flo-2026-talks` has `linkedin: tuesday` and `substack: thursday`), the article goes on that week's Tuesday and the essay and the note on its Thursday. Without a cadence, the article takes the date the author gives it, and the essay and the note the date she gives them, or none. `new_post.py` sets the time (Lisbon): the article 08:30, the essay and the note 09:00. Without a date the pieces have no `scheduled_date`.
- A mode (`personal` or `nagarro`) or a campaign slug. An override fills a value the idea leaves empty; when the idea has a value and the override differs, the idea's value wins: say so in one line.
- Facts the author gives in the session (a moment, a number, a result, a quote) and the newsletter's name when she gives it. Each is recorded as `Source: The author, in the session of <date>`.

## Steps

1. Run `marketeer-context` (`/marketeer:marketeer-context`) with the idea's pillar, mode and campaign, and the idea id as the task sentence. Name no surface, so `kit.md` is read for the image specs. Work from its block: the four Voice rows and the two swipe files on the `Swipe:` line, the Hard rules, the Mode rules (with the neutral rule when the campaign has `neutral: true`), the Campaign, Facts available and Gaps.
2. Read, in full:
   - the idea file: `pillar`, `mode`, `campaign` and `sources` in the frontmatter; in the body, the `Chosen:` angle, the hook marked `★ Recommended`, the `## Outline` and `## Facts and sources`. The `## Per network` lines are for posts and do not bind long form;
   - `marketeer/references/longform.md`, which sets every rule steps 4 to 7 follow, and `marketeer/references/surfaces/substack.md` down to its `## Checklist`;
   - from `marketeer/references/surfaces/linkedin.md`, the `article` row, the Closing line section and the `## Checklist`, which skips the link, hashtag and length rules for an article;
   - `marketeer/references/hooks.md`, because the article's lede and the essay's opening moment are hooks, and `marketeer/references/ai-tells.md`;
   - `brands/me/campaigns/<slug>.md` when the idea has a campaign, for `neutral` and `cadence`; `brands/me/nagarro-overlay.md` in `nagarro` mode;
   - `brands/me/content/flo-01-caring-more-article.md`, `-essay.md` and `-note.md`, for the shapes: the H1 line, the H2s, image lines with italic captions, footnotes, the markers, the sign-off and the P.S., the `## Sources` list. They were imported before `check.py` learned long form, so take their structure, not every line;
   - the two swipe files on the `Swipe:` line, and every swipe file a fact line in the idea names: the bar for rhythm, and the published wording of each fact and moment.
3. Write the shared facts list before a line of either piece, to a scratch file (step 8): one line per fact, `→ <the fact as its source states it> | Source: <where it comes from> | Use: article, essay or both`. Start from the idea's `## Facts and sources`; add only a fact from the context block's Facts available or one the author gives in the session.
   - Every number, name, quote, award and result in either piece has a line, and so does every moment the essay tells, because a story is a fact. A moment is what the author said, wrote or did, as a swipe post or the author states it ("A client asked me a question this year ...", `series-1`), with nothing added: no place, day, dialogue or feeling she did not give.
   - A fact keeps its figures, its subject, its scope and its verbs as the source states them; a share stays a share; a study of one thing is an analogy for another, framed as one, the way `series-2` does it. These are `write-social-post`'s rules (its step 2), and they bind long form the same way.
   - The source is what the piece will cite: a title, and a URL only where the idea or the swipe post gives one (never looked up or guessed); the swipe path and what the post cites; the proof point's `Source:`; or `The author, in the session of <date>`.
   - A proof point waits for the author only when it names a client, such as the BMW Group project (`marketeer-context`, Facts available); ask her before naming it. A Nagarro project in `brand-profile.md`, such as the RMS Design System, names no client and is used as written, with its date, its figures and its source. In a neutral campaign, client stories are disguised beyond recognition (`longform.md`, Neutral campaigns).
   - Anything the outline or the arc needs that no line holds is `→ needs a fact from the author: <what is missing>`, and the piece that needs it waits: ask the author. When she cannot be asked, leave that beat out and say so in step 10. Never fill it, and never write a placeholder.
   - Then judge the length. The article needs 1,000 to 1,400 words and the essay 1,800 to 2,500, and never padding or a new claim. The article's words come from the method: the facts explained. The essay's come from the stories, which are the moment lines on the list and the proof points; the method's explanations belong to the article (step 5). When the moments cannot carry 1,800 words, ask the author for more before drafting; when she cannot be asked, step 5 says what happens.
4. Write the article (`<idea-id>-article`: `surface: linkedin`, `format: article`), as `longform.md` sets out:
   - The title: specific and promise-led, under 70 characters, no clickbait. The body's first line is `# <title>`.
   - The lede: the first two lines show in the feed preview, so they carry the sharpest fact on the list, with its source named in the same sentence. Fact first: no scene, no throat-clearing.
   - An H2 every 200 to 300 words, one idea per section, built from the outline's beats and the facts. Paragraphs of 1 to 3 sentences; at most one bold phrase per section; "→" for lists, and numbered lists only for real sequences.
   - One practical tool the reader can use this week, in its own section: a checklist, a test or steps.
   - 3 or 4 inline images, each a line `![<alt>](images/<image-id>.png)` with an italic caption line under it (`*<caption>*`).
   - The closing line: a direct question the reader answers from their own work, the last line before the sources.
   - `## Sources`, spelt exactly so, as the last section: one "→" line per source, with its title and its URL when the list has one. `check.py` treats a body with this heading as sourced throughout, so check each figure against it yourself.
   - No Substack marker (`[SUBSCRIBE BUTTON]` is a placeholder on LinkedIn), no footnotes, no hashtags.
   - The fields: `seo_title`, 60 characters or fewer; `seo_description`, 150 to 160 characters; `cover`, `images/<idea-id>-li-cover.png` at 1920×1080; the visual brief (below).
5. Write the essay (`<idea-id>-essay`: `surface: substack`, `format: essay`), as `longform.md` sets out, from the fact list and not from the article:
   - The body's first line is `# <title>`; the `subtitle` is one sentence, the inbox preview.
   - Open on a scene or a moment from the fact list, never a thesis: the Moment pattern of `hooks.md`, with its "Fails when".
   - The arc: the scene, what it made the author notice, the stories, what she does now, what it means for the reader, under 3 to 5 H2s. Warmer and more in the first person than the article, in the same voice; the voice card and the banned words do not change.
   - "I" sentences state only what the author said, wrote or did on the fact list. What she does now is what she has published that she does or would do (`series-3`: "Which is why I would start there"), never a new habit.
   - The essay may name the article's fixes in one line, but it never re-teaches the article's tool, its steps or its examples. The stories draw on the full text of the published posts (each swipe file is a whole post, not one sentence: read it for the moment, the reaction and the line it ends on) and on the proof points.
   - When those stories cannot carry 1,800 words honestly, do not stretch them. Save the essay as it is in step 8, still `draft`, then add the label with the same body: `python3 scripts/set_body.py <idea-id>-essay --body-file <scratch file> --add-label needs-fact`. `check.py` will report the short count; step 10 lists the moments the author must supply.
   - One or two pull quotes, each on its own line as `> [PULL QUOTE] <the line>`: a line that stands on its own, written for the quote rather than copied from the paragraph beside it.
   - Sources as footnotes: `[^1]` in the sentence that states the fact, and the definitions at the very end as `[^1]: <title>: <URL>`, the URL only when the list has one.
   - `[SUBSCRIBE BUTTON]` on its own line about a third of the way in: at the section break nearest a third of the essay's word count (step 7 counts it), not after the opening section. The end, in this order: the last paragraph, `[SUBSCRIBE BUTTON]`, `[SHARE BUTTON]`, `The author`, a P.S. that asks readers to reply with one specific thing from their own work, then the footnote definitions.
   - 2 or 3 inline images at 1456×816, each with an italic caption line. The cover is the social preview, `images/<idea-id>-ss-preview.png` at 1456×1048.
   - The fields: `subtitle`, `seo_title` and `seo_description`, as for the article; the cover; the visual brief.
   - No hashtags. The newsletter's name and cadence are not settled: never write `[Newsletter name]` or `[cadence]`, which `check.py` flags. A sentence that needs the name waits until the author gives it, or is left out.
6. Write the note (`<idea-id>-note`: `surface: substack`, `format: note`): 2 to 4 sentences that give a reason to open the essay, or a standalone thought. It may echo the essay's opening moment, as the FLO notes do. Plain sentences: no heading, image, marker, link, hashtag or placeholder, and neither the newsletter's name nor its cadence. Its title is `Note: <essay title>`. Count its sentences yourself, because `check.py` sets no length for a note.
7. The pair script and the born-clean read, before saving.
   - The pair rule: no sentence of eight words or more appears in both the article and the essay. Run the pair script in `longform.md` on the two scratch files (a file without frontmatter is read as all body). It prints the shared sentences, or "no shared sentence". Rewrite each shared sentence in the essay for its own angle and run it again until it prints "no shared sentence".
   - The script sees whole sentences only, and two pieces drafted from one list share far more than that. List the six-word runs they have in common (scratch or saved files alike): `python3 -c "import re,sys; g=lambda p: (lambda w: {' '.join(w[i:i+6]) for i in range(len(w)-5)})(re.findall(r\"[a-z0-9'-]+\", open(p,encoding='utf-8').read().split('\n---\n',1)[-1].lower())); print('\n'.join(sorted(g(sys.argv[1]) & g(sys.argv[2]))))" <article file> <essay file>`. A run that holds a figure, a quoted rule, a citation or a proof point is a shared fact and stays. Any other run is a shared phrase: rewrite it in the essay in its own words.
   - Read each piece line by line against `ai-tells.md`, the surface's `## Checklist` and the born-clean list in `write-social-post`'s step 6 (dashes, banned words in every form, banned patterns, British spelling, absolute claims, gated giveaways, figures with their source, the mode and the neutral rule, the closing line).
   - The traps that long form adds. A figure (a percentage, an amount, a number with million, billion or thousand, or a thousands separator such as 19,000) in the essay needs its `[^n]`, or a cue word (study, report, survey, found, source, according), in its own sentence; `check.py` ends a sentence at a full stop and a space, a "!" or "?", or a line break, so a figure in a caption, an alt text or a pull quote needs its own cue. Square brackets hold only the markers (essay), footnotes, links and images: any other bracket is a placeholder. "Comment" followed within 60 characters by a word in capitals of three letters or more, or by a quoted word, reads as a gated giveaway, so the P.S. says "reply". Twenty paragraphs make a repeated device easy: one question answered in the next line per piece, no stacked fragments, no "not X, but Y" contrast.
   - `check.py` reads the title, the body and the first comment only. Check the subtitle, the SEO fields and the visual briefs yourself: no dash, British spelling, no banned word.
   - Count after the first draft, before polishing, because the essay tends to come in short: the stories on the list run to fewer words than the method, and the method is not the essay's to borrow. Count the words of the article and the essay as `check.py` does: `python3 -c "import sys; from evals.lib import checks; print(checks.count_words(open(sys.argv[1], encoding='utf-8').read()))" <scratch file>`. Count the SEO fields with `python3 -c "import sys; print(len(open(sys.argv[1], encoding='utf-8').read().strip()))" <scratch file>`.
8. Save the three pieces.
   - Write each body, each visual brief, the subtitle and the SEO fields to scratch files outside the repository, with the Write tool: the session's scratchpad directory when it has one, otherwise a temporary directory. Never pass a body inline or through an unquoted heredoc, because quotes and apostrophes break the shell. Pass each field as `"$(cat <file>)"`.
   - The article: `python3 scripts/new_post.py <idea-id>-article --title "<title>" --surface linkedin --format article --mode <mode> --pillar <n> --parent <idea-id> [--campaign <slug>] [--date <YYYY-MM-DD>] --seo-title "$(cat <file>)" --seo-description "$(cat <file>)" --cover images/<idea-id>-li-cover.png --visual-brief "$(cat <file>)" [--source <url>]... --body-file <scratch file>`.
   - The essay: the same with `<idea-id>-essay`, `--surface substack --format essay`, `--subtitle "$(cat <file>)"` and `--cover images/<idea-id>-ss-preview.png`.
   - The note: `python3 scripts/new_post.py <idea-id>-note --title "Note: <essay title>" --surface substack --format note --mode <mode> --pillar <n> --parent <idea-id>-essay [--campaign <slug>] [--date <YYYY-MM-DD>] --body-file <scratch file>`.
   - The id is the first argument, not a flag. Leave out `--pillar` for a `theme` idea. Titles hold no double quotes, `$` or backticks. Pass `--source` once for each URL on the fact list that the piece relies on, and never one looked up or guessed. On the essay, a non-empty `sources` makes `check.py` treat every figure as sourced, so each figure still needs its footnote.
   - Each command prints `created <id>`. `exists <id> (use --force)` means a piece is already there: when this run did not save it, ask the author before overwriting, because she may have edited it. `<id>: <problem>` means nothing was written: fix what it names and run it again.
9. Run `python3 scripts/check.py <idea-id>-article <idea-id>-essay <idea-id>-note`. For each `<id>: <problem>` line, fix the scratch file, save that piece again with the same command plus `--force`, and run the check again, until it prints three `ok` lines. An article out of range is fixed by explaining a fact on the list further, or by cutting. An essay that is short is fixed only with a story the author gives; without one it keeps the `needs-fact` label (step 5), and its word count is the one problem left. `--force` loses `labels_extra`, so after every `--force` save of a labelled essay add the label again with the same body: `python3 scripts/set_body.py <idea-id>-essay --body-file <scratch file> --add-label needs-fact`. Never a new fact or filler. When a piece needs a third round, stop and read step 7 against the rule that keeps tripping before the next fix. Then run the pair script and the word count from `longform.md` on the saved files, and keep both outputs for step 10.
10. Show the result: for each piece, the id and the path; the titles, the subtitle and the SEO fields with their character counts; the word counts of the article and the essay by `check.py`'s count; the note as saved; the two visual briefs; the facts used, each with its source and the pieces it appears in; any "needs a fact from the author" left out; for an essay labelled `needs-fact`, its word count and the moments the author must supply, each a question she can answer from her own work; the pair script's output; and the `check.py` lines. Offer the next step in one line: "Review them with `/marketeer:brand-review <idea-id>-article <idea-id>-essay <idea-id>-note`, then the promo post with `/marketeer:repurpose <idea-id>-article`?"

### The visual brief

`visual_brief` lists every image of a piece, the cover first, one line each, in the form `longform.md` gives: `<image-id>: <template> <size>, <what it shows>, alt: <alt text>`.

- Image ids: `<idea-id>-li-cover` and `<idea-id>-li-1` to `-li-4` for the article; `<idea-id>-ss-preview` and `<idea-id>-ss-1` to `-ss-3` for the essay. The body's image lines use the same ids, and the alt text in the brief is the alt text in the body.
- The template is one of the nine in `longform.md`, with its fields filled: a cover's kicker of 2 to 4 words and title of 9 words at most; a `stat`, `bars` or `quote` card's source line under its number or quote. Every text field is final copy in the author's voice.
- Sizes: the article's cover and inline images 1920×1080; the essay's social preview 1456×1048 and inline images 1456×816.
- `kit.md` holds: Figtree, IBM Plex Mono for artefacts, the petrol, off-white and lime palette, no stock photos, photos only the author's own.

## Outputs

- `brands/me/content/<idea-id>-article.md`: `surface: linkedin`, `format: article`, `parent: <idea-id>`, with `seo_title`, `seo_description`, `cover` and `visual_brief`.
- `brands/me/content/<idea-id>-essay.md`: `surface: substack`, `format: essay`, `parent: <idea-id>`, with `subtitle`, `seo_title`, `seo_description`, `cover` and `visual_brief`.
- `brands/me/content/<idea-id>-note.md`: `surface: substack`, `format: note`, `parent: <idea-id>-essay`, titled `Note: <essay title>`.
- Each is `type: post`, `status: draft`, with the idea's mode, pillar and campaign, `sources` as passed, and `scheduled_date` when a date was given. Each prints `ok <id>` under `scripts/check.py`; the article runs 1,000 to 1,400 words and the essay 1,800 to 2,500 by its count, unless the essay is labelled `needs-fact` and waits for the author's stories; the pair script prints "no shared sentence".
- Nothing else in the repository changes: the idea keeps `status: idea`, and the scratch files live outside the repository.

## Rules

- Never show a piece that `check.py` rejects, or a pair that shares a sentence of eight words or more. The one exception is an essay too short to tell its stories honestly: it is shown with the `needs-fact` label, its word count and the moments the author must supply.
- Facts only from the shared list. Never an invented anecdote, scene detail, number, result, quote, client or colleague, and never a fact stretched: a share is never rounded up, an analogy is never stated as a finding, a swipe line keeps its verbs. A number without its source in its sentence, a footnote or the `## Sources` list is removed, not softened.
- The article and the essay share the topic and the facts, never sentences. The article is the method and the essay the stories behind it: the essay names the article's fixes in one line at most and never re-teaches its tool, steps or examples. The note may echo the essay's opening.
- In a campaign with `neutral: true`, every piece stands alone (`longform.md`, Neutral campaigns): never Nagarro, FLO, a talk, a keynote, slides or "the room", nothing that assumes a stage, the employer never named, client stories disguised beyond recognition.
- In `personal` mode nothing is promoted: no offering, no nagarro.com/en/services, no `#FluidicIntelligence`, no "our services".
- British English in every word, and no em or en dashes anywhere: the titles, the bodies, the subtitle, the SEO fields and the visual briefs. Ranges are written "1,000 to 1,400".
- The newsletter's name and cadence stay out of every piece until the author fills them in. `[Newsletter name]` and `[cadence]` are placeholders the checker flags, so ask the author for the name before saving an essay or a note that mentions it.
- The voice is `voice.md`'s card; the swipe files are the bar for rhythm. Closing lines follow it: the article ends on a direct question from the reader's own work, the essay on its last paragraph and a P.S. that asks for a reply, never a slogan or a generic positive ending.
- Drafts stay `draft`. The author publishes by hand; the system never posts.

## Boundaries

- No posts for LinkedIn, Instagram or X: `write-social-post` writes them from the same idea.
- No promo post, no note for an essay written elsewhere, no children on other networks: `repurpose` writes them.
- No scoring (`score`), no compliance review or flags (`brand-review`), no editing pass on a piece the author has worked on (`edit`).
- No images: the visual brief specifies them, and the author builds them from `kit.md`.
- No sync: it never calls the TryPost API or `scripts/trypost_sync.py`. No week planning beyond the optional date.
- Writes only the three pieces, through `scripts/new_post.py`, and edits no other file in `brands/me/`, the idea file included.

## Related

- `ideation`: saves the idea this skill writes from, with its outline and facts.
- `marketeer-context`: step 1; its block gives the voice rows, the swipe files, the mode and the facts.
- `write-social-post`: the posts from the same idea, and the born-clean list step 7 reads.
- `repurpose`: the promo post that shares the article, and the other networks.
- `brand-review`, `edit` and `score`: the review, the sweeps and the score after drafting.
- `marketeer/references/longform.md`: the rules for the three pieces, the pair rule, the image spec and the word count. `marketeer/references/surfaces/substack.md` and `surfaces/linkedin.md`: the fields and the checklists. `marketeer/references/hooks.md` and `ai-tells.md`: the opening and what never goes in.
- `scripts/new_post.py` saves each piece and `scripts/check.py` checks it.
