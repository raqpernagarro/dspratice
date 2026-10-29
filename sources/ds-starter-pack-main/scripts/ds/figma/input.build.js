// Input: an auto-layout box (surface, border, padding, gap) holding an optional icon and the value.
// Layer names = the spec's part paths ('', 'icon', 'value'); all values come from the spec bindings.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', align: 'CENTER', fill: true, stroke: true }, 'component');
  c.resize(240, 36);
  const icon = h.icon('MagnifyingGlass', 'Format=Stroke, Weight=Fill');
  icon.name = 'icon';
  c.appendChild(icon);
  const value = h.text('value', v.filled === 'true' ? 'Value' : 'Placeholder');
  c.appendChild(value);
  value.layoutGrow = 1;
  value.textAutoResize = 'HEIGHT';
  return c;
}

// Show icon (on by default) and which icon.
async function afterSet(set) {
  const first = set.children[0].findChild((n) => n.name === 'icon');
  const main = await first.getMainComponentAsync();
  const show = set.addComponentProperty('Show icon', 'BOOLEAN', true);
  const swap = set.addComponentProperty('Icon', 'INSTANCE_SWAP', main.id);
  for (const c of set.children) c.findChild((n) => n.name === 'icon').componentPropertyReferences = { visible: show, mainComponent: swap };
}
