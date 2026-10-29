/** Rebind layers to component tokens — run after component vars exist. */
export default `
const COMPONENT_SET_IDS = ['221:2', '261:1993'];
const SIZE_MAP = { Small: 'sm', Medium: 'md', Large: 'lg' };
const TYPE_MAP = { Primary: 'primary', Secondary: 'secondary', Ghost: 'ghost', Outline: 'outline' };
const STATE_MAP = { Default: 'default', Hover: 'hover', Pressed: 'pressed', Disabled: 'disabled' };

const allVars = await figma.variables.getLocalVariablesAsync();
const byName = new Map(allVars.map((v) => [v.name, v]));

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

let rebound = 0;
const missing = new Set();

async function bindPaint(node, field, varName) {
  const target = byName.get(varName);
  if (!target) { missing.add(varName); return; }
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
        if (name === 'label' || name === 'Vector') await bindPaint(node, 'fills', tokenPath(prefix, 'fg', v));
        else if (isRoot) await bindPaint(node, 'fills', tokenPath(prefix, 'bg', v));
      } else if (field === 'strokes' && isRoot) {
        await bindPaint(node, 'strokes', tokenPath(prefix, 'border', v));
      }
    }
  }
  if ('children' in node) for (const child of node.children) await rebindTree(child, prefix, v);
}

for (const setId of COMPONENT_SET_IDS) {
  const set = await figma.getNodeByIdAsync(setId);
  if (!set || set.type !== 'COMPONENT_SET') continue;
  const prefix = setId === '221:2' ? 'button' : 'icon-button';
  for (const child of set.children) if (child.type === 'COMPONENT') await rebindTree(child, prefix, null);
}

const removed = [];
for (const v of allVars) {
  if (v.name.includes('/override/')) {
    try { v.remove(); removed.push(v.name); } catch (e) {}
  }
}

return { rebound, missing: [...missing].slice(0, 15), removedOverrides: removed.length };
`
