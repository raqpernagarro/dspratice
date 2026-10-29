---
name: ds-a11y-patrol
description: Audit DS-Nagarro components, tokens, and documentation for WCAG 2.2 and ADA compliance. Use when asked to "check accessibility", "run an a11y audit", "are we WCAG compliant", "check contrast", "audit for ADA", or any time a component is added or modified and accessibility should be verified. Also trigger proactively when a new component, token change, or interactive pattern is introduced in a session.
---

# DS-Nagarro — Accessibility Patrol Skill

This skill audits DS-Nagarro for compliance with WCAG 2.2 (W3C) and ADA Design Standards. It operates at two levels: **token-level** (are the raw values compliant?) and **component-level** (is the markup and behaviour correct?). It produces a report and — where fixable via documentation — outputs the exact rule to add to `AI.md` or `AGENTS.md`.

---

## Reference standards

This skill enforces two standards. Know the difference.

### WCAG 2.2 (W3C)
URL: https://www.w3.org/WAI/standards-guidelines/wcag/

Three conformance levels:
- **A** — minimum. Non-negotiable.
- **AA** — target for all production design systems. DS-Nagarro targets AA.
- **AAA** — aspirational; audit for it but don't block on it.

Key criteria referenced in this skill:
- **1.4.3** Contrast (Minimum) — AA — text contrast ≥ 4.5:1 (normal), ≥ 3:1 (large text ≥ 18pt / 14pt bold)
- **1.4.11** Non-text Contrast — AA — UI component borders, focus indicators, icons ≥ 3:1 against adjacent colour
- **1.4.4** Resize Text — AA — text scales to 200% without loss of content
- **1.4.10** Reflow — AA — content reflows at 320px without horizontal scroll
- **1.4.12** Text Spacing — AA — no content loss when letter/word/line spacing overrides applied
- **2.1.1** Keyboard — A — all functionality operable via keyboard
- **2.1.2** No Keyboard Trap — A — focus must be escapable from any component
- **2.4.3** Focus Order — A — focus sequence preserves meaning and operability
- **2.4.7** Focus Visible — AA — keyboard focus indicator must be visible
- **2.4.11** Focus Appearance — AA (2.2 new) — focus indicator meets minimum size and contrast
- **2.5.3** Label in Name — A — visible label text must be contained in accessible name
- **2.5.7** Dragging Movements — AA — functionality that uses dragging must also be operable by a **single-pointer** action without dragging (click/tap menu, pick-up/drop clicks, or equivalent). **Keyboard alternatives satisfy 2.1.1 only — they are not evidence of 2.5.7 conformance.**
- **3.2.2** On Input — A — no unexpected context change on input
- **4.1.2** Name, Role, Value — A — all UI components have accessible name, role, and state

### ADA Design Standards
URL: https://www.ada.gov/law-and-regs/design-standards/

For digital products, ADA compliance is achieved through WCAG 2.1 AA conformance (DOJ rule, March 2024). The ADA does not define separate digital contrast or keyboard rules — it defers to WCAG. Where this skill references "ADA", it means: WCAG 2.1 AA minimum, and WCAG 2.2 AA as current best practice.

---

## What this skill audits

Three scopes. Run the ones relevant to what was changed.

### Scope A — Token audit (colour only)

Check the semantic colour tokens in `tokens.css` (or the provided token files) against WCAG contrast requirements.

Token pairs to evaluate — always run these:

| Background token | Foreground token | Required ratio | Context |
|---|---|---|---|
| `--color-background-neutral-primary` | `--color-foreground-neutral-primary` | 4.5:1 | Body text |
| `--color-background-neutral-primary` | `--color-foreground-neutral-secondary` | 4.5:1 | Secondary text |
| `--color-background-neutral-primary` | `--input-foreground-placeholder` | 4.5:1 | Placeholder (must pass) |
| `--color-background-neutral-primary` | `--color-foreground-interactive-disabled` | — | Disabled — exempt from 1.4.3 |
| `--color-background-interactive-primary-default` | `--color-foreground-inverse-primary` | 4.5:1 | Primary button label |
| `--color-background-interactive-primary-hover` | `--color-foreground-inverse-primary` | 4.5:1 | Primary button label on hover |
| `--color-background-error-soft-default` | `--color-foreground-error-strong` | 4.5:1 | Error message text |
| `--color-background-warning-soft-default` | `--color-foreground-warning-strong` | 4.5:1 | Warning message text |
| `--color-background-success-soft-default` | `--color-foreground-success-strong` | 4.5:1 | Success message text |
| `--color-background-neutral-primary` | `--color-border-neutral-primary` | 3:1 | Input borders (1.4.11) |
| `--color-background-neutral-primary` | `--color-background-interactive-primary-default` | 3:1 | Primary button boundary (1.4.11) |
| `--color-background-neutral-primary` | `--color-shadow-focus-inset` | 3:1 | Focus ring vs. page background (1.4.11 / 2.4.11) |
| `--color-background-neutral-primary` | `--color-border-interactive-focus` | 3:1 | Focus ring (secondary variant) vs. page background (1.4.11 / 2.4.11) |

**For each pair:**
1. Resolve the alias chain to get the raw hex value. Both light and dark modes.
2. Calculate WCAG contrast ratio: `(L1 + 0.05) / (L2 + 0.05)` where L = relative luminance.
3. Compare against the required ratio.
4. Flag failures with severity: **Critical** (< 3:1), **Fail** (< required), **Pass**, **AAA** (≥ 7:1).

**Disabled token exception:** `--color-foreground-interactive-disabled` is intentionally low-contrast. Do not flag it. WCAG 1.4.3 explicitly exempts disabled UI components from contrast requirements.

**Dataviz token gap:** `--color-{background|border|foreground}-dataviz-*` tokens currently hold raw hex as a known architectural gap. Flag contrast failures but note the architectural gap separately — these are not ignorable long-term.

**Focus ring alias trap:** `--color-shadow-focus-inset` and `--color-border-interactive-focus` are themselves aliases (e.g. to `--color-background-neutral-primary` or an accent token). An alias chain can silently resolve a focus ring token to the *same* value as the background it sits on — a 1:1 ratio, invisible in both light and dark mode, while still passing a naive "is this token used" check. Always resolve the full chain to a raw hex before computing the ratio for these two pairs; never assume the token name implies a visible color.

### WCAG 2.5.7 (Dragging movements) — evaluation rule

**Criterion:** [WCAG 2.5.7 Dragging Movements (Level AA)](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) — any function operated by dragging must have an alternative that uses a **single pointer** without dragging.

**What counts as 2.5.7 evidence (pass):**
- Click/tap menu item (e.g. "Move left", "Move right")
- Separate click to pick up + click to drop (no drag gesture between)
- Other **single-pointer** UI that completes the action without path-based dragging

**What does NOT count as 2.5.7 evidence (do not pass on this basis):**
- Keyboard shortcuts (Ctrl+Arrow, Arrow keys on a focused control) — these address **2.1.1 Keyboard**, not 2.5.7
- Requiring a separate "Reorder column" drag handle when the only non-keyboard path is still drag
- Documented intent without an implemented click/tap path

**Audit procedure for drag features:**
1. Identify every interaction that uses `draggable`, drag events, or pointer path movement.
2. Search for a **non-drag pointer** path to the same outcome in component source (menus, buttons, pick-up/drop clicks).
3. If only keyboard + drag exist → **2.5.7 Fail** (even if 2.1.1 Pass).
4. Record 2.1.1 and 2.5.7 as **separate line items** in the report — never collapse them.

### Scope B — Component checklist

For each component listed, verify the following. Read component source from `~/Documents/GitHub/DSN/src/` if available; otherwise audit against the checklist as a documentation task.

#### Interactive components — apply to Button, IconButton, Input, Select, Checkbox, Radio, Toggle, SegmentControl, DatePicker, Modal, Drawer, Popover, Tooltip, Tabs

- [ ] Has accessible name — `aria-label`, `aria-labelledby`, or visible text label
- [ ] Role is correct — native element or explicit `role` attribute
- [ ] State is exposed — `aria-disabled`, `aria-expanded`, `aria-selected`, `aria-checked`, `aria-invalid` as appropriate
- [ ] Focus ring visible — uses `--color-focus-ring` token (or equivalent); never `outline: none` without a replacement
- [ ] Focus ring is implemented with `box-shadow`, never `outline` — `outline` is clipped by any `overflow: hidden` ancestor (AppShell, DataTable's scroll region, Drawer, Popover all rely on it for scroll isolation). Read the component's CSS/styles file directly; don't infer this from the spec. See AGENTS.md Common Mistakes.
- [ ] Focus ring contrast ≥ 3:1 against adjacent background (WCAG 2.4.11) — resolve the token's full alias chain first (see "Focus ring alias trap" above)
- [ ] Keyboard operable — Enter/Space to activate, Escape to close/cancel, arrow keys for grouped controls
- [ ] No keyboard trap — Tab/Shift+Tab always reaches an exit

#### Form components — Input, Select, Textarea, Checkbox, Radio, DatePicker

- [ ] Label is programmatically associated — `<label htmlFor>` or `aria-labelledby`
- [ ] Error state exposes message — `aria-describedby` pointing to error text; `aria-invalid="true"` on the field
- [ ] Required fields use `aria-required="true"` — never rely on colour alone
- [ ] Placeholder is not the only label — placeholder disappears on input; the label must persist

#### Modal and Drawer

- [ ] Focus moves to modal on open
- [ ] Focus is trapped inside while open — Tab cycles only within the modal
- [ ] Escape closes it
- [ ] Focus returns to the trigger element on close
- [ ] Background content has `aria-hidden="true"` while modal is open

#### DataTable

- [ ] `<table>` semantics used — `<thead>`, `<tbody>`, `<th scope="col">`, `<td>`
- [ ] Sortable columns announce sort state — `aria-sort="ascending"` / `"descending"` / `"none"` on `<th>`
- [ ] Row selection uses `aria-selected` — not just visual highlight
- [ ] Empty state announced — not silently empty
- [ ] **WCAG 2.5.7 (Dragging movements)** — if column reorder (or any feature) uses drag, a **single-pointer non-drag** path must exist (e.g. Column options → Move left / Move right). **Pass criterion:** at least one click/tap sequence completes the action without a drag gesture. **Fail if:** drag is the only pointer path, even when keyboard reorder exists (keyboard proves 2.1.1, not 2.5.7). See [2.5.7 evaluation rule](#wcag-257-dragging-movements--evaluation-rule) below.
- [ ] **WCAG 2.1.1 (Keyboard)** — column reorder (and other table chrome) operable via keyboard (e.g. Ctrl/Cmd+Arrow on focused header). Keyboard and 2.5.7 are separate checks.

#### Tag / Badge

- [ ] Colour is never the only indicator of meaning — label text or icon must co-communicate status
- [ ] Interactive tags (if clickable/removable) have accessible name and keyboard handler

#### Navigation (AppShell, Sidebar, Breadcrumb)

- [ ] Landmark roles present — `<nav>`, `<main>`, `<header>`, `<aside>` or equivalent ARIA landmarks
- [ ] `<nav>` elements have unique `aria-label` when there are multiple nav regions
- [ ] Active/current page indicated — `aria-current="page"` on active nav item
- [ ] Skip link available — "Skip to main content" as first focusable element

#### Notification / Toast / Alert

- [ ] Live region — `role="status"` (polite) or `role="alert"` (assertive) as appropriate
- [ ] Not auto-dismissed before user can read — or dismissal is pausable

### Scope C — Documentation audit

Check `AI.md` and `AGENTS.md` for accessibility rules. A missing rule in the docs is a documentation failure, not just a component failure.

Check for:

- [ ] `AI.md` has a dedicated accessibility section or a11y rules embedded in component rules
- [ ] `AI.md` states: never remove focus ring styles
- [ ] `AI.md` states: colour is never the only indicator of state or meaning
- [ ] `AI.md` states: always use semantic HTML — `<button>` not `<div onClick>`
- [ ] `AI.md` states: all interactive elements must have an accessible name
- [ ] `AI.md` states: form fields must have associated labels — never placeholder-only
- [ ] `AI.md` states: error messages must be associated via `aria-describedby`
- [ ] `AI.md` states: focus must never be hidden by `overflow: hidden` on a parent
- [ ] `AGENTS.md` states: new components must pass the component checklist before merging
- [ ] `AGENTS.md` states: tokens with colour intent (interactive, feedback) must meet WCAG AA contrast
- [ ] `AGENTS.md` states: focus rings are implemented with `box-shadow`, never `outline` (Common Mistakes list) — and this doesn't contradict `AI.md`'s "focus must never be hidden by overflow: hidden" consumer-facing rule above

---

## Step 1 — Determine scope

Ask (or infer from context) what triggered the audit:

- Token change → run Scope A
- New component → run Scope B (that component) + Scope C
- Full audit → run all three scopes
- "Are the docs accessible?" → run Scope C only

If running from a fresh session with no context: run all three scopes.

---

## Step 2 — Run token contrast calculations

For Scope A, you need hex values. Resolve the full alias chain:

1. Read `tokens.css` (or the provided token JSON files if tokens.css is unavailable)
2. Trace alias chains to raw hex — e.g. `--color-foreground-neutral-primary` → `var(--color-neutral-900)` → `#18181B`
3. For each pair in the table, calculate relative luminance and contrast ratio

**Relative luminance formula:**
```
For each channel (R, G, B):
  c_sRGB = channel / 255
  if c_sRGB <= 0.04045: c = c_sRGB / 12.92
  else: c = ((c_sRGB + 0.055) / 1.055) ^ 2.4

L = 0.2126 * R + 0.7152 * G + 0.0722 * B

Ratio = (max(L1, L2) + 0.05) / (min(L1, L2) + 0.05)
```

Do this for both light mode and dark mode token values.

---

## Step 3 — Run component and documentation checks

For Scope B, check each applicable component against its checklist. Mark each item:
- ✅ Pass
- ❌ Fail — with specific issue
- ⚠️ Cannot verify without source (note what to check manually)
- N/A — not applicable to this component

For Scope C, read `AI.md` and `AGENTS.md` and check for each rule. Mark missing rules.

---

## Step 4 — Output the audit report

```
## A11y patrol — [date]
## Standard: WCAG 2.2 AA / ADA

---

### 🔴 Critical failures (block release)
- [Token pair or component]: [issue] — Ratio X:1, required Y:1 / Missing aria-* / etc.

### 🟠 AA failures (fix before next release)
- [item]: [issue]

### 🟡 Documentation gaps (add to AI.md or AGENTS.md)
- Missing rule: [exact rule text to add] → add to [file, section]

### 🔵 AAA opportunities (nice to have)
- [item]: currently X:1, AAA requires 7:1

### ⚪ Known exceptions (do not fix)
- --color-foreground-interactive-disabled: intentionally low-contrast — WCAG 1.4.3 exempts disabled elements
- --color-{background|border|foreground}-dataviz-*: raw hex tokens, known architectural gap — flag for future primitives work

### ✅ Passing
- [list what passed]

---

### Summary
- Critical: N
- AA failures: N
- Doc gaps: N
- AAA opportunities: N
```

---

## Step 5 — Output documentation fixes

For every documentation gap found in Scope C, output the exact text to add. Format as a ready-to-paste patch.

```
## Documentation patches

### AI.md — add to [section name]

[exact text to insert]

### AGENTS.md — add to [section name]

[exact text to insert]
```

Follow the same rules as ds-doc-audit: surgical patches only, never restructure, preserve existing formatting.

---

## Step 6 — Output a Claude Code prompt (if component fixes are needed)

If component-level failures exist that require code changes, output a Claude Code prompt:

```
## Claude Code prompt — a11y fixes

Open: ~/Documents/GitHub/DSN

Fix the following accessibility failures:

### [ComponentName]
- [Issue]: [what to fix]
  - Expected: [correct aria attribute / HTML element / keyboard handler]
  - File: src/components/[ComponentName]/[ComponentName].tsx

Constraints:
- Use semantic HTML where possible — prefer native elements over ARIA overrides
- Never remove focus styles — only replace outline with a custom focus-visible style
- Icons come from `lucide-react` only — no other icon library, no emoji
- Do not change visual design — a11y fixes are structural/attribute changes only
- Verify with: [manual check or automated test description]
```

---

## What not to do

- Don't flag `--color-foreground-interactive-disabled` contrast as a failure — it is intentionally exempt
- Don't invent ARIA roles or attributes not in the WCAG spec
- Don't recommend ARIA when native HTML semantics achieve the same result — prefer native
- Don't suggest `role="presentation"` or `aria-hidden` on focusable elements
- Don't treat AAA as a requirement — flag it as an opportunity only
- Don't output component code changes directly — output a Claude Code prompt instead (Rui reviews before running)
- Don't audit `StoryUIPanel.css` — it is intentionally isolated Storybook infrastructure

---

## Quick reference — most common failures in component libraries

In order of frequency. Check these first on any component audit.

1. **Missing focus ring** — `outline: none` or `outline: 0` with no replacement → WCAG 2.4.7 fail
2. **Icon button with no label** — `<button><svg></button>` with no `aria-label` → WCAG 4.1.2 fail
3. **Placeholder as label** — Input with placeholder but no `<label>` → WCAG 1.3.1 fail
4. **Error by colour only** — Red border with no text message → WCAG 1.4.1 fail
5. **Modal no focus trap** — Tab leaves the modal → WCAG 2.1.2 fail
6. **Interactive div** — `<div onClick>` instead of `<button>` → WCAG 4.1.2 fail
7. **Missing live region on toast** — Dynamic content not announced to screen reader → WCAG 4.1.3 fail
8. **Contrast regression in dark mode** — Light mode passes, dark mode fails (check both)
9. **Sort state not announced** — DataTable column sort has no `aria-sort` → WCAG 4.1.2 fail
10. **Active nav item not marked** — No `aria-current="page"` → WCAG 1.3.1 fail
11. **Focus ring rendered via `outline` instead of `box-shadow`** — Looks correct in isolation but gets silently clipped by any `overflow: hidden` ancestor (AppShell, DataTable's scroll region, Drawer, Popover) → WCAG 2.4.7 fail in practice, invisible to a code-only review that doesn't check ancestor overflow. Found across 10 components in a July 2026 audit; see AGENTS.md Common Mistakes.
12. **Focus ring token aliased to the background token** — `--color-border-focus-*` resolves through the alias chain to the same value as the adjacent background, producing a 1:1 contrast ratio → WCAG 1.4.11 / 2.4.11 fail. Only catchable by resolving the full chain to hex, not by reading the token name.
13. **Drag-only pointer path with keyboard offered as 2.5.7 fix** — Column reorder (or similar) implemented with drag + keyboard but no click/tap menu → WCAG 2.5.7 fail; keyboard only satisfies 2.1.1. See [2.5.7 evaluation rule](#wcag-257-dragging-movements--evaluation-rule).
