# Quality harness

Proves the deterministic rules that guard the author's drafts do their job. Every fixture in `fixtures/drafts/` is a small piece with one planted defect (or none), and `fixtures/expectations.json` says which rule must catch it. The harness is green only when every planted defect is caught and every clean fixture passes.

## Run it

```bash
python3 evals/run.py        # every deterministic check, no dependencies, no LLM
python3 evals/run.py -v     # also print every message each fixture produced
```

Exit code `0` means every expectation was met. Exit code `1` means a planted defect slipped through, or a clean fixture was wrongly flagged. The last line is `RESULT: GREEN` or `RESULT: RED (<n> mismatch)`.

A fixture passes when every message the rules produce for it starts with one of its `fails` prefixes, and every `fails` prefix matches at least one message. An empty `fails` list passes only when no message is produced. The runner also checks that the six workspace files exist and that every campaign loads.

The same rules run on real pieces with `python3 scripts/check.py <id>`.

## The checks

Each check lives in `lib/checks.py` (composed by `run_all`) except the schema, which lives in `scripts/lib/content.py`.

| Check | Rule it enforces | Where the rule is written |
|---|---|---|
| Schema | Required frontmatter fields and allowed values for type, status, surface, format and mode | `scripts/lib/content.py` |
| Dashes | No em dash and no en dash anywhere, including ranges | `brands/me/content-rules.md`, Language |
| Banned words | Hype words, "I never say" words, "screens" for products, and the filler words kept from Marketeer | `content-rules.md`, Banned words; `voice.md`, I never say |
| Banned patterns | "It's not X, it's Y", "Here's the thing", "Let's dive in", hedges, vague claims, "Thoughts?" or "Agree?" as a closer | `content-rules.md`, Banned words and patterns; `voice.md`, I never say and Absence signals |
| Giveaways | Nothing gated behind a comment ("Comment KIT and I'll send the PDF") | `content-rules.md`, Banned words and patterns; `voice.md`, I never say |
| British spelling | en-GB in every form of a word: colour, optimising, organisation, behavioural | `content-rules.md`, Language |
| Placeholders | No bracketed placeholder such as `[article link]` left in the copy | Carried over from Marketeer's harness |
| Claim flags | Absolute, unsubstantiated or disparaging claims, matched as whole words, go to a human; softer phrases ("the only", "better than") are left to brand-review | `content-rules.md`, Numbers and sources; Marketeer's compliance prefilter |
| Figures | Every figure (a percentage, an amount, a number with a thousands separator) has a source cue in its sentence or a `Source:` label on its line, unless the piece fills `sources` or has a `## Sources` heading | `content-rules.md`, Numbers and sources |
| Word counts | A LinkedIn article runs 1,000 to 1,400 words and a Substack essay 1,800 to 2,500 | `content-rules.md`, Per-network notes |
| Links | No link in a LinkedIn, X or Instagram body (articles are exempt) | `content-rules.md`, Links |
| Hashtags | At the end, never inside a sentence; LinkedIn up to 3, Instagram up to 5, X up to 1; the hashtags a campaign requires | `content-rules.md`, Hashtags; `campaigns/<slug>.md` |
| Length | 3,000 characters on LinkedIn, 2,200 on Instagram, 280 per post on X, threads of 4 to 8 posts | `content-rules.md`, Per-network notes |
| Neutral campaigns | A neutral piece never mentions Nagarro, FLO, a talk, slides, a keynote or the room | `brands/me/nagarro-overlay.md`; `voice.md`, Two modes, one voice |
| Personal promotion | A personal piece may name Nagarro as a fact but never promotes an offering, its pages or its campaign hashtag | `nagarro-overlay.md`, When this applies |

## The fixtures

| Fixture | Planted defect | Expected prefix |
|---|---|---|
| `good-linkedin.md` | None: the swipe piece "The failure you cannot see" | none |
| `good-instagram.md` | None: a four-line caption ending "Link in bio." | none |
| `good-x-thread.md` | None: five posts under 280 characters | none |
| `bad-slop.md` | Filler words, a hedge and vague claims | `banned word`, `pattern` |
| `bad-offvoice.md` | Motivational and salesy, mechanically clean on purpose | none (judge case pending) |
| `bad-american.md` | American spellings | `spelling` |
| `bad-compliance.md` | Absolute claims and a swipe at competitors | `unsubstantiated`, `comparative` |
| `bad-dashes.md` | One em dash and one en dash in a range | `em dash`, `en dash` |
| `bad-banned-words.md` | Hype words in one sentence | `banned word` |
| `bad-giveaway.md` | A giveaway gated behind a comment | `comment-gated` |
| `bad-hashtags-linkedin.md` | Four hashtags on LinkedIn | `4 hashtags` |
| `bad-hashtags-instagram.md` | Six hashtags on Instagram | `6 hashtags` |
| `bad-hashtags-x.md` | Two hashtags on X | `2 hashtags` |
| `bad-link-linkedin.md` | A URL in the LinkedIn body | `link in body` |
| `bad-link-instagram.md` | A `www.` link in the Instagram caption | `link in body` |
| `bad-link-x.md` | A bare domain in the X post | `link in body` |
| `bad-neutral.md` | Names FLO, a talk, slides, Nagarro and the room in a neutral campaign | `neutral piece` |
| `bad-personal-promo.md` | A personal piece that promotes an offering and its page | `personal piece` |
| `bad-thread-too-long.md` | A thread post of 300 characters | `thread post` |
| `bad-placeholder.md` | `[article link]` left in the copy | `placeholder` |

`bad-offvoice.md` is deliberately clean for the deterministic rules. It exists to show why the LLM-as-judge layer is needed.

## What is wired later

LLM-as-judge cases live in `judges/` as rubrics. The runner lists them as `PENDING-LLM` until the skill they judge is built, then they run through `claude -p` at each slice gate.

## Layout

```
evals/
  run.py                    # the runner
  lib/checks.py             # the deterministic rules, composed by run_all
  fixtures/
    expectations.json       # fixture -> expected message prefixes, plus pending judge cases
    drafts/                 # the twenty fixtures, one Content Object each
  judges/                   # LLM-as-judge rubrics (voice-match, slop, compliance)
```

The runner reads the real workspace in `brands/me/` for the L0-lite checks and for the campaign a fixture names. It parses with `scripts/lib/frontmatter.py` and validates with `scripts/lib/content.py`.

## The regression rule

Every bug found while building becomes a new fixture here, so it can never silently return.
