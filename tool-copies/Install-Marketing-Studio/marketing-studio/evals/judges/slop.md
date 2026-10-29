# Judge: slop

**Evaluates:** whether a draft reads as edited human writing rather than unedited AI output.
It is the qualitative complement to the deterministic `ai_tells` word check.

**Inputs given to the judge:**
- `ai-tells.md` (the detection checklist).
- The draft body.

**Prompt (template):**
> You are a ruthless content editor. Rate how human and edited this draft reads on a 1 to 5
> scale (5 = a sharp human wrote and edited it; 1 = obvious unedited AI). Consider: filler
> words, hedging chains, uniform sentence rhythm, vague unsupported claims, and formulaic
> structure. Output JSON: {"score": <1-5>, "tells": [..], "reason": "<one sentence>"}.

**Pass threshold:** score ≥ 4.

**Fixture expectations:**
- `good-linkedin.md` → expect score ≥ 4, few or no tells.
- `bad-slop.md` → expect score ≤ 2 with several named tells. The deterministic check already
  fails this fixture; this judge confirms the *qualitative* read agrees, which is the signal
  `score`'s publish-readiness dimension relies on.
