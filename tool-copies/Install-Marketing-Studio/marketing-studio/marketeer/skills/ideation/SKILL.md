---
name: ideation
description: Turns one of the author's pillars, or a topic, into an idea Content Object with 3 to 5 angles that each rest on a named fact, 5 to 7 hooks for the chosen angle labelled with their hooks.md pattern and one marked ★ Recommended, an outline of 3 to 6 beats and a per-network note for LinkedIn, Instagram and X, saved as brands/me/content/<idea-id>.md and clean under scripts/check.py. Use when the author asks for "ideas for pillar 2", "give me angles", "hooks for" a topic, "what should I post about" or "outline this". Not for a finished draft (use write-social-post), not for rating a piece (use score), and not for planning the week or choosing dates (use content-planner, which may hand this skill a day, the networks and the reactive flag of a plan slot).
---

# ideation

Turns a pillar or a topic into one idea: the angles the author could take, the hooks and the outline for the one she picks, and a note per network. The idea is saved as a Content Object (`type: idea`, `status: idea`) that `write-social-post` drafts from, so its body follows the fixed template below. Paths are relative to the repository root.

## Inputs

In any order and wording (`pillar 1` is enough):

- A pillar number from 1 to 4, or a topic in a sentence. With a topic and no pillar, use the pillar whose definition in `brand-profile.md` fits it and say which in one line; a topic that fits none (the occasional authority theme, for one) runs as `theme` and is saved without `--pillar`. With neither, ask the author for a pillar with `AskUserQuestion`.
- A mode: `personal` (the default) or `nagarro`; `neutral` as `marketeer-context` reads it.
- A campaign slug. Its `mode` wins over the hint, as `marketeer-context` resolves it.
- An angle the author already chose. Step 3 still writes the other angles; step 4 is skipped.
- A fact the author gives in the session: a number, a moment, a result, a quote. It counts as a fact, recorded as `Source: The author, in the session of <date>`.
- A plan slot from `content-planner`: the day (YYYY-MM-DD), the networks and whether the slot is reactive, with the newest signals file. The idea is saved with them as given (step 8); the skill never picks a day of its own.

## Steps

1. Run `marketeer-context` (`/marketeer:marketeer-context`) with the pillar, the mode, the campaign when one is named, and the topic as the task sentence. Name no surface: an idea serves all three networks, or the networks a plan slot gives. Work from its block:
   - Audience: the `Reader:` row, which fills the template's Audience, and the "Keeps getting wrong" cell the angles speak to.
   - Pillar: the definition every angle has to fit, and the pillar's networks.
   - Voice: the four rows the hooks follow, and the two swipe files on the `Swipe:` line.
   - Hard rules and Mode: what the hooks, the outline and the notes may say.
   - Campaign: the `Sources:` URLs, when there is a campaign.
   - Facts available: the facts this idea may state, with the research facts of step 3.
   - Gaps: anything already marked "needs a fact from the author".
2. Read `marketeer/references/hooks.md` in full, then the two swipe files on the `Swipe:` line, in full. List the titles already in the workspace with `grep -h "^title:" brands/me/content/*.md`, so no angle repeats a piece the author already has; a title is often only a first line, so when one does not settle it, search the bodies for the angle's key phrase (`grep -il "<phrase>" brands/me/content/*.md`). When an angle in step 3 wants a fact the two swipe files do not hold, search the other files in `brands/me/swipe/` (`grep -il "<word>" brands/me/swipe/*.md`) before calling it missing.
3. Write 3 to 5 angles. An angle is a position the post argues, in one sentence, not a topic. Each one fits the pillar's definition, speaks to the reader's "Keeps getting wrong" cell, makes a different claim from the other angles and from the titles listed in step 2, and rests on at least one fact, each of which is one of:
   - a proof point from `brand-profile.md`, verbatim, with its source;
   - a `sources` URL of the campaign, for what the page says and nothing more;
   - a fact already published in `brands/me/swipe/`, as published, with the file and the source the post cites;
   - a fact from a file under `brands/me/research/`, when its line carries its own URL and the date read on the page, as that line states it (a cited source, spec §2.6); a line without both is not a fact;
   - a fact the author gave in this session;
   - or the words `needs a fact from the author: <what is missing>` when none of these holds it.

   Write each angle in the shape the template shows (the sentence, `Reader:`, `Fact:`, with two facts joined by "; ") and order them by the strength of their fact, strongest first. A fact is strong when it is specific (a number, a name, a date, a line the author published) and its source can be checked (a proof point with its source, a study or page named in full). A general observation from a swipe post is weaker. An angle that needs a fact from the author comes last.
4. Ask the author to pick an angle with `AskUserQuestion`, unless she named one. One question, "Which angle should this idea follow?", with the angles as options: each labelled in a few words, with the angle's sentence and its fact as the description. Put the strongest first and add "(Recommended)" to its label. The tool takes 2 to 4 options, so a fifth angle is named in the question text and the author picks it through the free-text answer.
   - When she picks an angle that needs a fact, ask her for the fact; when she has none, ask again without that angle.
   - When nobody can answer (`AskUserQuestion` is unavailable, or the author is not in the session), take the first angle that does not need a fact from the author, which is the one with the strongest fact, and say so on the `Chosen:` line.
5. Write 5 to 7 hooks for the chosen angle, each on its own "→" line that starts with its pattern name from `hooks.md`: Reframe, Question, Moment, Number with its source, List preview, Bold claim, Reader's pain, Before and after, or Admission.
   - Use at least three patterns, and try a Reframe first.
   - Keep each hook to one or two sentences and under about 210 characters, so it works above LinkedIn's "see more" and as the first post on X.
   - A number in a hook carries its source in the same sentence. A Moment or an Admission needs a fact the author published or gave.
   - Mark one hook `★ Recommended` at the end of its line, then a colon and a one-line reason that names the network or the fact it suits.
   - Run each hook past the `hooks.md` self-check and its "Never" list.
6. Write the outline: 3 to 6 beats, one "→" line each, saying what the post does at that point, not its copy. The first beat delivers what the recommended hook promises; one beat carries the chosen angle's fact with its source; the last beat is the closing line written out in full, a concrete question the reader answers from their own work or one action for this week (`voice.md`).
7. Write the per-network note, one line per network:
   - LinkedIn: the format from `marketeer/references/surfaces/linkedin.md` (`text`, `image`, `carousel-pdf`, `video` or `poll`) and the length (900 to 1,500 characters for `text`), with what carries the post.
   - Instagram: `image` or `carousel`, and the visual idea in one line naming a kit family from the context block's card families (a cover from 01 to 32, or A to G). Name a card number only when `kit.md` states which card it is; its table gives ranges, so the family alone is the usual answer.
   - X: `text` (one post) or `thread` (4 to 8 posts, say how many), with what the first post says.
   - When a network is not one of the pillar's networks, say so at the end of its line; `write-social-post` drafts it all the same. When a plan slot named the networks, say so at the end of the line of any network it left out.
8. Save the idea.
   - Fill the body template below and write it with the Write tool to a scratch file outside the repository: the session's scratchpad directory when it has one, otherwise a temporary directory. Never pass the body inline or through an unquoted heredoc: the hooks' quotes and apostrophes break the shell.
   - Choose the id: a kebab-case slug of the chosen angle's key words, in lowercase letters, digits and hyphens, at most 40 characters, with no date prefix. It does not start with `ds-` or `flo-` (the importers own those) and does not end in `-li`, `-ig` or `-x` (the drafts take `<idea-id>-li`, `<idea-id>-ig` and `<idea-id>-x`). Check that `brands/me/content/<idea-id>.md` does not exist yet.
   - The title is the chosen angle as a short plain statement, the same text as the template's first line, with no double quotes, `$` or backticks, because it goes on the command line.
   - Run `python3 scripts/new_idea.py <idea-id> --title "<title>" --mode <mode> [--pillar <n>] [--campaign <slug>] [--source <url>]... --body-file <scratch file>`. The id is the first argument, not a flag. Leave out `--pillar` for `theme`. Pass `--source` once for each URL behind a fact the idea uses: a campaign source, a research file's URL, or a URL a swipe post or the author gave. A fact whose source has no URL (a proof point, a study a post names) keeps its source in `## Facts and sources`; never look up or guess a URL. Leave out `--surface`. With a plan slot, add `--date <day> --surfaces <networks>` (comma-separated, no space, such as `linkedin,x`) and `--reactive` when the slot is reactive, exactly as `content-planner` gave them. Without one, leave out all three: the idea keeps the default three surfaces (linkedin, instagram, x) and no date.
   - It prints `created <idea-id>`. `exists <idea-id> (use --force)` means the id is taken: choose another, unless this run saved it. `<idea-id>: <problem>` means nothing was written: fix what it names and run it again.
9. Run `python3 scripts/check.py <idea-id>`. Until it prints `ok <idea-id>`, fix each line it names in the scratch file, save again with the same command plus `--force`, and run it again. It reads the title and the whole body, notes and facts included, so a banned word is a problem even inside a warning about it. What trips ideas most:
   - a banned word from `marketeer/references/ai-tells.md`, "screens" among them, even inside a quoted fact: paraphrase the fact and keep its meaning and its numbers;
   - an absolute claim, matched as whole words: "guaranteed", "100%", "proven to", or "#1" (write "angle 1");
   - a figure (30%, 50,000) with no source cue in its sentence: keep each figure on its fact line, which ends with `Source: <where>`, or name the source in the sentence that states it;
   - a vague claim ("a lot of", "many companies") or a hedge ("when it comes to");
   - an American spelling (a quoted line included), a dash, or anything in square brackets;
   - in `personal` mode, an offering named (AI-Ready Design Systems, AI Readiness Diagnostic), a nagarro.com/en/services link, #FluidicIntelligence or "our services": cite a swipe post by its path in `brands/me/swipe/`, never by the offering's name;
   - in a neutral campaign, Nagarro, FLO, a talk, a keynote, the room, or "slides" (write "cards" in the Instagram note).
10. Show the result: the id and the path, the chosen angle and who chose it, the recommended hook, the outline, and the `ok <idea-id>` line. Then offer the next step in one line: "Draft it for LinkedIn, Instagram and X with `/marketeer:write-social-post <idea-id>`?"

### The body template

```markdown
# <title>

Pillar: <n> · Audience: <row> · Mode: <mode>

## Angles

1. <the angle in one sentence>
   Reader: <who it serves, and what they keep getting wrong, in a few words>
   Fact: <the fact> (<where it comes from>)
2. <the next angle, in the same shape>

Chosen: <n>, <by the author | by the strongest fact, as the author was not in the session>

## Hooks

→ <Pattern>: "<hook>"
→ <Pattern>: "<hook>" ★ Recommended: <one-line reason>

## Outline

→ <beat>
→ <the closing line, written out>

## Per network

LinkedIn: <format>, <length>. <what carries it>
Instagram: <image | carousel>, family <letter and name>: <the visual idea in one line>
X: <text | thread of n posts>. <what the first post says>

## Facts and sources

→ <a fact the idea uses, as its source states it>. Source: <where it comes from>
```

- Every heading appears, in this order, spelt exactly so. `write-social-post` takes the hook from the `★ Recommended` line and may use only the facts under `## Facts and sources`.
- `Pillar:` is the number, or `theme`. `Audience:` is the first cell of the pillar's row in the Audiences table, as the context block's `Reader:` line gives it; pillar 4 names both its rows, joined with "and". `Mode:` adds ", neutral" in a neutral campaign.
- `## Facts and sources` has one line for every fact named in the angles, the hooks or the outline, the chosen angle's first, with its source: the proof point's `Source:`, the campaign URL, `brands/me/swipe/<file>.md` and what the post cites, the research file's source line (publisher, title, date, URL), or `The author, in the session of <date>`. Every number in the idea is on one of these lines.
- Hooks sit in straight double quotes; a quote inside a hook takes single quotes.

## Outputs

- `brands/me/content/<idea-id>.md`: `type: idea`, `status: idea`, `brand: hugo`, `author: hugo`, the mode, the pillar, the campaign, the source URLs and `surfaces: [linkedin, instagram, x]` (or the plan slot's networks, with its `scheduled_date` and `reactive: true` when given), with the body in the template's shape.
- The id, printed with the path and the `ok <idea-id>` line from `check.py`.
- Nothing else in the repository changes. The scratch file lives outside it.

## Rules

- Every angle names its fact and where it comes from, or says "needs a fact from the author" and what is missing. The chosen angle never rests on a missing fact.
- Facts come only from the context block's Facts available, from a research file line that carries its own URL and the date read on the page, or from the author in the session. Never an invented anecdote, number, result, quote, credential or client; never a number rounded, totalled or moved to a context its source did not measure. An angle may argue from a fact to a wider point, but the fact stays as its source states it: a study of invented packages is quoted as a study of packages, and is offered as an analogy, the way the post that cites it does. Keep the source's hedges and shares: "rarely" stays "rarely", and a share (45% came back every time) never becomes "every time" or "the same" in an angle, a hook, an outline beat or the title. A swipe fact is reused as published, paraphrased only to keep a banned word or an American spelling out (step 9).
- A proof point that names a client (the BMW Group project) is not named until the author says yes (`content-rules.md`, Confidentiality); client stories stay disguised.
- Hooks obey `voice.md` and `hooks.md`: no "humbled", "thrilled" or "excited to announce", no hype ("10x", "game-changer", "AI will replace", "the future is here"), no "Here's the thing", no "It's not X, it's Y", no question answered in the next line, no emoji, and no number without its source in the same sentence.
- British English in every word, and no em or en dashes anywhere: ranges are written "3 to 5".
- One idea per run. The author picks the angle; the skill picks only when she cannot be asked, and says so.

## Boundaries

- Does not draft a post, an article or a caption: `write-social-post` does, starting from this idea.
- Does not score: `score` does.
- Does not sync: it never calls the TryPost API or `scripts/trypost_sync.py`; `content-planner` pushes ideas to the board.
- Does not plan the week or choose a date, and never invents one: `--date`, `--surfaces` and `--reactive` carry only what a `content-planner` plan slot gives.
- Writes one file, through `scripts/new_idea.py`, and edits no other file in `brands/me/`: The author edits the workspace by hand.

## Related

- `marketeer-context`: step 1; its block gives the reader, the facts and the swipe files.
- `write-social-post`: drafts the idea as `<idea-id>-li`, `<idea-id>-ig` and `<idea-id>-x`.
- `score`: rates those drafts.
- `marketeer/references/hooks.md`: the nine patterns and the self-check. `marketeer/references/ai-tells.md`: what `check.py` rejects. `marketeer/references/surfaces/`: the formats the per-network note names.
- `scripts/new_idea.py` and `scripts/check.py`: the save and the check.
