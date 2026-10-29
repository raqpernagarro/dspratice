# LLM-as-judge rubrics

Each `.md` here defines one judge: the inputs it reads, the rubric it scores against, the
output shape, and the **pass threshold**. They are wired to run (via `claude -p` or the
skill-creator eval methodology) once the skill they evaluate exists; until then the runner
lists their cases as `PENDING-LLM`.

To reduce non-determinism, run each judge **3×** and require a **majority** at or above the
threshold.

| Judge | Evaluates | Threshold |
|---|---|---|
| [voice-match.md](voice-match.md) | does a draft obey the brand's `voice.md` (incl. absence signals)? | ≥ 4/5 |
| [slop.md](slop.md) | does the draft read as edited human writing, not AI mush? | ≥ 4/5 |
| [compliance.md](compliance.md) | does `brand-review` flag planted legal/compliance risks? | catches all planted High flags |
| hook-strength.md | is the opening line a real scroll-stopper per `hooks.md`? | ≥ 3/5 |
| scorer-discrimination.md | does `score` rank `good-linkedin` above `bad-slop`? | strict ordering holds |

`hook-strength.md` and `scorer-discrimination.md` follow the same template as the three
rubrics provided here; add them when `ideation`/`score` are built.
