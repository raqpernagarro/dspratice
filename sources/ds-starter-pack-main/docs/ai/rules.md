<!-- Generated from the specs by `npm run ds:ai-docs`. Do not edit. -->

# Rules for AI agents

Short rules for building UI with this design system. Details: [components.md](components.md) (what to use, props, parts) and [tokens.md](tokens.md) (token vocabulary).

## Build UI

Do:

- Pick components from [components.md](components.md) by their **Use it** / **Don't** notes. Check the catalog before writing a new one: there are 49.
- Import the wrappers from `stories/base-ui/components/<folder>/<Name>.tsx` (e.g. `import { Button } from 'stories/base-ui/components/button/Button'`). They add the design system's classes, data attributes and tokens to Base UI.
- Set variants with the props listed under **Props (variant axes)**: `variant`, `size`, `destructive`…. Leave states (hover, focus, checked, open, invalid) to Base UI: pass `disabled`, `checked` / `defaultChecked`, `value` / `defaultValue`, Field `invalid`.
- Wrap form controls in `Field` for label, description and error. Groups (`Field`, `Fieldset`, `RadioGroup`, `CheckboxGroup`, `Tabs.Root`) pass their `size` to the controls inside.
- Give icon-only actions an `IconButton` with a `label`. Icons come from `@phosphor-icons/react` with `weight="fill"` (Check, Minus, Plus and X: `weight="bold"`).
- Style your own layout (page grids, gaps between components, custom surfaces) with semantic tokens: `var(--space-md)`, `var(--color-background-neutral-secondary)`, `var(--shape-radius-md)`.
- Load `stories/base-ui/tokens/figma-semantic.css` once; put `class="theme-scope" data-appearance="light"` (or `"dark"`, plus an optional `data-brand`) on `<html>`.

Don't:

- Don't render raw Base UI parts (`@base-ui/react/*`) with ad-hoc classes or styles when a wrapper exists. Use unstyled Base UI directly only for the utilities (mergeProps, useRender, Direction Provider, CSP Provider).
- Don't hard-code colors, sizes, spacing, radii, fonts, shadows or durations (`#fff`, `12px`, `rgba(…)`, `300ms`). Use a semantic token; if none fits, ask for one.
- Don't use primitives (`scale/*`, `opacity/*`, `colors/*`) or the legacy `--ds-*` variables in new code.
- Don't restyle a component through `className` or `style`. A different look is a variant (a prop), a theme override (configurator) or a spec change.
- Don't set `data-*` state attributes or `data-preview-state` yourself: they are for static previews in docs.
- Don't use `*Preview` exports in product UI: they draw a component statically for docs and the configurator.

## Change the system

- **Edit specs, not generated files.** Never hand-edit `*.tokens.css`, `stories/base-ui/spec/anatomy.generated.json`, `stories/base-ui/tokens/figma-semantic.css`, `llms.txt` or `docs/ai/*`.
- **Change a component**: edit `stories/base-ui/components/<folder>/<slug>.spec.ts`, then `npm run ds:generate` and `npm run ds:ai-docs`.
- **Add a token**: name it per `docs/Tokens-semantic-v2.xlsx` (grammar in [tokens.md](tokens.md#naming-grammar)), add it to the Figma `semantic` collection, then `npm run figma:sync-semantics`.
- **Add a component** (full steps: [docs §2a.3](../DESIGN_TOKENS_AND_FIGMA_SYNC.md#2a3-adding-a-component)):
  1. Write `<slug>.spec.ts` and add it to `SPECS` (`stories/base-ui/spec/index.ts`). Missing semantic roles go into Figma first.
  2. Write the Figma build file (`scripts/ds/figma/<slug>.build.js`), build it (`npm run ds:figma-build -- <Name>`), refresh the anatomy and run `npm run ds:parity` until it passes.
  3. `npm run ds:generate`; write `<Name>.tsx` (Base UI parts + `ds-*` classes + `data-*` attributes), `<slug>.css` (layout only: no colors or sizes), stories (`Default`, `Matrix`) and `<Name>.mdx`.
  4. Add a specimen (`stories/base-ui/components/specimens.tsx`) and a configurator tile (`semantic-editor/src/showcase/registry.tsx`).
  5. Give it a category in `stories/base-ui/spec/categories.ts`, then `npm run ds:figma-docs -- <Name>` and `npm run ds:ai-docs`.
- **Check before you finish**: `npm test` (every story, with accessibility checks), `npm run ds:generate -- --check`, `npm run ds:ai-docs -- --check`.
