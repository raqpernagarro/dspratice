
const SPEC = {"collection":"components","mode":"Mode 1","modeId":"4:6","aliases":{"button/background/primary/default":"color/background/interactive/primary/default","button/foreground/primary/default":"color/foreground/on-interactive/primary","button/border-color/primary/default":"color/background/interactive/primary/default","button/background/primary/hover":"color/background/interactive/primary/hover","button/foreground/primary/hover":"color/foreground/on-interactive/primary","button/border-color/primary/hover":"color/background/interactive/primary/hover","button/background/primary/pressed":"color/background/interactive/primary/pressed","button/foreground/primary/pressed":"color/foreground/on-interactive/primary","button/border-color/primary/pressed":"color/background/interactive/primary/pressed","button/background/primary/disabled":"color/background/interactive/disabled","button/foreground/primary/disabled":"color/foreground/neutral/tertiary","button/border-color/primary/disabled":"color/background/interactive/disabled","button/background/destructive/primary/default":"color/background/interactive/danger/default","button/foreground/destructive/primary/default":"color/foreground/on-danger/primary","button/border-color/destructive/default":"color/background/interactive/danger/default","button/background/destructive/primary/hover":"color/background/interactive/danger/hover","button/foreground/destructive/primary/hover":"color/foreground/on-danger/primary","button/border-color/destructive/hover":"color/background/interactive/danger/hover","button/background/destructive/primary/pressed":"color/background/interactive/danger/pressed","button/foreground/destructive/primary/pressed":"color/foreground/on-danger/primary","button/border-color/destructive/pressed":"color/background/interactive/danger/pressed","button/background/destructive/primary/disabled":"color/background/interactive/disabled","button/foreground/destructive/primary/disabled":"color/foreground/neutral/tertiary","button/border-color/destructive/disabled":"color/background/interactive/disabled","button/background/secondary/default":"color/background/interactive/secondary/default","button/foreground/secondary/default":"color/foreground/neutral/primary","button/border-color/secondary/default":"color/border/interactive/default","button/background/secondary/hover":"color/background/interactive/secondary/hover","button/foreground/secondary/hover":"color/foreground/neutral/primary","button/border-color/secondary/hover":"color/border/interactive/hover","button/background/secondary/pressed":"color/background/interactive/secondary/pressed","button/foreground/secondary/pressed":"color/foreground/neutral/primary","button/border-color/secondary/pressed":"color/border/interactive/pressed","button/background/secondary/disabled":"color/background/interactive/disabled","button/foreground/secondary/disabled":"color/foreground/neutral/tertiary","button/border-color/secondary/disabled":"color/border/interactive/disabled","button/foreground/ghost/default":"color/foreground/interactive/default","button/foreground/ghost/hover":"color/foreground/interactive/hover","button/foreground/ghost/pressed":"color/foreground/interactive/pressed","button/foreground/ghost/disabled":"color/foreground/neutral/tertiary","button/foreground/destructive/ghost/default":"color/foreground/interactive/danger/default","button/foreground/destructive/ghost/hover":"color/foreground/interactive/danger/hover","button/foreground/destructive/ghost/pressed":"color/foreground/interactive/danger/pressed","button/foreground/destructive/ghost/disabled":"color/foreground/interactive/disabled","button/foreground/outline/default":"color/foreground/interactive/default","button/border-color/outline/default":"color/border/interactive/default","button/foreground/outline/hover":"color/foreground/interactive/hover","button/border-color/outline/hover":"color/border/interactive/hover","button/foreground/outline/pressed":"color/foreground/interactive/pressed","button/border-color/outline/pressed":"color/border/interactive/pressed","button/foreground/outline/disabled":"color/foreground/neutral/tertiary","button/border-color/outline/disabled":"color/border/interactive/disabled","icon-button/background/primary/default":"color/background/interactive/primary/default","icon-button/foreground/primary/default":"color/foreground/on-interactive/primary","icon-button/border-color/primary/default":"color/background/interactive/primary/default","icon-button/background/primary/hover":"color/background/interactive/primary/hover","icon-button/foreground/primary/hover":"color/foreground/on-interactive/primary","icon-button/border-color/primary/hover":"color/background/interactive/primary/hover","icon-button/background/primary/pressed":"color/background/interactive/primary/pressed","icon-button/foreground/primary/pressed":"color/foreground/on-interactive/primary","icon-button/border-color/primary/pressed":"color/background/interactive/primary/pressed","icon-button/background/primary/disabled":"color/background/interactive/disabled","icon-button/foreground/primary/disabled":"color/foreground/neutral/tertiary","icon-button/border-color/primary/disabled":"color/background/interactive/disabled","icon-button/background/destructive/primary/default":"color/background/interactive/danger/default","icon-button/foreground/destructive/primary/default":"color/foreground/on-danger/primary","icon-button/border-color/destructive/primary/default":"color/background/interactive/danger/default","icon-button/background/destructive/primary/hover":"color/background/interactive/danger/hover","icon-button/foreground/destructive/primary/hover":"color/foreground/on-danger/primary","icon-button/border-color/destructive/primary/hover":"color/background/interactive/danger/hover","icon-button/background/destructive/primary/pressed":"color/background/interactive/danger/pressed","icon-button/foreground/destructive/primary/pressed":"color/foreground/on-danger/primary","icon-button/border-color/destructive/primary/pressed":"color/background/interactive/danger/pressed","icon-button/background/destructive/primary/disabled":"color/background/interactive/disabled","icon-button/foreground/destructive/primary/disabled":"color/foreground/neutral/tertiary","icon-button/border-color/destructive/primary/disabled":"color/background/interactive/disabled","icon-button/background/secondary/default":"color/background/interactive/secondary/default","icon-button/foreground/secondary/default":"color/foreground/neutral/primary","icon-button/border-color/secondary/default":"color/border/interactive/default","icon-button/background/secondary/hover":"color/background/interactive/secondary/hover","icon-button/foreground/secondary/hover":"color/foreground/neutral/primary","icon-button/border-color/secondary/hover":"color/border/interactive/hover","icon-button/background/secondary/pressed":"color/background/interactive/secondary/pressed","icon-button/foreground/secondary/pressed":"color/foreground/neutral/primary","icon-button/border-color/secondary/pressed":"color/border/interactive/pressed","icon-button/background/secondary/disabled":"color/background/interactive/disabled","icon-button/foreground/secondary/disabled":"color/foreground/neutral/tertiary","icon-button/border-color/secondary/disabled":"color/border/interactive/disabled","icon-button/foreground/ghost/default":"color/foreground/interactive/default","icon-button/foreground/ghost/hover":"color/foreground/interactive/hover","icon-button/foreground/ghost/pressed":"color/foreground/interactive/pressed","icon-button/foreground/ghost/disabled":"color/foreground/neutral/tertiary","icon-button/foreground/destructive/ghost/default":"color/foreground/interactive/danger/default","icon-button/foreground/destructive/ghost/hover":"color/foreground/interactive/danger/hover","icon-button/foreground/destructive/ghost/pressed":"color/foreground/interactive/danger/pressed","icon-button/foreground/destructive/ghost/disabled":"color/foreground/interactive/disabled","icon-button/foreground/outline/default":"color/foreground/interactive/default","icon-button/border-color/outline/default":"color/border/interactive/default","icon-button/foreground/outline/hover":"color/foreground/interactive/hover","icon-button/border-color/outline/hover":"color/border/interactive/hover","icon-button/foreground/outline/pressed":"color/foreground/interactive/pressed","icon-button/border-color/outline/pressed":"color/border/interactive/pressed","icon-button/foreground/outline/disabled":"color/foreground/neutral/tertiary","icon-button/border-color/outline/disabled":"color/border/interactive/disabled","button/border-width":"scale/25","button/border-width/outline":"scale/25","button/size/sm":"scale/600","button/size/md":"scale/900","button/size/lg":"scale/1200","button/space-x/sm":"scale/150","button/space-x/md":"scale/200","button/space-x/lg":"scale/300","button/space-y/sm":"scale/100","button/space-y/md":"scale/200","button/space-y/lg":"scale/300","button/gap/sm":"scale/50","button/gap/md":"scale/50","button/gap/lg":"scale/100","button/icon/size/sm":"scale/350","button/icon/size/md":"scale/400","button/icon/size/lg":"scale/500","button/radius/sm":"scale/00","button/radius/md":"scale/00","button/radius/lg":"scale/00","button/label/size/sm":"font/size/body/sm","button/label/size/md":"font/size/body/md","button/label/size/lg":"font/size/body/lg","button/label/space-x/sm":"scale/100","button/label/space-x/md":"scale/100","button/label/space-x/lg":"scale/100","icon-button/border-width":"scale/25","icon-button/size/sm":"scale/600","icon-button/size/md":"scale/900","icon-button/size/lg":"scale/1200","icon-button/icon/size/sm":"scale/350","icon-button/icon/size/md":"scale/400","icon-button/icon/size/lg":"scale/500","icon-button/radius/sm":"scale/00","icon-button/radius/md":"scale/00","icon-button/radius/lg":"scale/00"},"composites":{"button/background/ghost/default":["color/background/interactive/primary/default","opacity/0"],"button/border-color/ghost/default":["color/background/interactive/primary/default","opacity/0"],"button/background/ghost/hover":["color/background/interactive/primary/hover","opacity/30"],"button/border-color/ghost/hover":["color/background/interactive/primary/hover","opacity/0"],"button/background/ghost/pressed":["color/background/interactive/primary/pressed","opacity/50"],"button/border-color/ghost/pressed":["color/background/interactive/primary/pressed","opacity/0"],"button/background/ghost/disabled":["color/background/interactive/primary/default","opacity/0"],"button/border-color/ghost/disabled":["color/background/interactive/primary/default","opacity/0"],"button/background/destructive/ghost/default":["color/background/interactive/danger/default","opacity/0"],"button/border-color/destructive/ghost/default":["color/background/interactive/danger/default","opacity/0"],"button/background/destructive/ghost/hover":["color/background/interactive/danger/hover","opacity/15"],"button/border-color/destructive/ghost/hover":["color/background/interactive/secondary/hover","opacity/0"],"button/background/destructive/ghost/pressed":["color/background/interactive/danger/pressed","opacity/30"],"button/border-color/destructive/ghost/pressed":["color/background/interactive/secondary/pressed","opacity/0"],"button/background/destructive/ghost/disabled":["color/background/interactive/disabled","opacity/0"],"button/border-color/destructive/ghost/disabled":["color/background/interactive/primary/default","opacity/0"],"button/background/outline/default":["color/foreground/interactive/default","opacity/0"],"button/background/outline/hover":["color/foreground/interactive/default","opacity/5"],"button/background/outline/pressed":["color/foreground/interactive/default","opacity/10"],"button/background/outline/disabled":["color/foreground/interactive/default","opacity/0"],"icon-button/background/ghost/default":["color/background/interactive/primary/default","opacity/0"],"icon-button/border-color/ghost/default":["color/background/interactive/primary/default","opacity/0"],"icon-button/background/ghost/hover":["color/background/interactive/primary/hover","opacity/30"],"icon-button/border-color/ghost/hover":["color/background/interactive/primary/hover","opacity/0"],"icon-button/background/ghost/pressed":["color/background/interactive/primary/pressed","opacity/50"],"icon-button/border-color/ghost/pressed":["color/background/interactive/primary/pressed","opacity/0"],"icon-button/background/ghost/disabled":["color/background/interactive/primary/default","opacity/0"],"icon-button/border-color/ghost/disabled":["color/background/interactive/primary/default","opacity/0"],"icon-button/background/destructive/ghost/default":["color/background/interactive/danger/default","opacity/0"],"icon-button/border-color/destructive/ghost/default":["color/background/interactive/danger/default","opacity/0"],"icon-button/background/destructive/ghost/hover":["color/background/interactive/danger/hover","opacity/15"],"icon-button/border-color/destructive/ghost/hover":["color/background/interactive/secondary/hover","opacity/0"],"icon-button/background/destructive/ghost/pressed":["color/background/interactive/danger/pressed","opacity/30"],"icon-button/border-color/destructive/ghost/pressed":["color/background/interactive/secondary/pressed","opacity/0"],"icon-button/background/destructive/ghost/disabled":["color/background/interactive/disabled","opacity/0"],"icon-button/border-color/destructive/ghost/disabled":["color/background/interactive/primary/default","opacity/0"],"icon-button/background/outline/default":["color/foreground/interactive/default","opacity/0"],"icon-button/background/outline/hover":["color/foreground/interactive/default","opacity/5"],"icon-button/background/outline/pressed":["color/foreground/interactive/default","opacity/10"],"icon-button/background/outline/disabled":["color/foreground/interactive/default","opacity/0"]}};
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
    if (role === 'bg') return `${prefix}/background/destructive/primary/${state}`;
    if (role === 'fg') return `${prefix}/foreground/destructive/primary/${state}`;
    if (role === 'border') {
      return prefix === 'button'
        ? `${prefix}/border-color/destructive/${state}`
        : `${prefix}/border-color/destructive/primary/${state}`;
    }
  }
  if (destructive && type === 'ghost') {
    if (role === 'bg') return `${prefix}/background/destructive/ghost/${state}`;
    if (role === 'fg') return `${prefix}/foreground/destructive/ghost/${state}`;
    if (role === 'border') return `${prefix}/border-color/destructive/ghost/${state}`;
  }
  if (role === 'bg') return `${prefix}/background/${type}/${state}`;
  if (role === 'fg') return `${prefix}/foreground/${type}/${state}`;
  if (role === 'border') return `${prefix}/border-color/${type}/${state}`;
  return null;
}

function layoutToken(prefix, field, size) {
  const s = size;
  if (prefix === 'button') {
    if (field === 'itemSpacing') return `button/gap/${s}`;
    if (field.startsWith('padding')) return `button/space-x/${s}`;
    if (field.includes('Radius')) return `button/radius/${s}`;
    if (field === 'fontSize') return `button/label/size/${s}`;
    if (field === 'width' || field === 'height') return `button/icon/size/${s}`;
    if (field === 'minHeight') return `button/size/${s}`;
  } else {
    if (field.includes('Radius')) return `icon-button/radius/${s}`;
    if (field === 'width' || field === 'height') return `icon-button/icon/size/${s}`;
    if (field === 'minHeight' || field === 'minWidth') return `icon-button/size/${s}`;
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
