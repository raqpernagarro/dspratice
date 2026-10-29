---
name: use-design-system
description: Build or change UI with the Nagarro DS Starter Pack (Base UI React wrappers on semantic tokens). Use before writing any screen, component or style in this repo, so you pick the right components, props and tokens instead of guessing.
---

# Use the design system

Before you build or change UI in this repo:

1. Read `llms.txt` at the repo root. It indexes everything below.
2. Read `docs/ai/rules.md`: the do / don't rules. Follow them.
3. Look each component up in `docs/ai/components.md` before using it: when to use it, the import, the props (variant axes) with their allowed values and defaults, the states Base UI drives, the parts and the tokens.
4. For anything you style yourself (layout, gaps, custom surfaces), pick tokens from `docs/ai/tokens.md` by the job they describe. Never hard-code colors, sizes, spacing, radii, fonts or shadows.

These docs are generated from the component specs. If they seem wrong or stale, run `npm run ds:ai-docs` and read them again; to change a component, edit its `<slug>.spec.ts` (never a generated file), then run `npm run ds:generate` and `npm run ds:ai-docs`.

Before you finish, run `npm test` (every story, with accessibility checks).
