/**
 * Prints figma_execute body with embedded rebind map (for copy or MCP).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mapPath = path.resolve(__dirname, '../stories/base-ui/tokens/figma-rebind-map.json')
const REBIND_MAP = JSON.parse(fs.readFileSync(mapPath, 'utf8'))

const code = `
const COMPONENT_SET_IDS = ['221:2', '261:1993'];
const REBIND_MAP = ${JSON.stringify(REBIND_MAP)};

const allVars = await figma.variables.getLocalVariablesAsync();
const byName = new Map(allVars.map((v) => [v.name, v]));

function semanticVar(name) {
  const v = byName.get(name);
  if (!v) throw new Error('Missing semantic variable: ' + name);
  return v;
}

let reboundCount = 0;
const missing = new Set();

async function rebindNode(node) {
  if (!('boundVariables' in node) || !node.boundVariables) return;
  const bv = node.boundVariables;
  for (const field of Object.keys(bv)) {
    const binding = bv[field];
    const entries = Array.isArray(binding) ? binding : [binding];
    for (const entry of entries) {
      if (!entry?.id) continue;
      const source = allVars.find((v) => v.id === entry.id);
      if (!source) continue;
      const targetName = REBIND_MAP[source.name];
      if (!targetName) continue;
      let target;
      try {
        target = semanticVar(targetName);
      } catch (e) {
        missing.add(targetName);
        continue;
      }
      try {
        if (field === 'fills' || field === 'strokes') {
          const paints = field === 'fills' ? node.fills : node.strokes;
          if (!Array.isArray(paints)) continue;
          const next = paints.map((paint) => {
            if (paint.type !== 'SOLID') return paint;
            return figma.variables.setBoundVariableForPaint(paint, 'color', target);
          });
          if (field === 'fills') node.fills = next;
          else node.strokes = next;
        } else {
          node.setBoundVariable(field, target);
        }
        reboundCount++;
      } catch (e) {
        console.warn('Rebind failed', node.name, field, source.name, String(e));
      }
    }
  }
  if ('children' in node) {
    for (const child of node.children) await rebindNode(child);
  }
}

for (const setId of COMPONENT_SET_IDS) {
  const set = await figma.getNodeByIdAsync(setId);
  if (!set || set.type !== 'COMPONENT_SET') continue;
  for (const child of set.children) {
    if (child.type === 'COMPONENT') await rebindNode(child);
  }
}

const toDelete = allVars.filter(
  (v) => v.name.startsWith('button/') || v.name.startsWith('icon-button/'),
);
let deleted = 0;
for (const v of toDelete) {
  try {
    v.remove();
    deleted++;
  } catch (e) {
    console.warn('Could not delete', v.name, String(e));
  }
}

return {
  reboundBindings: reboundCount,
  deletedComponentVars: deleted,
  missingSemantic: [...missing].slice(0, 20),
  mapSize: Object.keys(REBIND_MAP).length,
};
`

process.stdout.write(code)
