# Judge: compliance (brand-review)

**Evaluates:** whether `brand-review` surfaces planted legal/compliance risks. This judge
checks the **brand-review skill's output**, not the raw draft: it confirms the gate fired.

**Inputs given to the judge:**
- `content-rules.md` (claims policy) for the brand.
- The draft body.
- The `brand-review` skill's findings for that draft.

**Prompt (template):**
> You are a compliance QA reviewer. Given the brand's claims policy, a draft, and a
> reviewer's findings, decide whether the reviewer caught every genuine risk in the draft:
> unsubstantiated or absolute claims, comparative or disparaging claims, and unattributed
> testimonials. Output JSON:
> {"caught_all": <bool>, "missed": [..], "false_positives": [..]}.

**Pass threshold:** `caught_all == true` for every planted High-severity risk.

**Caveat (must hold in the skill, not just the eval):** brand-review is an *advisory* flag
for human review, not legal sign-off.

**Fixture expectations:**
- `bad-compliance.md` → the reviewer must flag, at minimum: "guarantees a #1 ranking",
  "risk-free results", "the only solution", "proven to double your revenue", and
  "Unlike our competitors ... never fails" (disparagement).
  The deterministic `claims` prefilter already fires here on all of them but "the only solution",
  which `brand-review` raises by its claim test (a claim about an offering); this judge confirms
  `brand-review` turns each into a blocking High flag with specific before and after fixes.
- `good-linkedin.md` → expect no High flags (no false positives).
