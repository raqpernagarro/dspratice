---
name: ds-component-sync
description: Two-way parity check between DS-Nagarro Figma component properties (variants, booleans, text, instance swaps) and the React props in code. Fetches component sets into a scratch folder, diffs them against ds-index.json, shows which side changed last, and asks per component whether to update Figma, update code, or record an intentional exception before writing anything. Use when asked to "check component parity", "do Figma components match code", "sync component props", or after a component's props or its Figma set changed. Not for tokens (use ds-token-sync).
---

# DS Component Sync

Two-way: **Figma component properties ⇄ React props**. Nothing is written to either side until the user picks a direction.

- Figma side: `Design Tokens/figma-components.json` (from `scripts/fetch-figma-components.mjs`)
- Code side: `ds-index.json → components.<Name>.props` (from `npm run index:generate`)
- Exceptions: `Design Tokens/component-map.json` — the only place name overrides and intentional gaps live

---

## Step 1 — Fetch Figma into a scratch folder

~~~bash
npm run index:generate   # make sure the code side reflects the working tree
node scripts/fetch-figma-components.mjs --out <scratch>
~~~

Use the session scratchpad directory for `<scratch>`, so the committed snapshot stays untouched until the end. Requires `FIGMA_TOKEN` in `.env`.

If it fails with a token error:

> "fetch:components failed — check that FIGMA_TOKEN is set in .env.
> Get a token at figma.com/settings → Personal access tokens → File content (read only)"

For any other failure (network, API down), stop and report it. There is no manual export path for component properties.

---

## Step 2 — Check for drift

~~~bash
node scripts/sync-components.mjs --file <scratch>/figma-components.json
~~~

Add `--only Button,Tag` to narrow it, `--verbose` to see tried names and code components with no Figma set, `--json` for structured output.

Categories:

- **🧩 UNMATCHED** — Figma set with no code component
- **🆕 FIGMA-ONLY** — Figma prop with no code prop
- **🗑️ CODE-ONLY** — visual code prop (boolean or union) with no Figma prop. Content props (strings, nodes, arrays), handlers, `aria-*` and `default*` are never reported.
- **✏️ VALUES DIFFER** — variant options vs union values, per value
- **🔀 TYPE MISMATCH** — e.g. Figma INSTANCE_SWAP vs code union
- **🏷️ NAME MISMATCH** — the same prop under two names (`Main CTA` ↔ `showMainCta`)

How names are matched, so you can explain a result:

| Figma | Code |
|---|---|
| `Input / Text input` | `TextInput` (last segment, PascalCase; `…Input` tried too) |
| `Show leading icon` BOOLEAN | `showLeadingIcon`, or an optional `leadingIcon` (presence is the toggle) |
| `Avatar` BOOLEAN | `avatar`, then `showAvatar` / `hasAvatar` — first type-compatible wins |
| `Disabled` VARIANT `False/True` | boolean `disabled` |
| `Size` VARIANT `Small, Medium` | `sm, md` (alias table in the map), else kebab-case |
| `State` VARIANT | **ignored** unless code has a `state` prop. `State=Error` marks a code `error` boolean as matched. |
| `badgeVariant`, `tagVariant` … | skipped when a `showBadge` / `showTag` toggle exists — they configure a nested instance |

If output is `✅ Figma components are in sync with code props` — done. Stop here.

---

## Step 3 — Find the latest side and ask

Per drifted component, gather one recency signal per side:

~~~bash
# Figma: file lastModified is in the scratch JSON (top-level "lastModified")
# Code: last commit to the component folder, plus uncommitted edits
git log -1 --format=%cI -- <component path>
git status --porcelain -- <component path>
~~~

Figma only exposes a file-level timestamp, so it is a weak signal — say so when it is the deciding factor.

Show one table per component:

| Figma prop | Code prop | Drift | Suggested fix |
|---|---|---|---|

Then ask with AskUserQuestion, one question per component (batch up to four per call):

- **Update Figma** — code wins. Step 4b.
- **Update code** — Figma wins. Step 4a.
- **Intentional — add to component-map** — Step 4c.
- **Skip for now**

Put the side that changed most recently first, labelled "(Recommended)". A component may need a mix (rename in Figma, add a prop in code) — offer **Decide per prop** in that case and walk the rows.

---

## Step 4a — Update code (Figma → props)

1. Edit the component's `<Name>Props` type and implementation. Follow `AGENTS.md`: boolean `show*` toggles for optional parts, union `variant` / `size`, never a `state` prop for interactive states.
2. Renaming a public prop is a breaking change. Keep the old name as a deprecated alias (`/** @deprecated use x */`) and say so to the user.
3. Update stories, tests and `<Name>.spec.md` (use `ds-component-doc` if the public API changed).
4. Verify:

~~~bash
npm run index:generate
npm run typecheck
npm test
node scripts/sync-components.mjs --file <scratch>/figma-components.json --only <Component>
~~~

---

## Step 4b — Update Figma (props → Figma)

Target is the **main DS-Nagarro library** (`9Lqv0lrj1pRM14NVs4TsSk`). Say so explicitly in the approval prompt. Prefer testing on a duplicate or branch first when the change is large.

Pick the MCP: figma-console (`figma_analyze_component_set`, `figma_add_component_property`, `figma_edit_component_property`) or the official Figma MCP (`use_figma` — load the `figma:figma-use` skill first). Address each set by the `nodeId` in the report.

1. **Read-only first.** Re-read the set's current property definitions and show the planned change table: `Set — property — current → new`.
2. **Apply only after an explicit yes.** Allowed writes:
   - rename a property (`Main CTA` → `Show main CTA`) — keeps instance overrides
   - add a BOOLEAN, TEXT or INSTANCE_SWAP property and bind it to the existing layer
   - rename a variant option value (`Stack with content` → `Stacked`) across the set's variants
3. **Report, don't build:** adding a new variant value or a new VARIANT axis needs new variant components and token bindings — hand that to `figma:figma-generate-library`, or ask the designer.
4. **Never delete** properties, variants or component sets. Ask the designer to remove obsolete ones.
5. Screenshot the set after writing and check nothing shifted.

---

## Step 4c — Record an intentional exception

Edit `Design Tokens/component-map.json`:

- `components["<Figma set>"]` — code component name, or `null` for an intentionally Figma-only set
- `props["<Figma set>"]["<Figma prop>"]` — code prop name (or list of candidates), or `null` for an intentionally Figma-only prop. `props["*"]` holds global synonyms.
- `values` — Figma option → code value aliases (`Small` → `sm`)
- `ignore["<Figma set>"].code` / `.figma` — props that intentionally have no counterpart; `ignore["*"]` applies everywhere

Add a line to `$reasons` for every non-obvious entry. **Never add entries just to silence real drift** — same rule as `ALIAS_EXCEPTIONS` in token sync.

---

## Step 5 — Verify and commit the snapshot

~~~bash
npm run fetch:components   # refresh Design Tokens/figma-components.json
npm run index:generate
npm run sync:components    # must report in sync for the components handled
~~~

Commit the refreshed snapshot together with any code or map changes, so CI diffs the same Figma state.

---

## GitHub Actions

`component-sync.yml` runs every Monday at 8am UTC and on demand (Actions → Component sync check → Run workflow). It diffs the **committed** snapshot against `ds-index.json` — no Figma token in CI, so refresh the snapshot with `npm run fetch:components` when Figma changes.

Red ✗ = drift. Run `/ds-component-sync` to resolve.

---

## Known limits

- Item-level sets (`Breadcrumb item`, `Segment control selector`, `Navigation tab`, `Custom view tab`) map to `null`: in code they are entries of the parent's `items` / `options` / `tabs` array, and item types are not in `ds-index.json`. Check them by hand.
- Code components with no Figma set (charts, Command parts, layout primitives) are listed in `--verbose` only — they are not drift.
- Nested-instance configuration (which badge variant a menu cell shows) is set on the nested instance in Figma and is not compared.

---

## Key rules

- Never write to Figma, component source, or the snapshot before the user picks a direction
- Never delete Figma properties, variants or component sets
- `State` (hover, pressed, focused) is never a code prop — never "fix" drift by adding one
- Renaming a public code prop keeps a deprecated alias
- `component-map.json` entries need a reason; never use them to hide real drift
- `FIGMA_TOKEN` lives in `.env` — never print or commit it
