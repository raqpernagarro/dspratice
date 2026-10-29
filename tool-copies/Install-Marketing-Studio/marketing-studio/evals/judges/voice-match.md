# Judge: voice-match

**Evaluates:** whether a generated `post` obeys the active brand's `voice.md`, including its
**absence signals** (what the voice never does).

**Inputs given to the judge:**
- `voice.md` and `content-rules.md` for the brand.
- The draft body.

**Prompt (template):**
> You are a brand voice auditor. Below is a brand's voice profile and a draft.
> Score how well the draft matches the voice on a 1 to 5 scale, where 5 = indistinguishable
> from the brand's own best writing and 1 = clearly off-brand.
> Penalize every violation of an "absence signal" (e.g., uses an exclamation mark, emoji,
> a forbidden hype word, or an em dash when the voice forbids it). List each violation.
> Output JSON: {"score": <1-5>, "violations": [..], "reason": "<one sentence>"}.

**Pass threshold:** score ≥ 4 AND zero absence-signal violations.

**Fixture expectations:**
- `good-linkedin.md` → expect score ≥ 4, no violations.
- `bad-offvoice.md` → expect score ≤ 2, violations include the forbidden hype words
  ("revolutionary", "game-changing", "transform", "exciting") and the salesy, non-peer tone.
  This is the case the deterministic layer cannot catch: it is the reason this judge exists.
