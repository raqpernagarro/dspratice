// Listbox: the surface with an Items slot of Options (one selected, one highlighted) and the empty
// state (Show empty).
async function buildVariant(v, h) {
  const set = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Option');
  if (!set) throw new Error('Build Option first');
  const labelKey = Object.keys(set.componentPropertyDefinitions).find((k) => k.startsWith('Label'));
  const option = (state, selected, text) => {
    const i = set.children.find((c) => c.variantProperties.State === state && c.variantProperties.Selected === selected).createInstance();
    i.name = 'option';
    i.setProperties({ [labelKey]: text });
    return i;
  };
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN', fill: true, stroke: true }, 'component');
  c.resize(220, 100);
  c.primaryAxisSizingMode = 'AUTO';
  const items = h.slot(c, 'Items', { direction: 'VERTICAL' });
  c.appendChild(items);
  for (const [state, selected, text] of [['Default', 'False', 'Gala'], ['Default', 'True', 'Fuji'], ['Highlighted', 'False', 'Honeycrisp'], ['Default', 'False', 'Granny Smith']]) {
    const o = option(state, selected, text);
    items.appendChild(o);
    o.layoutAlign = 'STRETCH';
  }
  const empty = h.frame('empty', { direction: 'HORIZONTAL' });
  empty.appendChild(h.text('text', 'No results.'));
  c.appendChild(empty);
  for (const n of c.children) n.layoutAlign = 'STRETCH';
  return c;
}
