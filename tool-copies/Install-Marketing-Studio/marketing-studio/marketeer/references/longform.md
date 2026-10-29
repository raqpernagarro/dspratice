# Long form: the LinkedIn article, the Substack essay and the note

The rules for the author's long-form pieces, from the FLO articles brief (The author's decisions, October 2026) as the Slice 0 import applied them to the three FLO topics. `content-rules.md` (Per-network notes) holds the short version and wins if anything here seems to differ. Read this with `voice.md`, `ai-tells.md`, `hooks.md`, `surfaces/linkedin.md` and `surfaces/substack.md`. The `flo-01-caring-more-article`, `-essay` and `-note` files in `brands/me/content/` show the shapes; they were imported before `check.py` learned long form and do not all pass it, so take their structure, not every line.

A long-form piece has no rubric score, so it reaches review through `brand-review`: `scripts/review.py` moves a `draft` article, essay or note to `in-review` when the review has no High flag and `check.py` prints `ok` for it, and a later High flag sends it back to `draft`.

## The LinkedIn article

`surface: linkedin`, `format: article`. Practical and scannable, built around the framework or the method.

- Length: 1,000 to 1,400 words, by `check.py`'s count (below).
- Title: specific and promise-led, under 70 characters, no clickbait. The body opens with it as an H1 line, as the imported articles do.
- `seo_title`: 60 characters or fewer. `seo_description`: 150 to 160 characters. LinkedIn's editor has a field for each.
- `cover`: the cover image at 1920×1080, built from the kit, as `images/<image-id>.png` (`--cover`).
- The lede: the first two lines show in the feed preview, so they carry the sharpest fact or tension. Fact first, no throat-clearing.
- An H2 every 200 to 300 words, one idea per section.
- Paragraphs of 1 to 3 sentences. At most one bold phrase per section. Lists use "→".
- One practical tool the reader can use this week: a checklist, a test or steps.
- 3 or 4 inline images, each a line `![alt](images/<image-id>.png)` with an italic caption line under it, such as `*KEEP follows the order of the work.*`.
- Close with a direct question to the reader, the last line before the Sources section.
- A short `## Sources` section at the end, with titles and URLs. Links are fine in the body of an article (`content-rules.md`).
- Timing: Tuesday by the FLO schedule, before 09:00 Lisbon (`PUBLISHING.md`); `new_post.py --date` sets 08:30. A promo post shares it on a later day (`repurposing-matrix.md`).

## The Substack essay

`surface: substack`, `format: essay`. A personal essay on the same topic as the article that tells the stories: warmer, and more in the first person.

- Length: 1,800 to 2,500 words, by `check.py`'s count.
- Title, and `subtitle`: one sentence, the inbox preview. The body opens with the title as an H1 line, as in the article.
- `seo_title` and `seo_description`.
- `cover`: the social preview at 1456×1048, as `images/<image-id>.png`.
- Open on a scene or a moment, never a thesis.
- The arc: the scene, what it made the author notice, the stories, what she does now, what it means for the reader.
- 3 to 5 H2s.
- One or two pull quotes, each on its own line as `> [PULL QUOTE] <the line>`.
- Sources as footnotes: `[^1]` in the sentence, and the definitions at the very end as `[^1]: <title>: <URL>`, with titles and URLs where known.
- `[SUBSCRIBE BUTTON]` on its own line about a third of the way in, and again at the end.
- `[SHARE BUTTON]` on its own line before the sign-off.
- The sign-off "The author" on its own line, then a P.S. that asks readers to reply with something specific from their own work. Replies help deliverability and start conversations (the FLO brief).
- 2 or 3 inline images at 1456×816, each with an italic caption line.
- The publication's name and cadence are not settled: the FLO material keeps them as placeholders. Never write [Newsletter name] or [cadence] into a piece, because `check.py` flags both; ask the author, or leave the sentence out.

The end of an essay, in order: the last paragraph, `[SUBSCRIBE BUTTON]`, `[SHARE BUTTON]`, `The author`, the P.S., the footnote definitions.

## The Substack note

`surface: substack`, `format: note`, `parent` the essay. 2 to 4 sentences that give a reason to open the essay, or a standalone thought (`content-rules.md`). No link: Substack attaches the essay. Titled "Note: <essay title>", as the import named them.

## The pair rule

- Same topic, different angle: the article is the method, the essay is the stories behind it.
- They share facts, never sentences: no sentence of eight words or more appears in both. Check the saved pair from the repository root; it prints the shared sentences, or "no shared sentence". The script is a quoted heredoc with no exclamation mark in it, so an interactive bash or zsh runs it as written:

```bash
python3 - brands/me/content/<id>-article.md brands/me/content/<id>-essay.md <<'EOF'
import re, sys
def sentences(path):
    body = open(path, encoding="utf-8").read().split("\n---\n", 1)[-1]
    parts = re.split(r"(?<=[.?\x21])\s+|\n", body)
    return {part.strip().lower() for part in parts if len(part.split()) >= 8}
shared = sorted(sentences(sys.argv[1]) & sentences(sys.argv[2]))
print("\n".join(shared) or "no shared sentence")
EOF
```

- Rewrite each shared sentence in the second piece for its own angle. The rule binds the article and the essay; the note may echo the essay's opening moment, as the FLO notes do.

## Neutral campaigns

When the campaign has `neutral: true`, as the FLO 2026 campaign does, every piece stands alone:

- Never Nagarro, FLO, a talk, a keynote, slides or "the room" (`check.py` catches these), and nothing else that assumes a stage: the conference, a presentation, a session, a workshop the author gave, a deck, an audience, "raise your hand". A line that assumes a stage becomes a question to the reader.
- Her employer is never named.
- Client stories are disguised beyond recognition: no domain, no solution, no client roles, no exact numbers tied to their project ("from weeks to hours").

## Images: the visual brief

`visual_brief` lists every image of the piece, the cover first, one line each:

`<image-id>: <template> <size>, <what it shows>, alt: <alt text>`

The `<image-id>` is the name the body uses in `images/<image-id>.png`; the FLO pieces use `t1-li-cover`, `t1-li-1`, `t1-ss-preview` and `t1-ss-1`. A line from the first FLO article, written in this form:

`t1-li-1: framework 1920×1080, the four parts of KEEP in the order of the work, alt: KEEP: Know, Encode, Explore, Polish, the four places where human judgment still matters, in the order of the work`

Sizes: the article's cover and inline images 1920×1080 (`PUBLISHING.md`); the essay's social preview 1456×1048 and inline images 1456×816; the promo card 1080×1350.

The nine templates, from the FLO brief:

| Template | Use | Fields |
|---|---|---|
| `cover` | LinkedIn cover 1920×1080, Substack preview 1456×1048 | kicker (2 to 4 words), title (9 words at most), optional photo, optional big number |
| `stat` | one or two big numbers | numbers and labels, source line |
| `bars` | 2 to 4 values compared | label and value each, unit, source line |
| `framework` | 3 to 5 named parts | letter or number, name and one line, for each |
| `compare` | a two-column table of 3 to 6 rows | column titles; a label, a left and a right per row |
| `steps` | a flow of 3 to 5 steps | name and one line, for each |
| `quote` | a pull-quote card | the quote (25 words at most), attribution or none |
| `checklist` | 4 to 8 checks | title, items |
| `promo` | the LinkedIn feed card 1080×1350 for the promo post | kicker, headline (10 words at most), sub line |

Every image follows `kit.md`: Figtree, with IBM Plex Mono for artefacts; petrol #1F434F, off-white #F7F9FB, one lime #C0E50A accent, cream, mist and pistachio for the pastels; never black, yellow, pink, photographic gradients, glows or blur. No stock photos: the only photos are the author's own (cutout, front, desk, wall, top). Every text field is final copy in the author's voice, and a number on an image carries its source line. `check.py` does not read `visual_brief`, so check it yourself for dashes and British spelling.

## Word count

`scripts/check.py` counts every word of the body except image lines, footnote definitions and button markers: it skips a line that starts with `![` or `[^`, and a line that holds nothing but a bracketed marker such as `[SUBSCRIBE BUTTON]`. Everything else counts: the H1 title, the headings, the captions, the pull quote lines, the Sources section, the sign-off and the P.S. To count a saved piece, from the repository root:

```bash
python3 -c "import sys; from evals.lib import checks; from scripts.lib import content; print(checks.count_words(content.load(sys.argv[1])[1]))" brands/me/content/<id>.md
```

## Numbers and sources

- Every number, client name, award or quote carries its source; a number without one is removed, not softened; an illustrative figure says it is one (`content-rules.md`).
- In an article, each figure's source is in its sentence or listed under `## Sources`. `check.py` treats a body with that heading as sourced throughout, so check each figure against the section yourself.
- In an essay, a `[^n]` in the figure's sentence is the source cue `check.py` reads, and the definition at the end gives the title and URL.
