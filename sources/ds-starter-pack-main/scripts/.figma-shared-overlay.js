
const COMPOSITES = {"color/background/interactive/subtle/default":["color/foreground/interactive/default","opacity/0"],"colors/transparent":["color/foreground/interactive/default","opacity/0"],"color/background/interactive/subtle/hover":["color/foreground/interactive/default","opacity/10"],"color/background/interactive/subtle/pressed":["color/foreground/interactive/default","opacity/15"],"color/background/interactive/danger-subtle/hover":["color/background/interactive/danger/default","opacity/10"],"color/background/interactive/danger-subtle/pressed":["color/background/interactive/danger/default","opacity/20"]};
const RENAMES = {"color/background/interactive/state/hover":"color/background/interactive/subtle/hover","color/background/interactive/state/pressed":"color/background/interactive/subtle/pressed","color/background/danger/state/hover":"color/background/interactive/danger-subtle/hover","color/background/danger/state/pressed":"color/background/interactive/danger-subtle/pressed"};

const collections = await figma.variables.getLocalVariableCollectionsAsync();
const colorCol =
  collections.find((c) => c.name.toLowerCase() === 'semantic') ||
  collections.find((c) => c.name.toLowerCase() === 'color');
if (!colorCol) throw new Error('Missing semantic/color variable collection');

let allVars = await figma.variables.getLocalVariablesAsync();
const byName = new Map(allVars.map((v) => [v.name, v]));

let renamed = 0;
for (const v of allVars) {
  const next = RENAMES[v.name];
  if (!next) continue;
  if (byName.has(next) && byName.get(next).id !== v.id) {
    console.warn('Skip rename, target exists', v.name, next);
    continue;
  }
  const oldName = v.name;
  v.name = next;
  byName.delete(oldName);
  byName.set(next, v);
  renamed++;
}

function aliasOf(name) {
  const t = byName.get(name);
  return t ? figma.variables.createVariableAlias(t) : null;
}

let created = 0;
let updated = 0;

for (const [name, [colorName, opacityName]] of Object.entries(COMPOSITES)) {
  const colorV = byName.get(colorName);
  const opV = byName.get(opacityName);
  if (!colorV || !opV) {
    console.warn('Missing composite part', name, colorName, opacityName);
    continue;
  }
  let v = byName.get(name);
  if (!v) {
    v = figma.variables.createVariable(name, colorCol, 'COLOR');
    byName.set(name, v);
    created++;
  }
  const value = { color: aliasOf(colorName), opacity: aliasOf(opacityName) };
  for (const mode of colorCol.modes) {
    v.setValueForMode(mode.modeId, value);
  }
  updated++;
}

return { collection: colorCol.name, renamed, created, updated, names: Object.keys(COMPOSITES) };
