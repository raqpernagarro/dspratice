---
name: ds-token-sync
description: Two-way sync between DS-Nagarro Figma variables and tokens.css. Fetches Figma tokens into a scratch folder, checks drift against tokens.css, shows which side changed last, and asks whether to update Figma or code before writing anything. Use when Figma variables or tokens.css may have changed. Not for session recaps or doc updates.
---

# DS Token Sync

Two-way: **Figma variables ⇄ tokens.css**. Nothing is written to either side until the user picks a direction.

For component properties (variants, booleans, text, instance swaps) use `ds-component-sync`.

---

## Step 1 — Fetch Figma JSON into a scratch folder

~~~bash
node scripts/fetch-tokens.mjs --out <scratch>/figma-tokens
~~~

Use the session scratchpad directory for `<scratch>`. This leaves `Design Tokens/` untouched, so the code side is still intact if the user picks "update Figma". Requires `FIGMA_TOKEN` in `.env`.

If it fails with a token error:

> "fetch:tokens failed — check that FIGMA_TOKEN is set in .env.
> Get a token at figma.com/settings → Personal access tokens → File content (read only)"

If it fails for any other reason (network, API down), ask the user to export manually:

> "fetch:tokens failed. Please export tokens from Figma manually:
> 1. Open DS-Nagarro in Figma Desktop
> 2. Resources panel → Variables → Export as DTCG JSON
> 3. Save into <scratch>/figma-tokens
> 4. Let me know when done"

Do not proceed to Step 2 until either the fetch succeeds or the user confirms the manual export is done.

---

## Step 2 — Check for drift

~~~bash
node scripts/sync-tokens.mjs --dir <scratch>/figma-tokens
~~~

Reports four categories (the direction-neutral meaning is in brackets):

- **🆕 NEW** — in Figma, not in `tokens.css` [Figma-only]
- **✏️ CHANGED** — primitive values differ [value differs]
- **🔀 ALIAS CHANGED** — semantic alias targets differ [alias differs]
- **🗑️ REMOVED** — in `tokens.css`, not in Figma [code-only]

If output is `✅ tokens.css is in sync with Figma` — done. Stop here.

---

## Step 3 — Find the latest side and ask

Gather one recency signal per side:

~~~bash
# Figma: file lastModified
curl -s -H "X-FIGMA-TOKEN: $FIGMA_TOKEN" "https://api.figma.com/v1/files/9Lqv0lrj1pRM14NVs4TsSk?depth=1" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).lastModified))'

# Code: last commit to tokens.css / Design Tokens, plus uncommitted edits
git log -1 --format=%cI -- tokens.css "Design Tokens/"
git status --porcelain -- tokens.css
~~~

(`FIGMA_TOKEN` is in `.env` — load it into the shell first; never print it.)

Show the user a short summary:

| | Figma | Code |
|---|---|---|
| Last change | `<lastModified>` | `<commit date>` (+ "uncommitted edits" if any) |

plus counts per drift category, and one line per drifted token (`token — Figma value → CSS value`). Recommend the side that changed most recently.

Then ask with AskUserQuestion: **"Which one do you want to update? Figma or code?"**

- **Update code** — Figma wins. Go to Step 4a.
- **Update Figma** — code wins. Go to Step 4b.
- **Decide per token** — offer only when both sides changed since the last sync (Figma `lastModified` and the code commit / uncommitted edits are both newer than the last `Design Tokens/` commit). Walk the drift rows and ask per token (or per group), then run 4a and 4b with the chosen subsets.

Put the recommended option first, labelled "(Recommended)".

---

## Step 4a — Update code (Figma → tokens.css)

1. Copy the scratch JSON into `Design Tokens/` (replace existing files).
2. Handle each category:
   - **🆕 NEW** → add to `tokens.css` following the three-tier chain, or mark `/* css-only */` if the token already exists under a different name
   - **✏️ CHANGED** → `npm run apply:tokens` auto-patches primitives
   - **🔀 ALIAS CHANGED** → review with the user and apply confirmed changes manually to `tokens.css`
   - **🗑️ REMOVED** → see [Handling 🗑️ REMOVED tokens](#handling-️-removed-tokens)
3. Verify:

~~~bash
npm run sync:tokens     # must report in sync
npm run audit:tokens    # must pass before committing
~~~

---

## Step 4b — Update Figma (tokens.css → Figma)

Target is the **main DS-Nagarro library** (`9Lqv0lrj1pRM14NVs4TsSk`). Say so explicitly in the approval prompt.

Follow `ds-figma-apply` for the mechanics: Step 1 (pick the MCP), Step 3 (read-only parity table), Step 4 (apply only after an explicit yes), Step 5 (verify). Variable name = CSS name without `--`, with the tier path grouped by `/` (e.g. `--button-background-primary-default` → `color/background/button/primary/default`). Find the existing variable by name in Figma rather than guessing where the hyphens become slashes.

Map the drift categories:

- **✏️ CHANGED** → update the Figma variable to the CSS value, in the matching mode (`:root` = light, `[data-theme="dark"]` = dark)
- **🔀 ALIAS CHANGED** → set the Figma variable's alias to the variable matching the CSS `var()` target
- **🗑️ REMOVED** (code-only) → create the variable in its collection. Skip `/* css-only */` tokens — they intentionally have no Figma variable. Report missing collections instead of creating them.
- **🆕 NEW** (Figma-only) → report only. **Never delete** Figma variables; ask the user to remove them in Figma if they are obsolete.

After applying, confirm the round trip and commit the refreshed JSON:

~~~bash
npm run fetch:tokens    # pull the updated Figma state into Design Tokens/
npm run sync:tokens     # must report in sync
npm run audit:tokens
~~~

---

## How sync:tokens decides what to skip

The sync script is fully dynamic — no hardcoded allowlists. Exceptions are declared in two places only:

**`/* css-only */` inline comment in `tokens.css`**
Marks tokens that legitimately live only in CSS and will never appear in Figma JSON. Examples: legacy alias names kept for backwards compatibility, dataviz tokens with hardcoded brand colours, computed component tokens not yet modelled in Figma.

~~~css
--color-background-dataviz-1: #47D7AC; /* css-only */
--size-container-md: var(--primitive-size-320); /* css-only */
~~~

Note: dataviz tokens are a documented exception to the three-tier chain —
they intentionally hold raw hex at the semantic layer for brand-locked chart
colours. Do not treat this example as license to hardcode hex in any other
semantic token.

Add this tag when you deliberately add a CSS-only token. The sync script reads it automatically — no script changes needed.

**`ALIAS_EXCEPTIONS` in `scripts/sync-tokens.mjs`**
A short set of tokens whose alias targets intentionally differ between Figma and `tokens.css` — for example, tokens pending a component migration. Every entry must have a comment explaining why and when it can be removed. Do not add tokens here just to silence noise.

**Auto-skipped by pattern**
Type-scale primitives (`--scale-type-scale-*`) are always skipped — CSS uses rem directly on semantic tokens.

---

## Adding new tokens to tokens.css

Follow the three-tier chain — never skip a layer:

~~~css
/* Layer 1 — primitive (raw hex only) */
--primitive-[ramp]-[step]: #HEXVALUE;

/* Layer 2 — semantic (references primitive via var()) */
--[token-name]: var(--primitive-[ramp]-[step]);

/* Layer 3 — component (references semantic via var()) */
--[component-token]: var(--[semantic-token]);
~~~

---

## Handling 🗑️ REMOVED tokens

~~~bash
grep -r "token-name" ~/Documents/GitHub/DSN/src/
~~~

- Used in components → keep in `tokens.css`, add `/* css-only */`
- Unused → safe to delete
- Renamed in Figma but old name still used → keep with `/* css-only */` until component migration is done

---

## GitHub Actions

Runs automatically every Monday at 8am UTC.
To trigger manually: `github.com/nagarro-dv/DSN` → Actions → Token sync check → Run workflow.

Red ✗ = drift found. Run `/ds-token-sync` to fix.

---

## Key rules

- Never write to either side (tokens.css, Design Tokens/, or Figma) before the user picks a direction
- Never delete Figma variables, collections or modes
- When updating code: never edit primitive hex values in `tokens.css` manually — use `npm run apply:tokens`, and never add a token to `tokens.css` without confirming it is stable in Figma first
- Never add tokens to `ALIAS_EXCEPTIONS` just to silence sync noise — fix the drift instead
- `build:tokens:legacy` is disabled — never run it
- `npm run audit:tokens` must pass before every commit
- `FIGMA_TOKEN` lives in `.env` — never commit it