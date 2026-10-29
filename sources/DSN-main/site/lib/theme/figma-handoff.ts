// Builds the agent prompts the Theme page copies: one to apply theme.css in an
// app repo, one to push tokens into Figma. The site cannot write to Figma itself
// (REST has no component writes; variable writes need Enterprise), so the Figma
// in-app agent or an external agent with a Figma MCP applies a fixed payload.
// Figma rules are mirrored in skills/ds-figma-apply/SKILL.md — keep the two in sync.

/** Main DS-Nagarro library. Client themes go to a duplicate or branch, not here. */
export const DS_FILE_KEY = '9Lqv0lrj1pRM14NVs4TsSk';

const FIGMA_URL = /^https:\/\/(www\.)?figma\.com\/(design|file)\/([A-Za-z0-9]+)/;

/** File key from a figma.com design/file URL, or null when the URL is not one. */
export function figmaFileKey(url: string): string | null {
  return FIGMA_URL.exec(url.trim())?.[3] ?? null;
}

export type FigmaHandoffMode = 'check' | 'apply';

export function toFigmaPrompt({ mode, figmaUrl, tokens }: { mode: FigmaHandoffMode; figmaUrl?: string; tokens: object }) {
  const apply = mode === 'apply';
  const multi = 'brands' in tokens;
  return `# ${apply ? 'Apply DS-Nagarro theme tokens to Figma' : 'Check Figma ↔ DS-Nagarro token parity (read-only)'}

${figmaUrl ? `Target file: ${figmaUrl.trim()}` : 'Target file: ask me for the Figma file URL (a duplicate or branch, not the main DS library) before doing anything.'}

Run in one of these environments:
- **Figma agent (in-app)** — target file is already open in Figma desktop or web. Read and ${apply ? 'write' : 'inspect'} variables in this file via the agent / Plugin API (\`figma.variables\`). No external MCP client.
- **Official Figma MCP** — read with \`get_variable_defs\` / \`use_figma\`${apply ? ', write with `use_figma` (Plugin API: `figma.variables`)' : ''}.
- **figma-console MCP** — read with \`figma_get_variables\`${apply ? ', write with `figma_batch_update_variables` / `figma_batch_create_variables`' : ''}.

If you are an external agent (not the Figma in-app agent) and neither Figma MCP is connected, stop and tell me to connect one.

## Payload → Figma mapping
- The full nested path is the variable name, joined with \`/\` — e.g. \`primitive.accent.500\` → variable \`primitive/accent/500\`. The first segment is the layer or tier (\`primitive\`, \`font\`, …), not the collection.
- Find each variable by exact name across all collections (primitive colors live in the \`primitive\` collection, \`font/family/default\` in \`font\`).
- Colors: use \`$value.hex\`. Strings: use \`$value\` as-is. Write values to every mode of the collection.
- Top-level \`$extensions["ds-ngr"].modes\` (if present) names the modes to use for the \`shape\` collection and for density (the \`space\` collection), e.g. \`{ "shape": "Pill", "density": "Compact" }\`.${apply ? ' Set them as the explicit variable mode for those collections on every page (`page.setExplicitVariableModeForCollection`). If a collection or mode is missing, report it instead of creating it.' : ' Report whether those collections and modes exist.'}
- Ignore \`$extensions["ds-ngr"].surfaceStyle\` (prototype metadata, no Figma equivalent yet) and \`$extensions["ds-ngr"].dataviz\` (chart series are css-only tokens; list them in the report, don't create variables).
${multi ? `
## Multi-brand payload
- \`brands.<slug>\` holds one brand in the shape above; \`$extensions["ds-ngr"].brands\` lists each slug with its display name, and \`default\` names the default brand.
- Each brand is a **mode** named after the brand's display name, in the \`primitive\` collection and the \`font\` collection. Write a brand's values to its own mode only, not to every mode.
- The default brand uses the collection's first (default) mode: rename nothing, just write its values there and report the mode name.
- ${apply ? 'Add a missing brand mode (add only — never delete or rename modes). Figma limits modes per collection by plan: if the brand count exceeds it, stop and tell me before writing anything.' : 'Report which brand modes exist and which are missing, and whether the brand count fits the plan\'s mode limit.'}
- A brand's \`modes\` (shape/density) and \`surfaceStyle\` can't be applied per page in a multi-brand file. List them per brand in the table instead of applying them.
` : ''}
## Rules
- Match variables by exact name. Never delete, rename or move variables, collections or modes.
${apply ? `- If the file key is \`${DS_FILE_KEY}\` (the main DS-Nagarro library), stop and ask me to confirm — client themes belong in a duplicate or branch.
- First produce the diff table below and wait for my approval. Only then write.
- Create a missing variable in the collection that holds its siblings (same tier/aspect); if none exists, report it instead of creating it.
- After writing, re-read the variables and confirm every row now matches. Take a screenshot of a page that uses them if one exists.` : '- Read only. Do not modify the file in any way.'}

## Output
A markdown table: \`${multi ? 'brand · ' : ''}token · Figma value · payload value · action\` (one row per mode setting too) where action is \`same\`, \`update\`, \`create\`, or \`missing collection\`. End with counts per action${apply ? ' and, after writing, a verification line' : ''}.

## Payload
\`\`\`json
${JSON.stringify(tokens, null, 2)}
\`\`\`
`;
}

/** Prompt for an agent in the user's app repo to install a theme.css export. */
export function toAppPrompt({ css, shareUrl, brands }: { css: string; shareUrl: string; brands?: string[] }) {
  if (brands) return toMultiAppPrompt({ css, shareUrl, brands });
  return `# Apply a DS-Ngr theme to this app

The CSS below re-values DS-Ngr primitive tokens (brand accent, neutrals, feedback red/green/yellow, typeface), the chart series colours per mode and, if chosen, the size tokens for roundness and density. Semantic tokens point at those primitives per mode, so light and dark mode both follow without further changes.

## Steps
1. Check that this app depends on \`ds-ngr\` (package.json). If not, stop and tell me.
2. If the CSS below only contains "Nagarro defaults — no overrides", tell me no theme file is needed and stop.
3. Find the app entry that imports \`ds-ngr/tokens.css\`, \`ds-ngr/global.css\` and \`ds-ngr/style.css\`.
4. Save the CSS as \`theme.css\` next to the app's existing global styles (e.g. \`src/styles/theme.css\`). Replace it if it already exists.
5. Import it **right after** \`ds-ngr/tokens.css\` — it must load after tokens to win. Keep any \`@import url(...)\` font line at the top of the file.

## Rules
- Do not edit anything in node_modules or ds-ngr's own token files.
- Do not hardcode the new colours anywhere else; components already read them through tokens.
- Do not add or rename tokens. The file only overrides existing DS-Ngr variables (\`--primitive-*\`, \`--color-background-dataviz-1…8\`, \`--shape-radius-*\`, \`--size-*\`, \`--space-*\`, component shadows such as \`--button-shadow-*\`, \`--font-family-default\`).

## Verify
Run the app (or build it). Check that a primary Button and text links use the new accent in light and dark mode, then list the files you changed.

To tweak the theme later: ${shareUrl}

## theme.css
\`\`\`css
${css.trimEnd()}
\`\`\`
`;
}

function toMultiAppPrompt({ css, shareUrl, brands }: { css: string; shareUrl: string; brands: string[] }) {
  return `# Apply a DS-Ngr multi-brand theme to this app

The CSS below re-values DS-Ngr primitive tokens per brand. Each brand is scoped to \`:root[data-brand="<slug>"]\`; the default brand also applies when \`data-brand\` is missing. Brands: ${brands.map((b) => `\`${b}\``).join(', ')}.

## Steps
1. Check that this app depends on \`ds-ngr\` (package.json). If not, stop and tell me.
2. Find the app entry that imports \`ds-ngr/tokens.css\`, \`ds-ngr/global.css\` and \`ds-ngr/style.css\`.
3. Save the CSS as \`themes.css\` next to the app's existing global styles. Replace it if it already exists.
4. Import it **right after** \`ds-ngr/tokens.css\`. Keep the \`@import url(...)\` font lines at the top of the file.
5. Ask me how the app picks the brand (tenant, domain, env var, user setting) if it isn't obvious. Then set \`data-brand\` on the \`<html>\` element. Render it on the server or in an inline head script so the page doesn't flash the default brand.

## Rules
- Set \`data-brand\` on \`<html>\` only. On an inner element it has no effect: semantic tokens resolve on the root.
- Do not edit anything in node_modules or ds-ngr's own token files, and don't hardcode brand colours elsewhere.
- Do not add or rename tokens.

## Verify
Run the app with each brand value and in light and dark mode. Check that a primary Button and text links follow the brand, then list the files you changed.

To tweak the brands later: ${shareUrl}

## themes.css
\`\`\`css
${css.trimEnd()}
\`\`\`
`;
}
