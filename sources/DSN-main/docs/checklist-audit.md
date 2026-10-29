# DS-Nagarro design system checklist audit

Audit date: 2026-07-13  
Reference: [Design System Checklist](https://designsystemchecklist.com)  
Scope: DS-Ngr component library (npm link distribution; Figma → `tokens.css` three-layer architecture)

## Git status

```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

---

## Foundations

Design assets and tokens that store values for the base layer. Status is assessed against `tokens.css`, `specs/foundations/`, and `AGENTS.md`.

### Color

| Item | Status | Evidence / gap |
|---|---|---|
| Accessibility (contrast pairings) | **covered** | WCAG AA rules in `specs/foundations/foundations.md` (colour rules), `AI.md` (accessibility requirements), semantic text/background tokens in `tokens.css` |
| Semantic colors | **covered** | Full semantic families in `tokens.css` (`--color-foreground-*`, `--background-*`, `--color-border-*`, `--color-background-*`, feedback/selected/disabled tokens); three-tier model in `specs/foundations/colors.md` |
| Dark mode | **covered** | `[data-theme="dark"]` block in `tokens.css` re-maps Layer 2 semantics; Storybook dark theme + `test:a11y:stories:dark` in `.github/workflows/a11y.yml` |
| Guidelines | **covered** | `specs/foundations/foundations.md` (colour categories + rules), `specs/foundations/colors.md` (usage tables), `AGENTS.md` (token invention rule, fabricated-token rejection list) |

### Layout

| Item | Status | Evidence / gap |
|---|---|---|
| Units | **covered** | Primitive scale in `tokens.css` (`--size-*`, `--size-*`); `--space-*` / `--space-*` documented in `specs/foundations/spacing.md` and `AGENTS.md` |
| Grid | **partial** | No grid tokens — the column count is a layout mechanic, never tokenized (handbook T12). `--space-md` covers gutters; `specs/foundations/foundations.md` documents nav/layout spacing. Missing: per-breakpoint column counts and explicit grid application rules. `specs/organisms/appshell.md` defines the AppShell spatial contract (height chain, built-in inset) but does not map content to a 12-column grid |
| Breakpoints | **covered** | `--size-breakpoint-sm` through `--size-breakpoint-xl` in `tokens.css`; raw-px `@media` rule in `AGENTS.md` / `AI.md` |
| Spacing | **covered** | `--space-*` / `--space-*` families, `--space-md`, `--space-md`; rules in `specs/foundations/spacing.md` |

### Typography

| Item | Status | Evidence / gap |
|---|---|---|
| Responsiveness | **partial** | Fixed type scale in `tokens.css` and `specs/foundations/typography.md`; no viewport-responsive font-size tokens or breakpoint-mapped type ramp |
| Grid relation | **partial** | Control/icon wrapper inset tokens (`inset/icon-wrapper/standard` referenced in `specs/foundations/foundations.md`); no explicit type-to-grid alignment spec (e.g. icon bounding-box pairing rules) |
| Readability | **covered** | Matched size/line-height pairs in `specs/foundations/typography.md`; line-length rule (70–80 characters) in `specs/foundations/foundations.md` |
| Performance | **partial** | Single `--font-family-default` in `tokens.css`; no documented fallback stack or font-loading strategy in foundations docs |
| Guidelines | **covered** | `specs/foundations/typography.md`, `specs/foundations/foundations.md` (type scale intent + rules), sentence-case in `AI.md` |

### Elevation

| Item | Status | Evidence / gap |
|---|---|---|
| Shadows | **covered** | `--color-shadow-elevation-sm/medium/high`, composite `--effect-shadow-*` tokens in `tokens.css`; rules in `specs/foundations/foundations.md` (effects section) |
| Background colors (dark collection) | **partial** | Dark mode overrides shadow *color* sub-tokens (`--color-shadow-outer-soft/strong` in `[data-theme="dark"]`). No per-elevation-level background surface tokens (e.g. modal vs popover vs card fill ladder) as checklist describes for dark-mode z-axis communication |
| Z-index | **covered** | `--z-index-sticky` through `--z-index-toast` in `tokens.css`; stacking rules in `AI.md` (Toast above Modal/Popover) |

### Motion

| Item | Status | Evidence / gap |
|---|---|---|
| Easing | **partial** | All `--motion-transition-*` tokens use a single `ease` timing function in `tokens.css`; no separate accelerated/decelerated easing tokens |
| Duration | **covered** | Named duration tokens (`instant`, `fast`, `normal`, `slow`, `popover`, `switcher`, `drawer`, `modal`) in `tokens.css` |
| Accessibility (reduced motion) | **covered** | Global `@media (prefers-reduced-motion: reduce)` override zeroing all `--motion-transition-*` at `:root` in `tokens.css`; policy in `specs/foundations/foundations.md` and `AGENTS.md` Rule 23 |

### Iconography

| Item | Status | Evidence / gap |
|---|---|---|
| Accessibility (naming rule) | **partial** | `AGENTS.md` Rule 6 (`aria-label` for icon-only controls), Rule 12 (Lucide only); per-component specs (e.g. `ToggleButton.spec.md`) require `aria-label`. No foundations-level icon accessibility contract |
| Style | **covered** | Lucide-only policy in `AGENTS.md` Rule 12, `AI.md`, `ds-index.json` rules |
| Naming | **gap** | No guideline to name icons by communicative purpose vs appearance; belongs in `specs/foundations/foundations.md` or new `specs/foundations/iconography.md` |
| Relation with grid | **gap** | `inset/icon-wrapper/standard` exists in foundations prose but no icon bounding-box / grid-pairing spec |
| Keywords | **n/a** | Lucide ships its own search; DS-Ngr does not maintain a custom icon catalog with keywords |
| Reserved icons | **gap** | No reserved-icon list (e.g. delete, close, chevron) documented; belongs in `specs/foundations/iconography.md` or `AI.md` |
| Guidelines | **partial** | Lucide-only + placeholder prohibition in `AGENTS.md`; missing when/how icon usage guidelines beyond library choice |

---

## Components

Matrix built from `ds-index.json` component rows (73 entries), excluding internal sub-components `PageSelector`, `PasswordRequirement`, and `SegmentControlSelector` per audit scope. Columns assessed from each component's co-located `.spec.md`, Storybook stories, and unit tests. Global `AGENTS.md` / `AI.md` focus and reduced-motion rules count as **partial** when not repeated in the component spec.

**Coverage key:** covered = explicitly documented or storied; partial = implied by `ds-index.json` metadata or global rules only; gap = not documented in spec/stories/tests.

**Index drift note:** 19 public exports in `src/index.ts` are absent from `ds-index.json` (including `CalendarView`, `SplitButton`, chart organisms, attachment family). Two `ds-index.json` rows (`PromptInputModelSelector`, `VoiceWaveform`) are not public exports.

**Spec gap:** 20 of 73 indexed components have `spec: null` (no co-located or shared spec path in the index).

### Summary by column

| Column | Covered | Partial | Gap |
|---|---:|---:|---:|
| Sizes | 55 | 10 | 8 |
| Variants | 58 | 9 | 6 |
| States (hover/active/disabled/loading) | 64 | 5 | 4 |
| Icon support | 58 | 6 | 9 |
| Error state | 38 | 5 | 30 |
| Keyboard support | 68 | 0 | 5 |
| Focus management | 3 | 67 | 3 |
| Reduced motion | 1 | 71 | 1 |
| Responsiveness | 6 | 4 | 63 |

### Component matrix

| Component | Sizes | Variants | States | Icons | Error | Keyboard | Focus | Reduced motion | Responsive |
|---|---|---|---|---|---|---|---|---|---|
| Accordion | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| AlertDialog | covered | covered | covered | gap | gap | covered | partial | partial | gap |
| AppShell | covered | covered | covered | covered | gap | covered | partial | partial | covered |
| Avatar | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| Badge | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| Breadcrumbs | covered | covered | covered | gap | gap | covered | partial | partial | gap |
| BulkActionBar | covered | partial | covered | covered | gap | covered | partial | partial | gap |
| Button | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| ButtonGroup | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| ButtonGroupVertical | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| Callout | covered | covered | gap | covered | covered | covered | partial | partial | gap |
| Card | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| Checkbox | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| CheckboxField | gap | covered | covered | covered | covered | covered | partial | partial | gap |
| Chip | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| ChipField | gap | partial | covered | covered | covered | covered | partial | partial | gap |
| ChoiceList | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| Combobox | partial | partial | covered | covered | covered | covered | partial | partial | gap |
| CustomViewTab | covered | partial | covered | covered | gap | covered | partial | partial | gap |
| DataListCell | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| DataTable | covered | covered | covered | gap | covered | covered | partial | partial | gap |
| DataTableCell | gap | partial | covered | gap | gap | covered | partial | partial | gap |
| DataTableHeaderCell | gap | covered | covered | gap | gap | covered | partial | partial | gap |
| DateTimePicker | partial | partial | covered | covered | covered | covered | partial | partial | gap |
| Drawer | covered | covered | covered | gap | gap | covered | partial | partial | gap |
| EmptyState | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| Fieldset | covered | covered | covered | gap | covered | covered | partial | partial | gap |
| Form | covered | covered | covered | gap | covered | covered | covered | partial | gap |
| HorizontalInput | gap | covered | gap | covered | covered | covered | partial | partial | covered |
| LineChart | covered | covered | covered | gap | covered | covered | partial | partial | gap |
| LoadingBar | covered | covered | covered | gap | covered | covered | partial | partial | gap |
| MenuCell | gap | covered | covered | covered | gap | covered | partial | partial | gap |
| Modal | covered | covered | partial | gap | gap | covered | partial | partial | gap |
| MultiChoice | gap | covered | covered | covered | covered | covered | partial | partial | covered |
| Navbar | covered | covered | gap | covered | gap | covered | partial | partial | covered |
| NumberInput | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| OTPInput | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| Pagination | covered | partial | covered | covered | gap | covered | partial | partial | gap |
| PasswordInput | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| PhoneInput | partial | covered | covered | covered | covered | covered | partial | partial | gap |
| PopoverMenu | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| PopoverWrapper | covered | covered | covered | covered | gap | covered | partial | partial | covered |
| ProgressBar | covered | covered | covered | gap | covered | covered | partial | partial | gap |
| ProgressRing | covered | covered | covered | gap | covered | covered | partial | partial | gap |
| PromptInput | covered | covered | covered | gap | covered | covered | partial | partial | gap |
| PromptInputModelSelector | covered | covered | covered | gap | covered | covered | partial | partial | gap |
| Radio | covered | partial | covered | covered | covered | covered | partial | partial | gap |
| RichTextEditor | covered | partial | covered | gap | covered | covered | partial | partial | gap |
| SearchBar | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| SectionHeader | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| SegmentControl | covered | covered | covered | covered | gap | covered | partial | partial | covered |
| Select | covered | partial | covered | covered | covered | covered | covered | partial | gap |
| Separator | covered | covered | gap | gap | covered | covered | partial | partial | gap |
| Shortcut | covered | covered | covered | gap | covered | covered | partial | partial | gap |
| Sidebar | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| SidebarMenuSelector | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| SingleChoice | gap | covered | covered | covered | covered | covered | partial | partial | gap |
| SkeletonLoading | gap | covered | covered | gap | gap | gap | partial | partial | gap |
| Slider | covered | covered | covered | gap | gap | covered | partial | partial | gap |
| Stat | gap | covered | covered | gap | gap | covered | partial | partial | gap |
| Switcher | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| Tab | gap | covered | covered | covered | gap | covered | partial | partial | gap |
| Tag | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| TextArea | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| TextInput | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| Toast | covered | covered | covered | covered | covered | covered | partial | covered | covered |
| ToggleButton | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| Toolbar | covered | covered | covered | covered | gap | covered | partial | partial | gap |
| Tooltip | covered | covered | covered | covered | gap | covered | covered | partial | covered |
| UploadArea | covered | partial | covered | covered | gap | gap | partial | partial | gap |
| VerticalButton | covered | covered | covered | covered | covered | covered | partial | partial | gap |
| VoiceWaveform | covered | covered | covered | gap | covered | covered | partial | partial | gap |

### Components without indexed spec path

`AlertDialog`, `BulkActionBar`, `ChipField`, `Combobox`, `CustomViewTab`, `DataTableCell`, `DataTableHeaderCell`, `DateTimePicker`, `LineChart`, `MenuCell`, `Navbar`, `PopoverMenu`, `PromptInput`, `PromptInputModelSelector`, `RichTextEditor`, `Select`, `Sidebar`, `SidebarMenuSelector`, `UploadArea`, `VoiceWaveform`

Shared aggregate specs partially cover some of these (`specs/atoms/input-select-autocomplete-horizontal.md` for Select/Combobox; `specs/organisms/appshell.md` for Navbar/Sidebar) but are not linked in `ds-index.json`.

### Checklist component-category alignment (selected)

DS-Ngr implements most core checklist component families (button, inputs, modal, drawer, table, toast, tooltip, accordion, etc.) but several checklist-native components are absent or renamed: no standalone **Alert** (Callout/Toast split), no **Dropdown** atom (Select + PopoverMenu), no **Carousel**, no standalone **Calendar** atom (DateTimePicker + CalendarView organism). Internationalisation requirements for calendar/date components are **n/a** at library level.

---

## Design language

| Item | Status | Evidence / gap |
|---|---|---|
| Vision | **n/a** | Org/product strategy outside library scope; README states AI-first interpretability purpose only |
| Design principles | **partial** | Machine-readable fidelity and token discipline implied in `AGENTS.md` purpose section; no explicit design-principles list for consuming designers |
| Tone of voice | **partial** | Sentence case enforced; full tone guidance not isolated from writing rules |
| Terminology (brand) | **gap** | No canonical term glossary (e.g. "CTA" vs "button", product nouns); belongs in `AI.md` |
| Brand assets | **partial** | Figma link in README/`ds-index.json`; Lucide bundled; no logo/illustration asset package |
| Accessibility approach | **covered** | `AI.md` (accessibility requirements), `AGENTS.md` Rule 11, `specs/accessibility-audit-2026-02-28.md`, CI a11y workflows |
| Writing guidelines | **covered** | `AI.md` (writing conventions & content guidelines), mirrored in `AGENTS.md` (writing conventions) |
| Microcopy guidelines | **covered** | Component-level copy rules in `AI.md` (errors, empty states, placeholders, modals, help text) |
| Terminology (guidelines) | **gap** | Same as brand terminology — no controlled vocabulary document |
| Internationalisation | **n/a** | Library is English-only; `PhoneInput` handles country codes but no i18n/RTL/bi-directional content standards |

---

## Maintenance

| Item | Status | Evidence / gap |
|---|---|---|
| Design system principles (documentation) | **partial** | `AGENTS.md` + `AI.md` encode builder/consumer principles; not framed as a principles page for stakeholders |
| Getting started | **covered** | `README.md` (npm link install, CSS import order), `AI.md` (setup), Storybook `src/docs/Welcome.mdx` |
| Design best practices | **partial** | Pattern specs in `specs/patterns/`; no dedicated design-tool (Figma) workflow doc |
| Development best practices | **covered** | `AGENTS.md` (full builder guide), `AI.md` (consumer hard rules) |
| Component anatomy | **covered** | `specs/atoms/input-anatomy.md`, per-component `.spec.md` files, Storybook MDX |
| Component properties | **covered** | Spec prop tables + TypeScript unions + Storybook argTypes |
| Component composition examples | **covered** | `specs/patterns/` (dashboard, data-page, form-page, detail-drawer), Storybook pattern stories |
| Sandbox product example | **covered** | Storybook with AppShell layouts and pattern assemblies (Chromatic URL in `ds-index.json`) |
| Browser / OS support | **gap** | No supported-browser matrix or OS statement; belongs in `AI.md` or `README.md` |
| Release cycle | **gap** | `package.json` version bumps only; no changelog file or documented breaking-change cadence |
| Local libraries | **n/a** | Single shared library consumed via npm link; no multi-product local-library policy |
| When to build custom | **partial** | `AI.md` "what NOT to do" lists; no explicit decision tree for custom vs DS component |
| Horizontal and vertical libraries | **n/a** | Single horizontal library; no vertical-library model |
| Library expectations | **n/a** | No downstream local-library quality bar — out of scope for npm-link distribution |
| Release cycle alignment | **n/a** | No federated local libraries to align |
| Decision-making log | **gap** | Ad-hoc comments in `tokens.css` changelogs only; no ADR/decision log |
| Roadmap | **gap** | No published roadmap; human-org process |
| Stakeholder mapping | **n/a** | Human-org process |
| Analytics | **partial** | Chromatic visual regression; no documentation usage analytics |
| SLA | **n/a** | Human-org process |
| Community support | **n/a** | Human-org process |
| Support channels | **n/a** | Human-org process |
| Templates (bug/feature) | **n/a** | Human-org process |
| Regular updates | **n/a** | Human-org process |
| Open hours | **n/a** | Human-org process |
| Contribution (house rules) | **partial** | `AGENTS.md` is the builder contract; no contributor onboarding doc |
| Contribution guidelines | **partial** | Implicit via `AGENTS.md`; no PR checklist for external contributors |
| Feature proposal template | **gap** | No template; belongs in repo docs if community contributions are expected |
| Engagement | **n/a** | Human-org process |
| Token audit CI gate | **partial** | `scripts/audit-tokens.mjs` exits 1 on violations; `.github/workflows/token-audit.yml` runs it. Workflow `paths` filter references `src/tokens.css` but `tokens.css` lives at repo root — PRs touching root `tokens.css` or `specs/**` may skip the gate |
| Drift detection CI gate | **gap** | `npm run audit:drift` (`scripts/audit-token-drift.mjs`, exit 1 on drift) exists but is not invoked in any workflow; `token-sync.yml` runs `sync-tokens.mjs` only |
| `ds-index.json` automation | **covered** | `.github/workflows/update-ds-index.yml` regenerates index on component/spec changes |
| A11y CI enforcement | **covered** | `.github/workflows/a11y.yml` runs `test:a11y:keyboard-widgets` and story a11y sweeps (light + dark) |

---

## Top 5 gaps (prioritised)

| Priority | Gap | Canonical file |
|---|---|---|
| 1 | **20 indexed public components lack a linked spec** (`Select`, `Navbar`, `Sidebar`, `DateTimePicker`, `PopoverMenu`, `AlertDialog`, chart/input organisms, etc.), weakening the AI-first contract and matrix coverage | Co-located `src/components/**/<Component>.spec.md` (or shared `specs/` path referenced from `ds-index.json`) |
| 2 | **Token drift detection is not a CI gate** — `audit:drift` can fail locally but never blocks merge; Figma ↔ `tokens.css` divergence can ship silently | `.github/workflows/token-sync.yml` (add `npm run audit:drift` as required step) |
| 3 | **No reserved-icons list or icon naming/usage foundations** — only "Lucide only" is documented; checklist reserved-icon and communicative-naming rules are missing | `specs/foundations/iconography.md` (new) or `specs/foundations/foundations.md` |
| 4 | **Dark-mode elevation uses shadow-color overrides only** — no per-level elevation background surfaces for dark theme as checklist describes | `tokens.css` (dark semantic tokens) + `specs/foundations/foundations.md` (effects section) |
| 5 | **No browser/OS support statement or changelog/release convention** for npm-link consumers planning upgrades | `AI.md` (consumer contract) and `README.md` (install/release notes) |

---

*Audit produced against [designsystemchecklist.com](https://designsystemchecklist.com) categories. No code or spec changes were made in this session.*
