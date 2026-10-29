# Design tokens and Figma–code sync

This document describes the design token model, how Button and Icon Button are tokenized in this repository, how that model maps to the **Variable Test** Figma file, and which scripts and files keep Figma and code aligned. It is the canonical reference for extending the system to more components without reintroducing duplicate or primitive-bound variables on component layers.

**Quick navigation:** **§2** — what is already implemented in this repo; **§2a** — component specs (how every component is built); **§3** — semantic editor architecture and roadmap; **§4–11** — Figma/token model and tooling; **§13+** — how to extend and verify.

---

## 1. Goals and constraints

### 1.1 Primary goal

**Use identical token path strings in Figma and in code** (for example `color/background/interactive/subtle/hover`), so tokens can be synchronized through the Figma Variables REST API and GitHub Actions **without name translation or mapping tables** at sync time.

### 1.2 Secondary goals

- **Semantic-first components:** Component layers and React styles should bind to **semantic** variables (`color/*`, `size/*`, `space/*`, `shape/*`, `font/*`), not to raw **primitives** (`scale/*`, `opacity/*`) except inside composite definitions.
- **Minimal component collection:** The Figma `components` variable collection should not store per-button color duplicates when a single semantic path suffices. Historically, ~40 `button/*` and `icon-button/*` composite variables existed; those were removed in favor of shared overlay semantics.
- **Lazy component tokens:** Add component-scoped variables only when a visual recipe cannot be expressed as one semantic variable (for example a true multi-source composite that must stay in a component library). Buttons no longer use component-collection color composites.
- **Small intentional visual trade-offs:** Where no semantic token matches an old primitive pixel value exactly, prefer the closest semantic (or add a new semantic alias to primitives) rather than binding components directly to `scale/*`.

### 1.3 Non-goals (current phase)

- Full tokenization of every Base UI demo (Form, Input, etc.) to Figma `color/*` paths; many demos still use editor-local `--ds-*` CSS variables.
- Pixel-perfect preservation of every legacy button dimension after the primitive → semantic dimension migration.
- Maintaining parallel `button/*` vs `icon-button/*` **color** variables in Figma when both can bind to the same `color/*` path.

---

## 2. Repository implementation status (done)

This section inventories what exists **today** in `01-base-ui-test`: working code, Figma alignment, tooling, and documentation. It is the baseline for further work.

### 2.1 Storybook and Base UI demos

| Item | Status | Location / notes |
|------|--------|------------------|
| Storybook 10 + Vite | Done | `npm run storybook` |
| Synced Base UI component docs (MDX) | Done | `stories/base-ui/docs/*`, `npm run sync:docs` |
| Official pattern demos (Form, Input, Tabs, …) | Done | `stories/base-ui/demos/official/*` |
| Storybook preview theme | Done | Imports `figma-semantic.css` + `SemanticThemeDecorator` (optional local theme overrides) |

Demos for **Form, Input, Field**, etc. still use **`--ds-*`** names in their CSS modules; `ds-aliases.css` maps those onto semantic tokens.

### 2.2 Design-system Button and Icon Button (Figma-aligned)

| Item | Status | Location / notes |
|------|--------|------------------|
| `Button` / `IconButton` React components | Done | `stories/base-ui/components/button/`, `icon-button/` |
| Bindings (color, size, space, shape, font) | Done | `button.spec.ts`, `icon-button.spec.ts` (§2a) |
| Token CSS (generated) | Done | `button.tokens.css`, `icon-button.tokens.css` via `npm run ds:generate` |
| Storybook `Matrix` stories (every Figma variant) | Done | `Button.stories.tsx`, `IconButton.stories.tsx` (`SpecMatrix`) |
| Docs pages generated from the spec | Done | `Button.mdx`, `IconButton.mdx` (`SpecDocs`) |
| Phosphor icons in demos | Done | `shared/button-demo-icons.tsx`, `@phosphor-icons/react` |

These components are the **reference implementation** for the token model in section 1: they consume `var(--color-…)` names that match Figma semantic variables after `figma:sync-semantics`.

### 2.3 Token definitions and generated artifacts

| Item | Status | Location / notes |
|------|--------|------------------|
| Overlay composite definitions | Done | `shared-overlay-tokens.ts`, spec `sharedOverlay` |
| Component button spec (bindings map, empty composites) | Done | `component-button-token-spec.json` (generated) |
| Figma → CSS export | Done | `figma-semantic.css` via `npm run figma:sync-semantics` |
| Path helpers | Done | `figma-css-var.ts` |
| CSS var bridge for buttons | Done | `button-component-recipe.ts` |

### 2.4 Figma file (Variable Test)

| Item | Status | Notes |
|------|--------|-------|
| Button set `221:2`, Icon Button set `261:1993` | Done | Layers bound to semantics |
| Component-collection `button/*` / `icon-button/*` color vars | Removed | One-off prune/rebind migration (script since retired) |
| `button/label/space-x/{sm,md,lg}` (labelWrapper padding X) | Done | First lazy component token; aliases a `space/*` semantic |
| Six subtle-fill semantics in `semantic` collection | Done | `background/interactive/subtle/*` and `…/danger-subtle/*` (color + opacity composites) |
| Layer bindings use `color/*`, `size/*`, `space/*`, `shape/*`, `font/*` | Done | No `scale/*` on sample variants |
| Icons in Figma sets | Done | Phosphor library (`House`, `CaretRight`, Weight=Fill), same glyphs as code |
| Spec parity | Done | `npm run ds:parity` passes for Button and Icon Button (2026-10-14) |
| Legacy component tokens | Removed | 2,846 unbound tokens from an older system deleted 2026-10-14; copy in `docs/backups/figma-components-collection-2026-10-14.json`, Figma version *Before legacy component token cleanup* |

### 2.5 Automation scripts and npm commands

| Script | Status |
|--------|--------|
| `figma:component-spec` | Done |
| `figma:shared-overlay` | Done |
| `figma:prune-components` | Retired — one-off migration, removed |
| `figma:export-components` | Done |
| `figma:sync-semantics` | Done |
| `figma:sync-from` / `figma:sync-to` | Done (via `variables-github-action`; requires `.env`) |

Generated plugin bodies: `scripts/.figma-shared-overlay.js` (run in Figma Desktop or via bridge).

### 2.6 REST / GitHub Action package

| Item | Status | Notes |
|------|--------|-------|
| `variables-github-action` project | Done | Figma API client, token import/export tests |
| `tokens/color.Mode 1.json` (overlay composites) | Done | For REST-aligned composite metadata |
| `tokens/components.Mode 1.json` | Done | Empty by design |
| CI workflow wired to repo | Partial | Package exists; org-specific pipeline not described here |

### 2.7 Semantic editor (configurator) — shipped features

See **section 3** for intent and roadmap. Already implemented:

| Feature | Status |
|---------|--------|
| Standalone Vite app | Done — `npm run editor:dev`, `editor:build` |
| Shell UI — top bar with product name, theme name, light/dark, reset, export | Done — name lives in `semantic-editor/src/config/product.ts` |
| Left nav: Color, Font, Radius, Spacing, Shadow, Icons | Done |
| Left panel: theme controls per section | Done |
| Theme model + `localStorage` persistence | Done — `ThemeConfig`, key `ds-configurator:theme-config` (see §3) |
| Live preview via `applyTheme()` | Done — Figma base + brand + overrides on `<html>` (see §3.1) |
| System canvas: bento grid of Foundations, Components, Patterns | Done — `semantic-editor/src/showcase/registry.tsx` |
| Layout: nav rail + panel left, canvas right; stacks on narrow screens | Done |
| Token inspector per tile (`{ }` button) + “Edit” jumps to the panel section | Done |
| Button / Icon Button token lists from their specs (`tokensUsed`) | Done |
| Export menu | **Figma change set** (`.changes.json` for the plugin’s Import changes), **CSS variables** (`.tokens.css`: the whole theme, Light on `:root`, Dark under `[data-appearance="dark"]`), **Token JSON** (`.tokens.json`: Figma token paths → values per appearance, plus component overrides). Code export: `stories/base-ui/tokens/theme-export.ts` |
| Variables / Docs panel tabs | Stub — disabled |

### 2.8 Documentation and conventions

| Item | Status |
|------|--------|
| This document | Done — `docs/DESIGN_TOKENS_AND_FIGMA_SYNC.md` |
| Cursor response-style rule | Done — `.cursor/rules/response-style.mdc` |

### 2.9 Explicitly not done (repo-wide)

- End-to-end **editor theme → Figma Variables API → file update** loop.
- **Form / Input / …** demos bound to the same `color/*` paths as Figma (still `--ds-*` driven).
- **Variables** and **Docs** tabs in the editor.
- New semantic `size/2xl` (48px) for large button parity.
- Full **Code Connect** / Figma component documentation pipeline.

---

## 2a. Component specs — the source of truth

Every design-system component is described once, in a spec next to its code (`stories/base-ui/components/<slug>/<slug>.spec.ts`). Code, Figma, the configurator and the docs are all derived from it, so they can't drift apart.

### 2a.1 What a spec holds

| Field | Meaning |
|-------|---------|
| `name`, `slug` | Figma component set name (`Icon Button`) and token / CSS prefix (`icon-button`) |
| `axes` | Variant axes: Figma property ↔ React prop ↔ CSS condition. `prop` axes become `data-*` attributes; `state` axes list their selectors (`:hover…`, `[data-disabled]`, `[data-preview-state="hover"]`) |
| `exists` | Which combinations exist (e.g. Destructive only for Primary and Ghost) |
| `parts` | Anatomy: part id ↔ Base UI part ↔ Figma layer path ↔ CSS class (`.ds-<slug>__<part>`) |
| `bindings` | Part × property × axes → semantic token. Optional `override` names the component token the configurator may put in its place (`button/space-x/{size}`) |
| `docs` | Summary, usage, don'ts, accessibility notes |

Types and helpers: `stories/base-ui/spec/` (`types.ts` has the property map: each property's CSS declarations and Figma fields).

### 2a.2 What is derived from it

| Output | How |
|--------|-----|
| `<slug>.tokens.css` | `npm run ds:generate`. One rule per variant combination; each value is `var(--<override>, var(--<semantic>))`. Never edit by hand. |
| Expected Figma anatomy | `stories/base-ui/spec/anatomy.generated.json` (also `ds:generate`) |
| Figma component set | `npm run ds:figma-build -- <Name>` builds every variant from `scripts/ds/figma/<slug>.build.js` (layer structure only) and binds it per the spec (`--replace` rebuilds) |
| Figma bindings | `npm run ds:figma-bind -- <Name>` binds an existing set's layers per the spec (`--check` only reports) |
| Figma documentation panel | `npm run ds:figma-docs [-- <Name>]`: run `docs-runtime.js` once per bridge session, then each `docs-*.js` batch. Builds the panel (breadcrumb, summary, Specs, Anatomy, Features, Usage, Accessibility) in the component's frame, like "01 · Button": the panel on the left, the component on the right. Frames sit on category pages (Button & Actions, Form Controls, Selection, Menus, Navigation, Overlays, Feedback, Layout & Disclosure, Display) and are numbered in catalog order, both from `spec/categories.ts`. A newly built component's frame is made from its "❖" section and moved to its category page the first time; its own page goes once empty. The panel is built from the spec's `docs`, parts, axes and `figmaProps`, with the breadcrumb category from `spec/categories.ts`. Re-running replaces the panel (found by shared plugin data `ds_docs`); edit the spec, not the panel. Button and Icon Button keep their hand-made panels. Variant documentation is separate (made with the documentation plugin). |
| Repo anatomy | `npm run ds:figma-scan`, run the snippet, then `npm run ds:anatomy -- <saved result>` writes `figma-components.json` (or use the plugin's Export) |
| Parity check | `npm run ds:parity` compares `figma-components.json` (anatomy exported from Figma) with the specs; exits 1 on any difference |
| Figma Code Connect | `npm run ds:code-connect` writes `<slug>.figma.tsx` (React format, type-checked against the component) and converts it to `<slug>.figma.js` (the template Figma publishes). It also writes `stories/base-ui/components/index.ts` (every connected component, the package's `exports` entry) and `figma.migrate.config.json`, so snippets import from the package name in `package.json`: `import { Button } from 'nagarro-ds-starter-pack'` (a client project that renames its package gets its own name). Node ids and text layers: `spec/figma-nodes.json`. Per-component mapping exceptions (`CODE`, `TUNE`, `SKIP`) live in `scripts/ds/generate-code-connect.ts`. Publish with `npx figma connect publish` (Code Connect write token; Organization or Enterprise plan). |
| Contrast proof | `npm run ds:contrast` pairs every foreground binding (text color, icon fill) of every variant with the background it sits on (the part's own, else the nearest enclosing part's, else `color/background/surface/low`; translucent layers composited) and checks WCAG 2.x contrast in every brand × mode of `figma-semantic.json`: text 4.5:1, large text 3:1, icons 3:1; disabled variants are exempt and listed apart. Exits 1 on any failure. `-- --report` writes `docs/contrast-report.md` (generated). Parts hidden in some variants (an unchecked checkbox's check) are listed in the script's `DRAWN`, mirrored from the build files |
| Configurator catalog | `OVERRIDABLE` in `component-tokens.ts` is built from the specs' `override` bindings |
| Inspector token lists | `tokensUsed(spec)` in `semantic-editor/src/lib/preview-tokens.ts` |
| Storybook | `Matrix` story via `SpecMatrix`; docs page via `SpecDocs` (anatomy, variants, tokens, guidance) above Base UI's API reference |
| AI agent docs | `npm run ds:ai-docs` (`--check` fails if stale) writes `llms.txt` and `docs/ai/` (`components.md`, `tokens.md`, `rules.md`) from the specs, the React wrappers and `figma-semantic.json`, so agents (Claude, Copilot, Cursor…) use the right components, props and tokens. Never edit by hand |

**Strokes take layout space** in Figma (`strokesIncludedInLayout`), like CSS borders, so a bordered component has the same size in both. Controls have fixed heights on the shared scale (24 / 36 / 44: `space/2xl`, `size/lg`, `size/xl`), so a Button, an Input and a Select of the same size line up.

**Typography uses the Figma text styles** (`Body/MD Strong`, …), which are bound to the `font/*` tokens. A `text-style` binding applies the style in Figma and, in code, the four font tokens the style is bound to (`figma-text-styles.json`, refreshed by the scan). A component's text-style override switches the style: in code it sets `<token>/font-size` etc.; the plugin switches the layers' text style (no component token, since a style isn't a variable).

**Icons come from the linked library "Icons — Phosphor"** (`scripts/ds/figma/icons.json`: component set keys). All icons use the **Fill** weight (`Format=Stroke, Weight=Fill` in Figma, `weight="fill"` in code), except **Check, Minus, Plus and X**: their Fill forms are a glyph in a filled square, so they use Bold (`Format=Outline, Weight=Bold`). Icons that show a state (Toggle, navigation) switch weight: line (`Weight=Regular`) while off, Fill while on. Both formats draw the glyph as a filled vector, so the specs bind `fills`. Importing a set takes ~40 s: run the `ds:figma-icons` snippet first and wait until it reports `ok`.

Figma snippets run with figma-console `figma_execute`. They share a runtime (`npm run ds:figma-runtime` → `scripts/ds/.out/runtime.js`) installed once per bridge session as `globalThis.__ds`; each snippet checks the runtime version first.

Handwritten per component: the React wrapper (`<Name>.tsx`: Base UI parts + `ds-*` classes + `data-*` attributes) and a small layout stylesheet (`<slug>.css`: flex, positioning, cursor, focus outline; no colors or sizes).

`generate:demos` and `generate:stories` skip any component that has a spec, so they never overwrite its demo, stories or docs.

**Popups** share one surface (`components/shared/popup.ts`: `surface()`, `arrowParts()`, `arrowBindings()`; layout in `shared/popup.css`). The arrow is a part drawn by the arrow element's `::before` (`element` + `pseudo` on the part); in Figma it's `arrow › shape`, a square turned 45° in a 12 × 6 clipping frame on the popup's top edge. Its bindings reuse the surface's override ids, and bindings that share an override id become one configurator property, so overriding a popover's background or border recolors its arrow too. Portalled parts (`portal: true`) start their own selector chain, since they aren't inside the root in the DOM (Navigation Menu's panel). Select, Combobox and Autocomplete share **Listbox** (the popup) and **Option** (the rows); Context Menu is Menu's popup and items, so it has no Figma component of its own. Code-only parts (a dialog's backdrop) have `figma: []` and `on: 'code'` bindings.

**Figma properties** (`figmaProps` on a spec) make instances adaptable without detaching:

| Kind | In Figma | In code |
|------|----------|---------|
| `slot` | A slot layer (`h.slot(c, 'Body')` in the build file): any content, with **preferred** components one click away. The parity check ignores what's inside a slot, only the slot's own bindings count | `children`, or a sub-component (`<Dialog.Body>`) |
| `boolean` | Shows / hides layers (Show arrow, Show close, Show description) | a prop (`arrow`, `showClose`) or an optional child |
| `text` | Edits text layers from the properties panel | the text / children |
| `expose` | A nested instance's own properties shown on the parent (Autocomplete's Input) | — |

`applyFigmaProps` (runtime) creates them after binding; it reuses existing properties, so a re-run never adds "Label2". The docs page lists them (SpecDocs → Figma properties).

**Building blocks** exist so slots have something to take: Menu Group Label and Menu Separator (Menu's Items slot), Navigation Menu Link (the panel's Links slot), a vertical Separator (Toolbar). Slots inside default content can't expose nested instances (a Figma rule); designers edit those instances directly.

**Placement and content axes** (`layout: true`: popup Side, Drawer side, Separator orientation, Progress / Meter Value) are variants in Figma but no token differs between their values, so the configurator doesn't offer them as kinds. A binding that only applies to some values of an axis uses `exists` (a right-docked drawer rounds its left corners, a left-docked one its right corners).

**Plugin gotchas** (figma-console `figma_execute`):
- A call that times out (30 s) **keeps running** in the plugin. Never start the next build while one may still be running: two runs replace each other's sets, half-bound. Check with a short call before continuing.
- Async calls (`setTextStyleIdAsync`, `getMainComponentAsync`, `loadFontAsync`) resolve on Figma's next frame, which is throttled while the Figma window is in the background. Awaited one by one, a large set can take minutes; `bindSpecs` therefore starts them all and awaits them together, and build files do the same for icon swaps.
- The plugin can't fetch from localhost: snippets (and the runtime, after a bridge restart) are pasted into `figma_execute`. Several builds fit in one call when they're small.

**Build-file gotcha:** `resize()` fixes both axes of an auto-layout frame. Set `primaryAxisSizingMode = 'AUTO'` again on frames that should hug, and give a horizontal row that must stretch a fixed width (`primaryAxisSizingMode = 'FIXED'` + `layoutAlign = 'STRETCH'`); otherwise it hugs and wraps its text.

### 2a.3 Adding a component

1. Write `<slug>.spec.ts`; add it to `SPECS` in `stories/base-ui/spec/index.ts`.
2. Missing semantic roles go into the Figma `semantic` collection (names per `docs/Tokens-semantic-v2.xlsx`), then `npm run figma:sync-semantics`.
3. Write `scripts/ds/figma/<slug>.build.js` (one variant's layer structure, named after the spec's parts), `npm run ds:figma-build -- <Name>`, run the snippet.
4. Refresh the anatomy (`ds:figma-scan` → `ds:anatomy`), then `npm run ds:parity` until it passes. Parts that are instances of another spec'd component (`instanceOf`) are checked by that component's spec.
5. `npm run ds:generate`; write `<Name>.tsx`, `<slug>.css`, stories (`Default`, `Matrix`) and `<Name>.mdx` (`SpecDocs` + `BaseUiMarkdown`). Add a play-function story for the component's key interaction (see **Behavior tests** below).
6. Add a specimen (`stories/base-ui/components/specimens.tsx`): the Matrix story and the configurator's component editor both render it.
7. Add a configurator tile in `semantic-editor/src/showcase/registry.tsx` with `component: '<slug>'`.
8. Give it a category in `stories/base-ui/spec/categories.ts` (its place there sets its catalog number), then `npm run ds:figma-docs -- <Name>` and run the snippets: its frame, with the documentation panel, moves to the category page.

**Behavior tests.** `npm test` renders every story in headless Chromium and fails on errors or accessibility violations. A story with a `play` function also clicks and types, and fails when an `expect` does not hold. Put them in `<Name>.stories.tsx` under `/* behavior tests */`, one behavior per story, named after it (`ClickTogglesChecked`, `KeyboardToChoose`), with a `/** Behavior test: … */` line. Keep `Default` free of play functions: it is the docs' live example. Import from `storybook/test` (`expect`, `fn`, `userEvent`, `waitFor`, `screen`, `within`); query by role and accessible name (`canvas.getByRole('switch', { name: 'Notifications' })`); popups portal to `<body>`, so find them with `screen` and wait for open / close with `findBy…` / `waitFor`; pass callbacks as `fn()` in `args` and assert they were called. Covered so far: Button, Checkbox, Switch, Select, Dialog, Menu, Tabs, Number Field.

---

## 3. Semantic editor (DS Configurator) — purpose and architecture

The configurator (`semantic-editor/`, product name in `src/config/product.ts`) edits the **semantic layer** through a few plain-language controls. Users never pick individual tokens. Naming follows **`docs/Tokens-semantic-v2.xlsx`** (source of truth).

### 3.1 Layering

| Layer | Source | Where it lives |
|-------|--------|----------------|
| 1. Figma `semantic` collection (Light / Dark) | Figma → `npm run figma:sync-semantics` | `figma-semantic.css` (`:root`, `[data-appearance]`) |
| 2. Figma brand extension (Violet, Gold, …) | Figma extension collections | `figma-semantic.css` (`[data-brand]`) |
| 3. Configurator overrides | `ThemeConfig` → `generateTokens()` | Inline custom properties on `<html>` |

Everything a user has not touched stays exactly as in Figma. The theme is applied to `<html>` (class `theme-scope` + `data-appearance` / `data-brand`) so Base UI popups, which portal to `<body>`, inherit it.

### 3.1a Light / Dark only changes color

Non-color semantic tokens (size, space, radius, type, effects, motion) are **linked**: one value for every color mode.

- `npm run figma:link-modes` copies an edit made in either mode to the other. It compares each mode with the snapshot from its last run (`stories/base-ui/tokens/figma-mode-links.json`) to tell which mode was edited; if both changed, Light wins (`-- --prefer=dark` flips that, `-- --dry-run` only reports).
- `npm run figma:sync-semantics` runs it first, then writes linked tokens once in `:root` (no per-mode copies), and brand overrides of them once per brand.
- **Opt out** (rare): put `[per-mode]` in the variable's description in Figma. That token is then left alone and emitted per mode.

### 3.1b Figma plugin (any plan, no REST API)

`figma-plugin/` moves variables both ways without the Enterprise REST API — see `figma-plugin/README.md`.

- **Plugin → Export variables** → configurator **Import** (the editor then runs on that file; stored in the browser until you switch back to the repo variables) and/or `npm run figma:sync-from-file -- <file>` for code.
- Configurator **Export → Figma change set** → plugin **Import changes** (preview, then apply after saving a version).
- Theme changes keep the primitive → semantic structure: tokens that alias a primitive get an existing primitive with the same value, or a new generated one named after the file's conventions (`colors/brand/675`, `scale/325`). Color + opacity composites are left alone (they follow the token they point at).

### 3.1c Component overrides (proof of concept: Button, Icon Button)

Clicking the Buttons or Icon buttons tile on the canvas opens that component's editor, a level below the system.

- The panel tabs disappear, and the rail switches to the component's sections: Color, Size and, for Button, Type.
- A note states that edits apply to that component only.
- The canvas shows the component in every size and every type × state.
- The overrides table lists the overrides already in the Figma file (component tokens the layers are bound to, e.g. `button/label/space-x/*`) next to your changes.
- Colors are picked from swatches of semantic tokens, with a contrast check.
- Close (✕, or Esc) goes back to the system.

- **An override is a component token**, stored in the `components` collection next to the component's other tokens (`button/label/space-x/md`). It aliases a semantic token, e.g. `button/radius/md → shape/radius/full`.
- **Naming follows the existing tokens.**
  - Sizing gets one token per Size: `button/radius/{sm|md|lg}`, `button/space-x/…`, `button/space-y/…`, `button/gap/…`, `button/label/{space-x|size|line-height}/…`, `button/icon/size/…`, `icon-button/size/…`, `icon-button/icon/size/…`.
  - Colors get one token per Type × State, and apply in every size: `button/{background|border-color|foreground}/{type}/{state}`. Destructive variants count as their own type (`primary-destructive`).
  - A few properties have one token for the whole component: `button/label/weight`, `button/label/font-family`, `icon-button/border-width`.
  - The catalog is built from the component specs (`override` on a binding); see §2a.
- **Anatomy.** `figma-components.json` records what every variant's layers are bound to. The plugin's Export rescans it for component sets that have tokens (`Button` ↔ `button/…`). This is how the configurator knows which layers an override takes over and what the current value is.
- **In Figma**, the plugin's Import creates or updates the token and then rebinds the matching layers. It only rebinds a layer property that is currently bound to the token being replaced. Layers with hand-set values, or bound to something else, are left alone.
- **In code**, the generated `<slug>.tokens.css` reads `var(--button-radius-md, var(--shape-radius-sm))`: the override when it is set, otherwise the semantic token Figma binds. The sync emits only component tokens that some layer is bound to (the `bound` list in `figma-variables.json`). Unused leftovers can therefore never shadow the semantic fallback.
- **Not yet supported:**
  - brand-specific overrides (overrides follow whichever brand is active)
  - removing an override from Figma (setting it back to the original token keeps the token, pointing at that original)
  - components other than Button and Icon Button

### 3.1d The agent: two ways to connect to Claude

The agent (Edit theme, Ask, Prototype) asks Claude with a few **report tools** (`report_progress`, `apply_theme`, `render_screen`): the app acts on each call as it streams in. **Agent settings → How should the agent connect to Claude?** picks how:

| | My Claude plan (this computer) | API key |
|---|---|---|
| Billed to | the user's Claude plan (Pro, Max, Team, Enterprise): included | the key's Console account, per use |
| Works | only while `npm run editor:dev` runs on this computer | anywhere, including the published site |
| Needs | Claude Code logged in with a Claude account (`claude`, then log in) | a key from the Claude Console, saved in this browser only |
| How | the browser streams the run from the dev server (`/__ds/agent/run`); `semantic-editor/bridge/claudePlan.ts` runs it with the Claude Agent SDK, the report tools as in-process MCP tools | the browser calls the Claude API directly (`agent/client.ts`) |

The plan is the default whenever Claude Code is found and logged in (`/__ds/agent/status`, which asks `claude auth status`). The bridge is a Vite dev-server middleware (`apply: 'serve'`), so a build never has it, and the published site offers the API key only. Plan runs are locked down: no built-in Claude Code tools (files, shell, web), no user or project settings, hooks or MCP servers, an empty working folder, `ANTHROPIC_API_KEY` removed (so it can't bill Console credits), and only the editor's own pages may call it. Subscription login stays personal: never put the bridge on a shared server.

### 3.2 Controls → tokens

| Control | Values | Tokens it writes |
|---------|--------|------------------|
| Brand (top bar) | Default / Figma brands | Selects layer 2 |
| Brand color + "Use it for" | hex; Accents / + Actions / + Links | `background/accent/*`, `foreground/accent`, `on-accent/*`, focus ring; + `interactive/primary/*`; + `foreground/interactive/*`, `border/interactive/selected` |
| Neutrals | Cool / Neutral / Warm | Re-tints every neutral color token, keeping Figma lightness |
| Status | 4 hex colors | `background/{status}/{subtle,strong}`, `foreground/{status}`, `border/{status}`, `on-{status}/*`; error also drives `interactive/danger*`, `foreground/interactive/danger/*`, focus ring error |
| Third level | on / off (default off) | Off: every `…/tertiary` color token = `var(…/secondary)` |
| Typeface / Size / Contrast between sizes | family; body px; ratio | `font/family/*`, `font/size/*`, `font/line-height/*` |
| Roundness | Sharp … Pill | `shape/radius/{sm,md,lg}` |
| Density | Compact / Default / Comfortable | `space/*`, `size/*` (× 0.8 / 1 / 1.2 of Figma values) |
| Depth | Flat / Subtle / Elevated | `effect/shadow/elevation/*/{offset-x,offset-y,blur,spread}` |

### 3.3 Code map

```
stories/base-ui/tokens/
  figma-semantic.css     generated: semantic (light/dark), brands, shadow composites, scale/*, button/*
  figma-semantic.json    generated: resolved literal values per mode and brand (generator input)
  ds-aliases.css         legacy --ds-* names used by Base UI demo CSS → semantic tokens
  theme-config.ts        ThemeConfig (intent-level, null = keep Figma)
  theme-generator.ts     generateTokens(), applyTheme(), FIGMA_BRANDS
  color-math.ts          OKLCH conversion, ramps, readable-on-color
  theme-storage.ts       localStorage (key ds-configurator:theme-config), shared with Storybook
semantic-editor/src/
  context/               ThemeConfig state; applies theme to <html>
  components/sections/   Color, Type, Shape / Density / Depth panels
  showcase/              registry-driven bento canvas (foundations, components, patterns)
  lib/preview-tokens.ts  token lists for each tile's inspector (semantic paths)
  agent/client.ts        the agent's tool loop and docs answers, on an API key or the Claude plan
  agent/planClient.ts    browser side of the Claude plan bridge (status, streamed runs)
semantic-editor/bridge/
  claudePlan.ts          dev server only: runs the agent with the Claude Agent SDK and the local Claude Code login
```

### 3.4 Not done yet

- **Base UI demos are only partly on tokens.** Many paddings, gaps, heights and checked-state colors are hard-coded in the demo CSS modules, so Density and Brand color don't reach them yet.
- **Publish as a new Figma brand extension** in one step (today: Export → Figma change set, then the plugin's Import changes).
- **Variables / Docs** panel tabs.

### 3.5 How to run

```bash
npm run editor:dev            # http://localhost:4175
npm run figma:sync-semantics  # refresh figma-semantic.css / .json from Figma
```

## 4. Reference Figma file

| Item | Value |
|------|--------|
| File name | Variable Test |
| File key | `0lCfWZBgpscbrOKQ7iIRi8` |
| Button component set node id | `221:2` |
| Icon Button component set node id | `261:1993` |

### 4.1 Variable collections (as used in this project)

| Collection name | Typical role |
|-----------------|--------------|
| `primitives` | Raw scales (`scale/*`), opacities (`opacity/*`), etc. **Not bound on Button/Icon Button layers.** |
| `semantic` | Semantic colors (`color/*`), sizes (`size/*`), spacing (`space/*`), shape (`shape/*`), typography (`font/*`). **This is what component layers bind to.** |
| `components` | Mode `Mode 1` (mode id `4:6`). Holds only component tokens that are overrides (today `button/label/space-x/{sm,md,lg}`). Legacy tokens were removed on 2026-10-14 (§2.4). |
| Brand collections | e.g. Violet Brand, Gold Brand — theme/brand overrides; out of scope for button binding logic unless explicitly referenced. |

### 4.2 Color modes

Semantic colors use **Light** and **Dark** modes (the sync script looks modes up by name). Component set variables historically used a single **Mode 1** (`4:6`) when component variables existed; layers now bind directly to semantic variables that resolve per light/dark on the semantic collection.

---

## 5. Token taxonomy

> **Naming source of truth:** `docs/Tokens-semantic-v2.xlsx` (Semantic, Vocabulary, Changes, Code migration tabs). The Figma `semantic` collection matches it exactly (171 tokens / 189 variables; shadows are stored as offset-x / offset-y / blur / spread).

### 3.1 Path notation

- **Figma variable name:** slash-separated path, e.g. `color/background/interactive/primary/default`.
- **CSS custom property:** same path with `/` → `-`, prefixed with `--`, e.g. `--color-background-interactive-primary-default`.
- **Conversion in code:** `figmaTokenToCssVar()` and `figmaTokenVar()` in `stories/base-ui/tokens/figma-css-var.ts`.

### 3.2 Primitives (`primitives` collection)

Examples:

- `scale/600` → 24px (numeric spacing scale)
- `opacity/10` → 10% opacity used in composites

**Rule:** Primitives are building blocks. Composite semantics reference a **color** semantic + an **opacity** primitive. Do not bind Button fills, padding, or icon sizes directly to `scale/*` on component nodes.

### 3.3 Semantics (`semantic` collection)

#### Color (`color/*`)

Structured roughly as:

- `color/background/...` — surfaces, interactive fills, danger, transparent, overlay
- `color/foreground/...` — text and icon foreground roles
- `color/border/...` — strokes and borders

Interactive, danger, neutral, and on-color roles follow the naming used in `buttonColor()` (see section 7).

#### Size (`size/*`)

Component-scale dimensions (heights, icon boxes), e.g. `size/lg` (36px), `size/xl` (44px), `size/2xs` (14px). Also `size/border/regular` (1px border width).

#### Space (`space/*`)

Padding, gap, and layout spacing, e.g. `space/xs` (4px), `space/sm` (8px), `space/md` (12px), `space/2xl` (24px).

#### Shape (`shape/*`)

Radius tokens, e.g. `shape/radius/sm` (0px for square buttons in the current file).

#### Font (`font/*`)

`font/family/primary`, `font/size/body/sm|md|lg`, `font/line-height/body/*`, `font/weight/body/strong`, etc.

### 3.4 Composites (semantic color + opacity primitive)

In Figma, a composite variable stores **color** and **opacity** as variable aliases (not a single hex computed in the variable UI). In REST export, extensions may record `compositeOpacity` (see `variables-github-action` token JSON and `com.nagarro.ds` extension).

**Shared overlay composites** live in the semantic collection and are defined in code in `stories/base-ui/tokens/shared-overlay-tokens.ts` and mirrored in `component-button-token-spec.json` under `sharedOverlay`.

| Semantic path | Color source | Opacity primitive |
|---------------|--------------|-------------------|
| `color/background/interactive/subtle/default` | `color/foreground/interactive/default` | `opacity/0` |
| `colors/transparent (primitive)` | `color/foreground/interactive/default` | `opacity/0` |
| `color/background/interactive/subtle/hover` | `color/foreground/interactive/default` | `opacity/10` |
| `color/background/interactive/subtle/pressed` | `color/foreground/interactive/default` | `opacity/15` |
| `color/background/interactive/danger-subtle/hover` | `color/background/interactive/danger/default` | `opacity/10` |
| `color/background/interactive/danger-subtle/pressed` | `color/background/interactive/danger/default` | `opacity/20` |

**Naming note:** The segment `overlay` was chosen instead of `state` to avoid confusion with Figma component properties `State=Hover|Pressed|...` and with solid interactive state colors such as `color/background/interactive/primary/hover`.

### 3.5 What not to do (lessons learned)

1. **Do not** create `color/background/override/*` or similar ad-hoc namespaces without aligning code and REST export.
2. **Do not** reintroduce large sets of `button/*` / `icon-button/*` **color** variables that duplicate semantics (formerly ~40 composites × two prefixes).
3. **Do not** bind component layers to `scale/*` when an equivalent `size/*`, `space/*`, or `shape/*` semantic exists.
4. **Do not** bulk-delete variables by name prefix. The retired prune script deleted every `button/*` variable unconditionally. The `components` collection holds legitimate component tokens (overrides such as `button/label/space-x/*`); check bindings before removing anything.

---

## 6. Button and Icon Button — product model

### 4.1 Variants (Figma component properties)

| Property | Values |
|----------|--------|
| Type | Primary, Secondary, Ghost, Outline |
| Size | Small, Medium, Large → `sm`, `md`, `lg` in code |
| State | Default, Hover, Pressed, Disabled |
| Destructive | True / False |

Code types: `ButtonType`, `ButtonSize`, `ButtonState` in `stories/base-ui/components/button/button.spec.ts`.

### 4.2 Layer binding roles (Figma)

Rebind logic treats three **color roles** per variant:

| Role | Typical node |
|------|----------------|
| `bg` | Root component fill |
| `fg` | Label text, icon vector fills |
| `border` | Root stroke |

Non-color fields (padding, gap, font size, corner radius, stroke weight, icon width/height) use semantic **size**, **space**, **shape**, and **font** paths per size tier (section 8).

### 4.3 React implementation

| Piece | Path |
|-------|------|
| Spec | `stories/base-ui/components/button/button.spec.ts`, `icon-button/icon-button.spec.ts` |
| Button component | `stories/base-ui/components/button/Button.tsx` |
| Icon Button component | `stories/base-ui/components/icon-button/IconButton.tsx` |
| Layout CSS (handwritten) | `button.css`, `icon-button.css` |
| Token CSS (generated) | `button.tokens.css`, `icon-button.tokens.css` |
| Demos / matrices | `ButtonDemo.tsx`, `IconButtonDemo.tsx`; `Matrix` stories |
| Icons in demos | Phosphor via `@phosphor-icons/react`, wrappers in `stories/base-ui/shared/button-demo-icons.tsx` |

Classes are stable (`.ds-button`, `.ds-button__label`, `.ds-button__icon`); variants are `data-type`, `data-size`, `data-destructive`.

---

## 7. Color binding logic (`buttonColor`)

**Source of truth:** `buttonColor(type, destructive, role, state)` in `stories/base-ui/components/button/button.spec.ts`, shared by Button and Icon Button.

### 5.1 Primary (non-destructive)

| Role | default / hover / pressed | disabled |
|------|---------------------------|----------|
| bg, border | `color/background/interactive/primary/{state}` | `color/background/interactive/disabled` |
| fg | `color/foreground/on-interactive/primary` | `color/foreground/neutral/tertiary` |

### 5.2 Secondary

| Role | Behavior |
|------|----------|
| bg | `color/background/interactive/secondary/{state}` or disabled |
| fg | `color/foreground/neutral/primary` or tertiary when disabled |
| border | `color/border/interactive/{state}` |

### 5.3 Ghost and outline (non-destructive)

| Role | default / disabled | hover | pressed |
|------|-------------------|-------|---------|
| bg | `color/background/interactive/subtle/default` | `color/background/interactive/subtle/hover` | `color/background/interactive/subtle/pressed` |
| fg | `color/foreground/interactive/{state}` or neutral tertiary when disabled | | |
| border (ghost only) | `colors/transparent (primitive)` | | |
| border (outline only) | `color/border/interactive/{state}` | | |

Ghost and outline **share the same overlay fill semantics** on hover/press (foreground-based wash). This is an intentional simplification versus older per-variant composites (different opacities for ghost vs outline).

### 5.4 Destructive primary

| Role | Paths |
|------|--------|
| bg, border | `color/background/interactive/danger/{state}` |
| fg | `color/foreground/on-danger/primary` or neutral tertiary when disabled |

### 5.5 Destructive ghost

| Role | default / disabled | hover | pressed |
|------|-------------------|-------|---------|
| bg | `color/background/interactive/danger-subtle/default` | `color/background/interactive/danger-subtle/hover` | `color/background/interactive/danger-subtle/pressed` |
| border | `colors/transparent (primitive)` | | |
| fg | `color/foreground/interactive/danger/{state}` | | |

### 5.6 Spec file for documentation and rebind

`stories/base-ui/tokens/component-button-token-spec.json` contains:

- `semanticBindings`: maps **legacy logical paths** such as `button/background/ghost/hover` → semantic path (for docs and historical rebind maps). These paths are **not** stored as Figma variables anymore.
- `sharedOverlay`: copy of overlay composite definitions.
- `composites`: empty object in the current model.
- `collection` / `modeId`: metadata for the former components collection.

Regenerate with `npm run figma:component-spec`.

---

## 8. Dimension and typography bindings

**Source of truth:** the bindings in `button.spec.ts` and `icon-button.spec.ts` (the tables below summarize them; `SpecDocs` on the Storybook page lists every one).

### 6.1 Semantic constants

| Constant | Path |
|----------|------|
| Border width | `size/border/regular` |
| Corner radius | `shape/radius/sm` |
| Font family (buttons) | `font/family/primary` |
| Font weight (labels) | `font/weight/body/strong` |

### 6.2 Button layout by size

| Token role | sm | md | lg |
|------------|----|----|-----|
| minHeight | `space/2xl` (24px) | `size/lg` (36px) | `size/xl` (44px) |
| paddingX | `space/xs` | `space/sm` | `space/md` |
| paddingY | `space/xs` | `space/sm` | `space/md` |
| gap | `space/2xs` | `space/2xs` | `space/xs` |
| icon | `size/2xs` | `size/xs` | `size/sm` |
| label horizontal padding (`labelPx`) | `button/label/space-x/sm` | `button/label/space-x/md` | `button/label/space-x/lg` |
| radius | `shape/radius/sm` | same | same |
| label font size | `font/size/body/sm` | `md` | `lg` |
| line height | `font/line-height/body/sm` | `md` | `lg` |

### 6.3 Icon button layout

| Size | Box (width/height) | Icon | Radius |
|------|-------------------|------|--------|
| sm | `space/2xl` | `size/2xs` | `shape/radius/sm` |
| md | `size/lg` | `size/xs` | same |
| lg | `size/xl` | `size/sm` | same |

### 6.4 Migration from primitives (approximate)

| Former primitive | Typical px | Current semantic | Notes |
|------------------|------------|------------------|--------|
| `scale/600` | 24 | `space/2xl` | Exact |
| `scale/900` | 36 | `size/lg` | Exact |
| `scale/1200` | 48 | `size/xl` | **44px** — largest semantic size in file |
| `scale/150` | 6 | `space/xs` or `space/sm` | sm pad X uses `space/xs` (4px) |
| `scale/00` | 0 | `shape/radius/sm` | Semantic alias to 0 |
| `scale/25` | 1 | `size/border/regular` | Exact |

To restore 48px large buttons without primitive binding, add a semantic such as `size/2xl` aliasing `scale/1200` in Figma, then point the Large `min-height` binding in `button.spec.ts` and the icon-button `size` binding to it.

---

## 9. CSS generation from Figma

### 7.1 Generated file

`stories/base-ui/tokens/figma-semantic.css` — produced by:

```bash
npm run figma:sync-semantics
```

Requires `variables-github-action/.env` with `PERSONAL_ACCESS_TOKEN` and `FILE_KEY`.

### 7.2 What gets exported

Script: `scripts/sync-figma-semantic-css.mjs`

- Resolves semantic variables for **light** and **dark** into `:root` / `.theme-scope[data-appearance="light|dark"]`.
- Prefixes treated as semantic for export: `color/`, `font/`, `size/`, `space/`, `shape/`, and `scale/` (scale remains in CSS for alias resolution and tooling; components should not depend on `--scale-*` in new work).
- **Composite colors** (overlay tokens): resolved to `rgba(...)` when the variable uses color + opacity alias structure.
- Legacy `button/*` / `icon-button/*` variables: if any remain in the file, their computed values are also written; the current model expects **zero** such variables.

### 7.3 Storybook and editor consumption

- Storybook preview imports `figma-semantic.css` (see `.storybook/preview.tsx`).
- Semantic theme editor imports the same file in `semantic-editor/src/main.tsx`.
- Optional theme overrides: `stories/base-ui/tokens/theme-generator.ts` (`applyTheme`), storage key `ds-configurator:theme-config`.

---

## 10. Figma automation scripts

All generated plugin bodies live under `scripts/.figma-*.js` (gitignored or generated). Source generators are `.mjs` files in `scripts/`.

| npm script | Generator | Purpose |
|------------|-----------|---------|
| `figma:component-spec` | `generate-component-button-token-spec.mjs` | Writes `component-button-token-spec.json`, `figma-rebind-map.json` |
| `figma:shared-overlay` | `generate-figma-shared-overlay.mjs` | Emits `.figma-shared-overlay.js` — create/update overlay variables in **semantic** collection; renames legacy `*/state/*` → `*/overlay/*` |
| `figma:export-components` | `export-components-tokens-json.mjs` | Writes `variables-github-action/tokens/components.Mode 1.json` (empty) and `color.Mode 1.json` (overlay composites for REST) |
| `figma:sync-semantics` | `sync-figma-semantic-css.mjs` | Pull variables → `figma-semantic.css` |
| `figma:sync-from` / `figma:sync-to` | `variables-github-action` package | Full token JSON sync via GitHub Action tooling |

**Typical Figma maintenance flow after changing bindings in code:**

1. `npm run figma:component-spec`
2. `npm run figma:shared-overlay` → run output in Figma Desktop (plugin / MCP execute)
3. `npm run figma:sync-semantics`
4. `npm run figma:export-components` if REST JSON should match

### 10.1 Retired: prune/rebind script

`generate-figma-prune-rebind.mjs` (`figma:prune-components`) was a one-off migration from per-button color composites to semantic bindings. It deleted **every** variable starting with `button/` or `icon-button/` unconditionally and rebound layers from tables copied (not imported) from `button-token-bindings.ts`. It was removed on 2026-10-12 because it would delete legitimate component tokens such as `button/label/space-x/*`. Change individual bindings directly instead (section 10.2).

### 10.2 Changing a component token from the terminal

Use Claude Code with a Figma MCP connected (official Figma connector, or `figma-console` + Desktop Bridge plugin):

```bash
claude -p "In Figma file 0lCfWZBgpscbrOKQ7iIRi8, set button/label/space-x/lg to alias space/sm, then run npm run figma:sync-semantics"
```

Then align code: update the binding in the component's spec if it changed, run `npm run ds:generate` and `npm run figma:sync-semantics`, and check `npm run ds:parity` and the Button stories.

---

## 11. REST token sync (`variables-github-action`)

Directory: `variables-github-action/`

- **Environment:** `.env` with `FILE_KEY`, `PERSONAL_ACCESS_TOKEN` (never commit secrets).
- **Exported JSON:** `tokens/color.Mode 1.json` holds overlay composite entries with `compositeOpacity` extension metadata.
- **Components JSON:** `tokens/components.Mode 1.json` is empty; it is not yet regenerated from the live `components` collection, which now holds component tokens.

The design intent is that **push/pull** operations use the same paths as in Figma and in the component specs, so CI does not need a separate mapping layer.

---

## 12. Semantic editor (summary)

Full **implementation status**, architecture, and phased roadmap: **section 3**. This doc section is a quick pointer for readers jumping to the end.

- App: `semantic-editor/` — `npm run editor:dev`
- Layout: editor left (360px), preview right; token popover on preview cards (hover + click-to-pin)

---

## 13. Extending the system

### 13.1 Adding a new button-like color behavior

1. Prefer a new **`color/*` semantic** (or overlay composite using existing `opacity/*` primitives).
2. Add the path to `shared-overlay-tokens.ts` if it is a composite; run `figma:shared-overlay`.
3. Update `buttonColor()` in `button.spec.ts`, then `npm run ds:generate`.
4. Regenerate spec: `figma:component-spec`. Rebind the affected Figma layers directly (Figma MCP / plugin), not via a bulk prune.
5. `figma:sync-semantics` and verify Storybook matrices.

Only if a semantic cannot work, introduce a **component-collection** variable and document it in the spec `composites` object—and expect REST export to include it.

### 13.2 Adding a new component (e.g. Input)

Follow §2a.3. Bind only semantics (never primitives), and don't duplicate `color/*` under a component prefix: component tokens exist only as configurator overrides.

### 13.3 Adding a new semantic size

Create the variable in Figma **semantic** collection as an alias to the correct `scale/*` primitive, export via sync, then reference the new path from the component specs' bindings.

---

## 14. Verification checklist

After token or binding changes:

- [ ] Figma: sample Button variant has **no** bindings to `scale/*` on layers (only `color/*`, `size/*`, `space/*`, `shape/*`, `font/*`).
- [ ] Figma: no variables named `button/*` or `icon-button/*` remain (unless deliberately reintroduced).
- [ ] `npm run figma:sync-semantics` succeeds; `figma-semantic.css` contains overlay vars, e.g. `--color-background-interactive-subtle-hover`.
- [ ] Storybook: Button and Icon Button matrices look correct in light/dark.
- [ ] `npm run editor:build` succeeds; editor token popover lists expected paths for Button.
- [ ] `npm run ds:generate -- --check` passes (generated CSS / anatomy up to date).
- [ ] `npm run ds:parity` passes (Figma bindings match the specs).

---

## 15. Known gaps and follow-ups

| Area | Status |
|------|--------|
| Form / Input / other demos | Mostly `--ds-*` in CSS modules, not full `color/*` Figma parity |
| Large button height 48px | Uses `size/xl` (44px) unless new semantic added |
| `figma:component-spec`, `figma:shared-overlay`, `figma:export-components`, rebind-map scripts | Keep their own copy of the button color logic; superseded by specs (§2a) and due for retirement |
| Component → semantic JSON | `figma-component-to-semantic.json` may reflect legacy aliases if old vars exist in file |

---

## 16. Glossary

| Term | Meaning |
|------|---------|
| **Primitive** | Raw token in `primitives` collection (`scale/*`, `opacity/*`). |
| **Semantic** | Named role token in `semantic` collection (`color/*`, `size/*`, etc.). |
| **Composite** | Semantic color variable whose value is `{ color: alias, opacity: alias }`. |
| **Overlay** | Shared semi-transparent fill for hover/press on transparent surfaces (`…/interactive/subtle/{hover,pressed}`, `…/interactive/danger-subtle/{hover,pressed}`). |
| **Logical component path** | String like `button/background/ghost/hover` used in spec/rebind maps; not a Figma variable in the current model. |
| **REST sync** | Figma Variables API ↔ JSON in `variables-github-action/tokens/`. |

---

## 17. File index (quick reference)

| File | Role |
|------|------|
| `stories/base-ui/spec/` | Spec types, resolver (CSS, anatomy, tokens), `SPECS` registry |
| `stories/base-ui/components/*/*.spec.ts` | One spec per component |
| `scripts/ds/` | `generate.ts`, `check-figma-parity.ts`, `figma-bind.ts` |
| `stories/base-ui/tokens/shared-overlay-tokens.ts` | Overlay composite definitions |
| `stories/base-ui/tokens/component-button-token-spec.json` | Generated spec + semanticBindings map |
| `stories/base-ui/tokens/figma-semantic.css` | Generated theme CSS from Figma |
| `stories/base-ui/tokens/figma-css-var.ts` | Path → `var(--...)` helpers |
| `scripts/generate-component-button-token-spec.mjs` | Spec generator |
| `scripts/generate-figma-shared-overlay.mjs` | Overlay Figma plugin generator |
| `scripts/sync-figma-semantic-css.mjs` | Figma → CSS |
| `scripts/export-components-tokens-json.mjs` | REST JSON export |
| `variables-github-action/` | PAT, API client, token pull/push |
| `semantic-editor/` | Theme configurator UI |
| `docs/DESIGN_TOKENS_AND_FIGMA_SYNC.md` | This document |

---

## 18. Decision log (chronological summary)

1. **Semantic base + lazy component tokens** — Default to `color/*`; component collection only for exceptions.
2. **Removed mistaken `color/override/*` and bulk `button/*` composites** — Restored semantic-first bindings.
3. **Unified overlay layer (“small style change, big sharing”)** — Ghost, outline, and destructive ghost share overlay semantics instead of 40 per-variant composites.
4. **Renamed `state` → `overlay`** in token paths — Avoid clash with variant state and solid interactive backgrounds.
5. **Removed component-collection color variables** — Layers bind directly to `color/*` and shared overlays.
6. **Primitive → semantic dimensions** — `size/*`, `space/*`, `shape/*` on layers; `scale/*` only under the hood.
7. **Phosphor icons in Storybook demos** — `@phosphor-icons/react` with slot helpers in `shared/`.
8. **Semantic editor** — Left panel layout; token inspector on preview cards with hover and click-to-pin.
9. **Component specs (2026-10-14)** — One spec per component drives code CSS, Figma bindings, parity check, configurator catalog and docs. Button / Icon Button migrated with no visual change; Figma rebound to match (stroke weight, min height, trailing icon, destructive ghost fill).
10. **Legacy component tokens removed (2026-10-14)** — 2,846 unbound tokens from an older system deleted after a JSON and version-history backup.

---

*Last aligned with repository state on 2026-10-14: component specs, Button / Icon Button on specs, legacy component tokens removed. Update this document when adding components, collections, or sync behavior.*
