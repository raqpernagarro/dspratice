---
name: write-video-script
description: Writes a Reel from one idea or post (brands/me/content/<id>.md), a 30 to 45 second vertical video for Instagram in the author's voice, as a script in the fixed format of reels.md (a hook in the first 3 seconds that never opens with I, two points at most, a close that asks a question or says Link in bio, then one line per cut), a caption that mirrors it and a visual brief from kit.md, saved as one draft Content Object <stem>-reel (format reel, the script in its script field, the caption as the body) that passes scripts/check.py before it is shown. Use when the author asks for a "Reel script", a "video script", "a 30 second version" or says "film this". Not for an Instagram caption without video, an image or a carousel (use write-social-post, or repurpose for a piece already written), not for scoring or reviewing the Reel (use score or brand-review), and never for filming, cutting or posting the video.
---

# write-video-script

Turns one idea, or one post, into a Reel the author can film: a script in the fixed format of `marketeer/references/reels.md`, a caption that mirrors it, and a visual brief a designer or the author can shoot from. All three go into one Content Object (`type: post`, `surface: instagram`, `format: reel`, `status: draft`), saved through `scripts/new_post.py`, and the caption passes `scripts/check.py` before the author sees it. Paths are relative to the repository root.

## Inputs

In any order and wording (`agents-fill-gaps-with-the-same-guess` is enough):

- A source id: the file name of `brands/me/content/<id>.md` without `.md`. Either a `type: idea` object that `ideation` saved, or a `type: post` (a LinkedIn post, an Instagram caption, an article). Its id gives the Reel's id by the stem rule in `marketeer/references/repurposing-matrix.md`: the source id without a trailing `-li`, `-ig`, `-x`, `-article` or `-essay`, plus `-reel`. So `<idea-id>` and `<idea-id>-li` both give `<idea-id>-reel`. With no source, offer `ideation` first: a Reel needs an idea and its facts.
- A date: `--date YYYY-MM-DD`, the day to publish. `new_post.py` sets 12:30 Lisbon on it, as for every Instagram post. Instagram carries one post a day, and the `-ig` sibling usually holds the source's day, so step 8 checks the day against every Instagram post before saving and moves the Reel to a free one. Without a date the Reel has no `scheduled_date`.
- Optionally, the two points the author wants, or "on camera" or "text cards only". Without them, step 3 picks the points and the cuts mix the author to camera with text cards.

## Steps

1. Run `marketeer-context` (`/marketeer:marketeer-context`) with the source's pillar, mode and campaign, surface `instagram` (so `kit.md` is read), and the source id as the task sentence. Work from its block, heading by heading: Audience (the reader the hook speaks to), Pillar (a `Note:` that Instagram is not one of the pillar's networks means write it all the same), Voice (the four rows and the two swipe files on the `Swipe:` line), Hard rules, Mode, Campaign (its Instagram hashtags and tags), Facts available, and Gaps.
2. Read, in full:
   - `marketeer/references/reels.md`: the limits, the hook, the two points, the script format, the caption and the fields. It governs this skill; where it seems to differ from `brands/me/content-rules.md`, `content-rules.md` wins.
   - `marketeer/references/surfaces/instagram.md` down to its `## Checklist`, which is what `check.py` runs on the caption; `marketeer/references/hooks.md`; `marketeer/references/ai-tells.md`; `brands/me/kit.md`.
   - The source. An idea: `pillar`, `mode`, `campaign`, `title` and `sources` in the frontmatter; in the body the `Chosen:` angle, the hooks with the one marked `★ Recommended`, the `## Outline`, the Instagram line under `## Per network`, and `## Facts and sources`. A post: its title, body, `first_comment` and `sources`, and, when it has a `parent`, that idea's `## Facts and sources`.
   - The siblings already written from the same stem (`ls brands/me/content/<stem>-*.md`), the `-ig` caption above all: they show the voice, and the Reel never reuses their sentences word for word, a fact's own wording apart.
   - The two swipe files on the `Swipe:` line; `brands/me/campaigns/<slug>.md` when there is a campaign; `brands/me/nagarro-overlay.md` in `nagarro` mode.

   Then write this run's fact list to a scratch file (step 8): one line per fact, with its source, copied from the idea's `## Facts and sources` (or, for a post with no parent, from the facts its body states with their sources). These are the only facts the Reel may state.
   - A fact keeps its figures, subject, scope and verbs as its source states them. A share stays a share: 45% that came back every time is "nearly half", never "every time" for the whole.
   - A study of one thing is offered as an analogy for another and said to be one ("Code has a measured example"), never as a finding about it.
   - A swipe line keeps its verbs: "answers confidently with what it found" does not become "invents".
   - A source with no URL is named in the sentence that states its fact; when it has one, the URL goes in `sources`.
3. Pick the one idea and the two points.
   - The idea: the chosen angle, or the post's main point, in one sentence. Everything in the Reel serves it.
   - The hook: start from the recommended hook, or the source's first line, and cut it for speech: one sentence of 7 or 8 words, said in about 3 seconds at the pace of step 4, with the point in its first words. It never opens with "I": open with "this", "you", a fact or a name (`reels.md`, The hook). A Moment or an Admission starts on what happened.
   - Two points, each one idea from the outline with one fact line behind it. A third point is a second Reel: name it in step 10, never squeeze it in.
   - The close: a question the viewer answers from their own work, or "Link in bio" when there is a link the author can put there (a URL in the source's `sources`). When the outline ends on an action, turn it into that question. Never a giveaway gated behind a comment.
4. Write the script, in the fixed format, to a scratch file:
   ```text
   HOOK (0 to 3 s): <spoken line> | on screen: <text>
   POINT 1 (3 to <t> s): <spoken line> | on screen: <text>
   POINT 2 (<t> to <t> s): <spoken line> | on screen: <text>
   CLOSE (<t> to <t> s): <spoken line> | on screen: <text>
   SHOTS:
   Cut 1, 0 to 3 s: <framing>; <on-screen text>; <kit colours>
   ```
   - Labels, order and the hook's `0 to 3 s` never change. The other times are real: count the spoken words of each line and allow about 2.5 words a second, a calm speaking pace, so the whole Reel holds 75 to 110 spoken words for 30 to 45 seconds. A year or a percentage counts as three words, the way it is said. Print the count from the repository root:
     ```bash
     python3 -c "import re, sys; L=[(m.group(1), len(m.group(2).split()) + 2 * len(re.findall(r'\b\d{4}\b|\d%', m.group(2)))) for m in re.finditer(r'^(HOOK|POINT 1|POINT 2|CLOSE) \([^)]*\): (.*?) \| on screen:', open(sys.argv[1], encoding='utf-8').read(), re.M)]; [print(k, n, 'words', round(n / 2.5, 1), 's') for k, n in L]; print('total', sum(n for _, n in L), 'words', round(sum(n for _, n in L) / 2.5, 1), 's')" <script file>
     ```
   - Spoken lines are full sentences written for the ear: The author's voice from the swipe files, a long sentence that carries the mechanism next to a short one that lands it. Each point is said in two or three sentences. Say each line aloud: a line that can be misheard is rewritten ("So what your product leaves unwritten ..." is heard as "So what?").
   - A figure is said with its source in the same spoken sentence ("A 2025 USENIX Security study found that 45% ..."). Its on-screen text carries the source too, in the same field, as `(source: <authors>, <venue> <year>)`, shown in IBM Plex Mono beneath the line as `Source: <authors>, <venue> <year>`.
   - On-screen text is one phrase per line, word for word what the viewer reads. It may be shorter than the spoken line, never a row of fragments ("No rules. No context. No chance.").
   - `SHOTS:` one line per cut, in order, with its times: the framing (The author to camera, chest up; her desk from above; a text card), the on-screen text named by its line ("the hook", "point 2's line", "the close's question") as the example in `reels.md` does, since the lines above already hold it word for word, the lime words ("the figure" for a number), and the kit colours. Only the author on camera or text cards: no stock footage, no generated people, no other person. Text sits on a petrol #1F434F band or card, or an off-white #F7F9FB one with petrol text, never straight over the footage; Figtree for words, IBM Plex Mono for a source or an artefact; one lime #C0E50A accent per cut, on petrol, marking the words that carry the line. Never black, yellow, pink, photographic gradients, glows or blur (`kit.md`). Keep the text inside the 9:16 safe zone.
   - The script ends at the last `SHOTS` line. The caption never goes in it.
5. Write the caption to a scratch file, following `reels.md` (The caption) and `surfaces/instagram.md`:
   - It mirrors the script: the spoken hook as its first line, so the hook sits inside the first 125 characters; then the two points; then the close, as the last line before the hashtags. No fact the script does not carry.
   - Short lines, one idea each, pairs of lines with a blank line between them, "→" for a list. Only a sentence that states a fact with its source runs longer. Write it fresh from the script, not from the `-ig` caption or the LinkedIn post: a sentence found word for word in a sibling is rewritten, unless it is a fact's own wording ("It answers confidently with what it found.").
   - Every fact carries its source in its own sentence, authors included ("In a 2025 USENIX Security study by Spracklen et al., 45% ..."), because a Reel has no footnotes.
   - Up to 5 hashtags on the last line, the campaign's Instagram tags included, and the `-ig` sibling's tags when there is one, so the idea's Instagram posts share them; never `#FluidicIntelligence` in `personal` mode. No link, and never "link in the comments"; "Link in bio" only as the close of step 3. The first comment stays empty. Under 2,200 characters.
6. Write the visual brief to a scratch file: one opening line (9:16 at 1080×1920, text inside the safe zone, Figtree and IBM Plex Mono, petrol and off-white with one lime accent per cut, the author on camera or text cards only, no music or sound named unless the author gives one), then one line per cut that matches `SHOTS:`: the cut and its times, the author on camera or a text card and its framing, the on-screen text word for word in single quotes, the band or card colour, the lime words, the type and weight (Figtree 500 for the line, IBM Plex Mono for a source). A figure and its `Source:` line go in one sentence of the brief, as they share one card. The author or a designer can shoot and cut from it without the script. No `image_prompt`: a Reel is filmed, and a prompt never asks for a person.
7. The born-clean pass. Read the script, the caption and the brief line by line against `ai-tells.md`, `reels.md` and the Instagram `## Checklist`; `check.py` reads only the caption, so the script and the brief are yours to check. Then count:
   - The first spoken word is not "I", and the caption's first word is not "I". Exactly two `POINT` lines.
   - No em or en dash in any of the three files, ranges included: `python3 -c "import sys; t=open(sys.argv[1],encoding='utf-8').read(); print(sys.argv[1], t.count(chr(0x2014)), t.count(chr(0x2013)))" <scratch file>` prints `0 0` for each.
   - British English, and no banned word in any form, in any of the three. Never "screens" for products; a line taken from `ds-07` ("three screens deep") is paraphrased. Run the checker's lists over the script and the brief from the repository root, `python3 -c "import sys; from evals.lib import checks as c; t=open(sys.argv[1], encoding='utf-8').read(); print(c.find_banned_words(t), c.find_banned_patterns(t), c.find_american_spellings(t), c.find_claim_flags(t), c.find_unsourced_numbers(t, False))" <file>`, and fix every hit but one: `'#1'` from a hex colour such as #1F434F is not a claim.
   - Every figure (a percentage, an amount, a number with a thousands separator) has its source in its own sentence, spoken and in the caption, and in Plex Mono on screen. `check.py` ends a sentence at a full stop followed by a space, and knows "et al.", so "by Spracklen et al., 45% ..." keeps its cue.
   - Every fact is on the step 2 list, said no more strongly than its line; no client, colleague, project, anecdote or result that is not on it. An "I" sentence states only what the author said, wrote or did in a source on the list.
   - The mode: in `personal`, nothing promoted; a line from a `nagarro` swipe post comes without its promotion. In a neutral campaign, no Nagarro, FLO, talk, keynote, slides or "the room".
   - The close is a question or "Link in bio"; never "Thoughts?", "Agree?", "Comment ..." or a slogan.
   - Lengths, printed: the spoken words per line and the running time; the script's characters, well under 2,000 so the TryPost note holds it (about 1,700 at most; shorten the `SHOTS` lines first) (`python3 -c "import sys; print(len(open(sys.argv[1], encoding='utf-8').read().strip()))" <script file>`); the caption's characters with the same line; the caption's cut with `python3 -c "import sys; print(open(sys.argv[1], encoding='utf-8').read()[:125])" <caption file>`.
8. Save the Reel.
   - Write the script, the caption, the visual brief and the fact list with the Write tool to scratch files outside the repository: the session's scratchpad directory when it has one, otherwise a temporary directory. Never pass any of them inline or through an unquoted heredoc, because quotes and apostrophes break the shell.
   - With a date, check that no other Instagram post holds that day: `grep -l "^surface: instagram" brands/me/content/*.md | xargs grep -h "^scheduled_date: <YYYY-MM-DD>"` prints nothing when the day is free. When it prints a line (the `-ig` sibling, a campaign post), take the next weekday after it for which the same command prints nothing, a Saturday or Sunday only when the author names it, and pass that day as `--date`. Step 10 names both days, the one the author gave and the one the Reel took, and why.
   - Run `python3 scripts/new_post.py <stem>-reel --title "<title>" --surface instagram --format reel --mode <mode> --pillar <n> --parent <source id> [--campaign <slug>] [--date <YYYY-MM-DD>] [--source <url>]... [--tags-people "<name>"]... --script "$(cat <script file>)" --visual-brief "$(cat <brief file>)" --body-file <caption file>`. The id is the first argument, not a flag. Leave out `--pillar` for a `theme` idea.
   - `"$(cat <file>)"` passes the file's line breaks and the frontmatter stores them as `\n`. A backslash and an `n` typed on the command line stay two literal characters, so never type them.
   - The title is the source's title (an idea's `title`, or the post's), with no double quotes, `$` or backticks. Pass `--source` once for each URL in the source's `sources` that the Reel relies on; never look up or guess a URL.
   - It prints `created <id>`. `exists <id> (use --force)` means a Reel is already there: when this run did not save it, ask the author before overwriting, because she may have edited it. `<id>: <problem>` means nothing was written: fix what it names and run it again.
9. Run `python3 scripts/check.py <stem>-reel`. For each `<id>: <problem>` line, fix the scratch file, save again with the same command plus `--force` (it prints `updated <id>`), and run the check again until it prints `ok <stem>-reel`. When a third round is needed, stop and read step 7 against the rule that keeps tripping before the next fix. Then confirm the script was stored with its line breaks: `python3 -c "import sys; from scripts.lib import content; m, _ = content.load(sys.argv[1]); print(m['format'], repr(m['script'].split(chr(10))[0]))" brands/me/content/<stem>-reel.md` prints `reel` and a first line that starts with `HOOK (0 to 3 s):`.
10. Show the result: the id and path; the day it is scheduled, and the day the author gave when step 8 moved it; the script as saved, with the spoken words and seconds per line and the total; the caption as saved, its character count and its first 125 characters; the visual brief; the facts used, each with its source; any point left for a second Reel; and the `ok` line. Offer the next step in one line: "Score it with `/marketeer:score <stem>-reel`, then `/marketeer:brand-review <stem>-reel`?"

## Outputs

- `brands/me/content/<stem>-reel.md`: `type: post`, `status: draft`, `surface: instagram`, `format: reel`, `parent: <source id>`, the source's mode, pillar and campaign, `scheduled_date` at 12:30 Lisbon on a day no other Instagram post holds, when `--date` was given, an empty `first_comment`, `sources` and `tags_people`; the caption as the body; `script` from the `HOOK` line to the last `SHOTS` line; `visual_brief`.
- It prints `ok <stem>-reel` under `scripts/check.py`.
- Nothing else in the repository changes: the source keeps its status, and the scratch files live outside the repository.

## Rules

- The Reel never opens with "I": not the spoken hook, not the caption's first line.
- One idea and two points at most. A third point is a second Reel.
- 30 to 45 seconds by the word count, 9:16, the hook spoken and on screen in the first 3 seconds.
- The script follows the fixed format line for line, and the caption is the body, never part of `script`.
- The close is a question the viewer answers from their own work, or "Link in bio" when there is a link to put there. Never a giveaway gated behind a comment, and never "link in the comments".
- No invented facts. Facts come only from the source's `## Facts and sources` (or, for a post with no parent, the facts its body states with their sources), each said no more strongly than there. Never an invented anecdote, number, result, quote, client or colleague. A share is never rounded up, and a study of one thing is an analogy for another, never a finding about it.
- Every figure carries its source in its own sentence: spoken, on screen and in the caption.
- Only the author on camera, or text cards in the kit's colours and type. No stock footage, no generated people, never black, yellow, pink, photographic gradients, glows or blur.
- British English in every word, and no em or en dashes anywhere: the script, the caption, the visual brief and the title.
- Never show a Reel whose caption `check.py` rejects.
- The Reel stays `draft`. The author films, cuts and publishes by hand; the system never posts.

## Boundaries

- Instagram Reels only: no TikTok, YouTube or LinkedIn video scripts.
- No filming, cutting, music or captions burned into the video: it writes what the author films.
- No caption for an image or a carousel: that is `write-social-post`, or `repurpose` for a piece already written.
- No scoring and no review: `score` rates the Reel and `brand-review` flags it.
- No sync: it never calls the TryPost API or `scripts/trypost_sync.py`. The next push shows the script as a `Script:` note on the draft.
- Writes only `<stem>-reel`, through `scripts/new_post.py`, and edits no other file in `brands/me/`, the source included.

## Related

- `marketeer-context`: step 1; its block gives the voice rows, the swipe files, the rules for the mode and the facts.
- `marketeer/references/reels.md`: the limits, the hook, the script format, the caption and the fields. `marketeer/references/surfaces/instagram.md`, `hooks.md`, `ai-tells.md` and `brands/me/kit.md`: the caption's rules, how the first line works, what never goes in, and the colours and type.
- `ideation` saves the idea; `write-social-post` drafts its LinkedIn, Instagram and X siblings; `repurpose` turns a written piece into children by the same stem rule.
- `score` and `brand-review`: rate and flag the Reel; `edit` tightens its caption and suggests changes to its script.
- `scripts/new_post.py` saves the Reel and `scripts/check.py` checks its caption.
