# 0003 — One self-contained module per template, not a shared template file

## Status
Accepted (in effect since v1.0/v1.1; formalized as a written contract,
`js/templates/_CONTRACT.md`).

## Context
The template library was built by converting ~91 individual Figma frames into
code, one frame at a time (`js/templates/_CONTRACT.md`'s workflow: fetch one
frame's design context, download its assets into `assets/figma/<NN>/`, write
one module). More reusable, general-purpose templates were added later
(`lead-statement`, `steps-flow`, etc.) for deck-specific content that didn't
map to a single Figma frame. Both categories needed to coexist in one registry.

## Decision
Each template is exactly one file (`js/templates/slide-<NN>-<archetype>.js` or
`js/templates/<name>.js`) exporting a single object: `{ name, slide, theme,
chrome, schema, example, render(), css }`. CSS lives inline in the module as a
scoped string (every selector prefixed `.t-<name>__`), not in a shared
stylesheet. `js/templates/index.js` imports every module and assembles a flat
registry (`templates` by name, `allTemplates` ordered, `getTemplate(name)`).
The contract explicitly forbids touching shared files when adding a template:
*"No shared-file edits. Only create your own `js/templates/slide-<NN>-*.js` and
`assets/figma/<NN>/*`."*

## Consequences
- Adding template #92 is additive: one new file + one import + one array entry
  in `index.js`. It cannot break template #47's rendering or styling, because
  nothing is shared except tokens (`css/tokens.css`) and optional primitives
  (`css/primitives.css`), both append-only in practice.
- `installTemplateStyles()` (`js/templates/index.js`) concatenates every
  module's `css` into a single injected `<style>` tag at runtime — there is no
  per-template `<link>` or lazy CSS loading; all 91+ templates' CSS ships on
  every page load.
- The registry file itself becomes the one place multiple templates *can*
  collide: two modules exporting the same `name` would silently shadow each
  other in the `templates` object (last one wins, via
  `Object.fromEntries(modules.map(...))`), and nothing currently checks for
  duplicate names.

## Benefits
- Matches the actual authoring process (one Figma frame → one module) with no
  translation step.
- Enables many templates to be authored independently (by different sessions,
  different people, or an AI assistant) with a low risk of merge-style
  conflicts, since files don't share editable state.
- The `_CONTRACT.md` document makes the *shape* of a template checkable by a
  reviewer without needing to understand the whole registry.

## Trade-offs
- No shared component reuse below the `js/components.js` level — patterns that
  repeat across many templates (e.g. the eyebrow→heading→subhead block) are
  factored out only when someone notices the duplication (as happened with
  `SectionHeader`), not automatically.
- All CSS and JS for all templates loads unconditionally — acceptable at 91+
  small modules, a real cost if the library grew by an order of magnitude (see
  `docs/ARCHITECTURE.md` §2, `docs/ROADMAP.md`).
- The registry (`index.js`) is manually kept in sync with the folder despite
  being labeled "GENERATED" in its own header comment — see
  `docs/ROADMAP.md`'s technical-debt entry.

## Confidence
**High** for the decision and its stated rule ("no shared-file edits" is
explicit in `_CONTRACT.md`). **Medium** for the benefit framing above
(low merge-conflict risk, parallel authoring) — plausible given the contract's
own wording ("This makes templates reusable across decks and lets new
presentations be assembled... by mapping its slides onto registered
templates," from `README.md`), but the specific "avoids merge conflicts"
framing is my inference, not a stated goal.
