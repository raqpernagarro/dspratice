---
name: ds-session-recap
description: Use at the end of any session where an app is consuming a design system and agent mistakes were corrected. Captures what was fixed and generates a ready-to-use prompt for the agent in the design system repo. Triggers on phrases like "session recap", "what did we fix", "update the DS", "generate the DS prompt", "end of session", or "what should I tell the DS agent". Also trigger proactively when a session has involved correcting agent mistakes related to the design system.
---

# DS Session Recap

At the end of a working session in a consuming app, this skill does two things:

1. **Summarises what was fixed** — a plain-English list of mistakes and corrections from the session
2. **Outputs a ready-to-use prompt** — paste it into an agent session inside the design system repo to update the right documentation files

---

## Step 1 — Extract the fixes

Scan the conversation for:

- Any agent mistake that was corrected
- Any rule that was stated ("never do X", "always use Y")
- Any component misuse that was clarified
- Any layout, spacing, or structural correction
- Any token or import that was wrong

For each fix, capture:
- What the agent did wrong
- What the correct behaviour is
- Which component or pattern it relates to

---

## Step 2 — Output the recap

Present a short, clear summary:

```
## Session recap — [date]

### What was fixed
- [Mistake 1]: [what the agent did] → [what it should do instead]
- [Mistake 2]: [what the agent did] → [what it should do instead]
```

One line per fix. Factual, no fluff.

---

## Step 3 — Output the prompt

Output a single copyable block — ready to paste into an agent session in the design system repo:

```
Update the documentation in this repo based on the following fixes
from a session in a consuming app. For each fix, identify the correct
file to update (AI.md, AGENTS.md, or a spec file in specs/), add a
clear rule in the right section, and confirm what was changed.

Fixes to document:

1. [Fix 1 — one clear imperative rule]
2. [Fix 2 — one clear imperative rule]
...

Rules for updating docs:
- AI.md owns all rules for agents consuming the library
- AGENTS.md owns rules for agents building the library
- specs/ owns component-level "when to use" and "when not to use" logic
- One rule per bullet, imperative voice ("Never...", "Always...")
- Sentence case everywhere
- No pixel values or hex values in descriptions — intent only
- After updating, run the build command to rebuild the library
```

---

## What good output looks like

**Recap:**
```
## Session recap — 2026-05-18

### What was fixed
- Extra wrapper padding: agent wrapped page content in a padded div
  inside AppShell → AppShell provides its own padding, never add a wrapper
- Wrong icon import: agent imported lucide-react directly →
  icons are bundled inside the DS, never import them separately
```

**Prompt:**
```
Update the documentation in this repo based on the following fixes
from a session in a consuming app. For each fix, identify the correct
file to update (AI.md, AGENTS.md, or a spec file in specs/), add a
clear rule in the right section, and confirm what was changed.

Fixes to document:

1. Never add a wrapper div with padding inside AppShell's main area.
   AppShell provides its own padding — adding more causes double spacing.
2. Never import icons directly. They are bundled inside the DS library.

Rules for updating docs:
- AI.md owns all rules for agents consuming the library
- AGENTS.md owns rules for agents building the library
- specs/ owns component-level "when to use" and "when not to use" logic
- One rule per bullet, imperative voice ("Never...", "Always...")
- Sentence case everywhere
- No pixel values or hex values in descriptions — intent only
- After updating, run the build command to rebuild the library
```

---

## Key principles

- The output prompt must be self-contained — the DS agent has no context from the consuming app session
- Each fix must be written as a clear, actionable rule — not a description of what went wrong
- The recap is for the team; the prompt is for the agent
- Never include consuming app implementation details in the prompt — rules only
