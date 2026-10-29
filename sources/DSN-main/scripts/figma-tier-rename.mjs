#!/usr/bin/env node
/**
 * DS-Ngr — Figma side of the 8-tier token rename
 *
 * Prints Figma Plugin API code that applies scripts/figma-tier-rename.json to
 * the DS library (file 9Lqv0lrj1pRM14NVs4TsSk). Run the printed code through the
 * figma-console MCP (`figma_execute`) or the official Figma MCP (`use_figma`).
 *
 *   rename — variable renamed to its tier path (e.g. color/background/button-primary-default)
 *   merge  — every alias pointing at the variable is re-pointed to its replacement, then
 *            the variable is moved to `Deprecated/<old name>` (fetch-tokens skips
 *            uppercase groups). Designers rebind any layers still using it, then delete it.
 *
 * Usage:
 *   node scripts/figma-tier-rename.mjs            — print code (dry run inside Figma: returns plan)
 *   node scripts/figma-tier-rename.mjs --apply    — print code that writes the changes
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const APPLY = process.argv.includes('--apply');
const plan = JSON.parse(readFileSync(join(__dirname, 'figma-tier-rename.json'), 'utf8'));

const code = `
const APPLY = ${APPLY};
const PLAN = ${JSON.stringify(plan)};
const vars = await figma.variables.getLocalVariablesAsync();
const byId = new Map(vars.map(v => [v.id, v]));
const byName = new Map(vars.map(v => [v.name, v]));
const report = { renamed: 0, merged: 0, repointed: 0, missing: [], conflicts: [] };

// 1. Renames. Two passes through a temporary name so swaps never collide.
const renames = PLAN.filter(p => p.op === 'rename' && byId.has(p.variableId));
for (const p of PLAN) if (!byId.has(p.variableId)) report.missing.push(p.from);
if (APPLY) for (const p of renames) byId.get(p.variableId).name = '__tier_tmp__/' + p.variableId;
for (const p of renames) {
  const clash = byName.get(p.to);
  if (clash && !renames.some(r => r.variableId === clash.id) && clash.id !== p.variableId) {
    report.conflicts.push(p.to);
    continue;
  }
  if (APPLY) byId.get(p.variableId).name = p.to;
  report.renamed++;
}

// 2. Merges: re-point aliases, then park the variable under Deprecated/.
const target = name => vars.find(v => v.name === name);
for (const p of PLAN.filter(p => p.op === 'merge' && byId.has(p.variableId))) {
  const from = byId.get(p.variableId);
  const into = APPLY ? target(p.into) : renames.find(r => r.to === p.into) && { id: 'planned' };
  if (!into) { report.conflicts.push('merge target missing: ' + p.into); continue; }
  for (const v of vars) {
    for (const [modeId, val] of Object.entries(v.valuesByMode)) {
      if (val && val.type === 'VARIABLE_ALIAS' && val.id === from.id) {
        if (APPLY) v.setValueForMode(modeId, figma.variables.createVariableAlias(into));
        report.repointed++;
      }
    }
  }
  if (APPLY) from.name = 'Deprecated/' + p.from;
  report.merged++;
}
return { applied: APPLY, ...report };
`.trim();

console.log(code);
