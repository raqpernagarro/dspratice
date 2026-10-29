/**
 * 1) Restore `components` collection button/* + icon-button/* (aliases + composites)
 * 2) Rebind Button + Icon Button layers to component tokens (not direct color/*)
 *
 * Spec: stories/base-ui/tokens/component-button-token-spec.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const spec = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../stories/base-ui/tokens/component-button-token-spec.json'), 'utf8'),
)

const pluginBody = `
const SPEC = ${JSON.stringify(spec)};
const COMPONENTS_COLLECTION_ID = 'VariableCollectionId:4:5';
const COMPONENT_MODE = '4:6';
const COMPONENT_SET_IDS = ['221:2', '261:1993'];

const collection = await figma.variables.getVariableCollectionByIdAsync(COMPONENTS_COLLECTION_ID);
if (!collection) throw new Error('Missing components collection');

let allVars = await figma.variables.getLocalVariablesAsync();
const byName = new Map(allVars.map((v) => [v.name, v]));

function aliasOf(name) {
  const target = byName.get(name);
  if (!target) return null;
  return figma.variables.createVariableAlias(target);
}

let created = 0;
let updated = 0;

async function ensureVar(name, resolvedType) {
  let v = byName.get(name);
  if (!v) {
    v = figma.variables.createVariable(name, collection, resolvedType);
    byName.set(name, v);
    created++;
  }
  return v;
}

for (const [name, targetName] of Object.entries(SPEC.aliases)) {
  const target = byName.get(targetName);
  if (!target) {
    console.warn('Missing alias target', name, '->', targetName);
    continue;
  }
  const type = target.resolvedType;
  const v = await ensureVar(name, type);
  v.setValueForMode(COMPONENT_MODE, aliasOf(targetName));
  updated++;
}

for (const [name, [colorName, opacityName]] of Object.entries(SPEC.composites)) {
  const colorV = byName.get(colorName);
  const opV = byName.get(opacityName);
  if (!colorV || !opV) {
    console.warn('Missing composite part', name, colorName, opacityName);
    continue;
  }
  const v = await ensureVar(name, 'COLOR');
  v.setValueForMode(COMPONENT_MODE, {
    color: aliasOf(colorName),
    opacity: aliasOf(opacityName),
  });
  updated++;
}

const SIZE_MAP = { Small: 'sm', Medium: 'md', Large: 'lg' };
const TYPE_MAP = { Primary: 'primary', Secondary: 'secondary', Ghost: 'ghost', Outline: 'outline' };
const STATE_MAP = { Default: 'default', Hover: 'hover', Pressed: 'pressed', Disabled: 'disabled' };

function parseVariant(name) {
  const out = {};
  for (const part of name.split(', ')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return {
    type: TYPE_MAP[out.Type] || 'primary',
    size: SIZE_MAP[out.Size] || 'md',
    state: STATE_MAP[out.State] || 'default',
    destructive: out.Destructive === 'True',
  };
}

function tokenPath(prefix, role, v) {
  const { type, state, destructive } = v;
  if (destructive && type === 'primary') {
    if (role === 'bg') return \`\${prefix}/background/destructive/primary/\${state}\`;
    if (role === 'fg') return \`\${prefix}/foreground/destructive/primary/\${state}\`;
    if (role === 'border') {
      return prefix === 'button'
        ? \`\${prefix}/border-color/destructive/\${state}\`
        : \`\${prefix}/border-color/destructive/primary/\${state}\`;
    }
  }
  if (destructive && type === 'ghost') {
    if (role === 'bg') return \`\${prefix}/background/destructive/ghost/\${state}\`;
    if (role === 'fg') return \`\${prefix}/foreground/destructive/ghost/\${state}\`;
    if (role === 'border') return \`\${prefix}/border-color/destructive/ghost/\${state}\`;
  }
  if (role === 'bg') return \`\${prefix}/background/\${type}/\${state}\`;
  if (role === 'fg') return \`\${prefix}/foreground/\${type}/\${state}\`;
  if (role === 'border') return \`\${prefix}/border-color/\${type}/\${state}\`;
  return null;
}

function layoutToken(prefix, field, size) {
  const s = size;
  if (prefix === 'button') {
    if (field === 'itemSpacing') return \`button/gap/\${s}\`;
    if (field.startsWith('padding')) return \`button/space-x/\${s}\`;
    if (field.includes('Radius')) return \`button/radius/\${s}\`;
    if (field === 'fontSize') return \`button/label/size/\${s}\`;
    if (field === 'width' || field === 'height') return \`button/icon/size/\${s}\`;
    if (field === 'minHeight') return \`button/size/\${s}\`;
  } else {
    if (field.includes('Radius')) return \`icon-button/radius/\${s}\`;
    if (field === 'width' || field === 'height') return \`icon-button/icon/size/\${s}\`;
    if (field === 'minHeight' || field === 'minWidth') return \`icon-button/size/\${s}\`;
  }
  return null;
}

let rebound = 0;
const missingBind = new Set();

async function bindPaint(node, field, varName) {
  const target = byName.get(varName);
  if (!target) {
    missingBind.add(varName);
    return;
  }
  const paints = field === 'fills' ? node.fills : node.strokes;
  if (!Array.isArray(paints)) return;
  const next = paints.map((paint) => {
    if (paint.type !== 'SOLID') return paint;
    return figma.variables.setBoundVariableForPaint(paint, 'color', target);
  });
  if (field === 'fills') node.fills = next;
  else node.strokes = next;
  rebound++;
}

async function rebindTree(node, prefix, variant) {
  const name = node.name;
  const isRoot = name.includes('Type=');
  const v = isRoot ? parseVariant(name) : variant;

  if (node.boundVariables) {
    for (const field of Object.keys(node.boundVariables)) {
      if (field === 'fills') {
        if (name === 'label' || name === 'Vector') {
          await bindPaint(node, 'fills', tokenPath(prefix, 'fg', v));
        } else if (isRoot) {
          await bindPaint(node, 'fills', tokenPath(prefix, 'bg', v));
        }
      } else if (field === 'strokes' && isRoot) {
        await bindPaint(node, 'strokes', tokenPath(prefix, 'border', v));
      } else if (field !== 'fills' && field !== 'strokes') {
        const tok = layoutToken(prefix, field, v.size);
        if (tok) {
          const target = byName.get(tok);
          if (target) {
            try {
              node.setBoundVariable(field, target);
              rebound++;
            } catch (e) {}
          }
        }
      }
    }
  }

  if ('children' in node) {
    for (const child of node.children) await rebindTree(child, prefix, v);
  }
}

for (const setId of COMPONENT_SET_IDS) {
  const set = await figma.getNodeByIdAsync(setId);
  if (!set || set.type !== 'COMPONENT_SET') continue;
  const prefix = setId === '221:2' ? 'button' : 'icon-button';
  for (const child of set.children) {
    if (child.type === 'COMPONENT') await rebindTree(child, prefix, null);
  }
}

// Remove mistaken color/override/* tokens (composites live in components collection)
const overrideVars = allVars.filter((v) => v.name.includes('/override/'));
let removedOverrides = 0;
for (const v of overrideVars) {
  try {
    v.remove();
    removedOverrides++;
  } catch (e) {}
}

return { created, updated, rebound, removedOverrides, missingBind: [...missingBind].slice(0, 20) };
`

process.stdout.write(pluginBody)
