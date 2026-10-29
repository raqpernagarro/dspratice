---
name: ds-figma-apply
description: Pushes DS-Nagarro design tokens (DTCG JSON) into a Figma file's variables through a Figma MCP, with a read-only parity check first. Use when asked to "send to Figma", "apply tokens to Figma", "push the theme to Figma", "check Figma parity", or when a theme export from the docs site (theme.tokens.json) needs to land in Figma. Input is a Figma file URL plus a tokens JSON path. Not for the full token set or for pulling Figma → code (use ds-token-sync, which syncs tokens.css and Figma in either direction).
---

# DS Figma Apply

Direction: **tokens JSON → Figma variables** (code → design). For a full two-way sync between `tokens.css` and the main library (either direction), use `ds-token-sync`; this skill is for theme and palette payloads.

The docs site's Brands page (`/brands` → Send to Figma) copies a prompt with the same rules as this skill. Its source is `site/lib/theme/figma-handoff.ts` — keep both in sync.

---

## Inputs

- **Figma URL** (required): `figma.com/design/<key>/…` or `figma.com/file/<key>/…`.
- **Tokens JSON** (optional): defaults to `Design Tokens/primitive.tokens.json` (color ramps) and `Design Tokens/font.tokens.json`. A `theme.tokens.json` downloaded from the docs site also works.

If the file key is `9Lqv0lrj1pRM14NVs4TsSk` (the main DS-Nagarro library), stop and ask the user to confirm. Client themes belong in a duplicate or branch.

---

## Step 1 — Pick where you run

Run in one of these environments:
- **Figma agent (in-app):** target file is open in Figma desktop or web. Read and write variables in that file via the agent / Plugin API (`figma.variables`). No external MCP client.
- **Official Figma MCP:** read with `get_variable_defs` / `use_figma`, write with `use_figma` (Plugin API `figma.variables`). Load the `figma-use` skill before calling `use_figma`.
- **figma-console MCP:** read with `figma_get_variables`, write with `figma_batch_update_variables` / `figma_batch_create_variables`.

If you are an external agent (not the Figma in-app agent) and neither Figma MCP is connected, stop and tell the user to connect one.

## Step 2 — Map the payload

- The full nested path is the variable name, joined with `/` — e.g. `primitive.accent.500` → variable `primitive/accent/500`. The first segment is the layer or tier (`primitive`, `font`, …), not the collection.
- Find each variable by exact name across all collections (primitive colors live in the `primitive` collection, `font/family/default` in `font`).
- Colors: use `$value.hex`. Strings: use `$value` as-is. Write values to every mode of the collection.
- `$extensions["ds-ngr"].modes` (if present) names the modes for the `shape` collection and for density (the `space` collection), e.g. `{ "shape": "Pill", "density": "Compact" }`. On apply, set them as the explicit variable mode for those collections on every page (`page.setExplicitVariableModeForCollection`). If a collection or mode is missing, report it instead of creating it.
- Ignore `$extensions["ds-ngr"].surfaceStyle` (prototype, no Figma equivalent yet) and `$extensions["ds-ngr"].dataviz` (chart series are css-only tokens; list them in the report, don't create variables). Feedback ramps (`primitive.red|green|yellow`) are ordinary primitives: apply them like accent and neutral.
- `$extensions["ds-ngr"].primaryButton` (if present) sets the primary button fill. The fill lives in the semantic variables `color/background/interactive/strong/{default,hover,active}` (`color` collection, light and dark modes); the button's own variables in the single-mode `component` collection only alias them. Figma groups names by `/`; the CSS name joins the same path with `-`:
  - `brand` — in the **light** mode only, alias `color/background/interactive/strong/{default,hover,active}` to `color/background/interactive/primary/{default,hover,active}`. Dark already does this.
  - `exact` — `primaryButtonValues` holds `default`, `hover`, `pressed` and `label` hex values. Write the first three to `color/background/interactive/strong/{default,hover,active}` in **every** mode, and `label` to `button/foreground/primary` (`component` collection). These replace aliases with raw colors, so list them as separate rows in the parity table.
  - In a multi-brand payload, write these per brand mode, like the primitives.

### Multi-brand payload (`themes.tokens.json`)

If the payload has a top-level `brands` object:
- `brands.<slug>` holds one brand in the single-brand shape. `$extensions["ds-ngr"].brands` lists `{ slug, name }`, and `default` names the default brand.
- Each brand is a **mode** named after its display name, in the `primitive` and `font` collections. Write a brand's values to its own mode only.
- The default brand writes to the collection's first mode. Don't rename it; report its name.
- On apply, add missing brand modes. This is the only creation allowed: never delete or rename modes. Figma limits modes per collection by plan, so if the brand count exceeds the limit, stop before writing.
- Per-brand `modes` (shape/density) and `surfaceStyle` can't be set per page in a multi-brand file. List them per brand instead of applying them.
- Add a `brand` column to the parity table.

## Step 3 — Parity check (read-only)

Read the target file's variables and output a table:

| token | Figma value | payload value | action |
|-------|-------------|---------------|--------|

where action is `same`, `update`, `create`, or `missing collection`. Add one row per mode setting. End with counts per action.

If the user only asked for a parity check, stop here.

## Step 4 — Apply (after explicit approval)

Show the table and wait for a clear yes. Then:
- Update or create variables, matched by exact name.
- Create a variable only when its collection exists. Report missing collections instead of creating them.
- **Never** delete, rename or move variables, collections or modes. The only mode you may add is a missing brand mode in a multi-brand payload.

## Step 5 — Verify

Re-read the variables and confirm every `update`/`create` row now matches. Take a screenshot of a page that uses them if one exists. Report the final counts.
