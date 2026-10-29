// Menubar: an Items slot of Menubar Items on a bordered strip; the first one open.
async function buildVariant(v, h) {
  const set = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Menubar Item');
  if (!set) throw new Error('Build Menubar Item first');
  const labelKey = Object.keys(set.componentPropertyDefinitions).find((k) => k.startsWith('Label'));
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'AUTO', counter: 'AUTO', align: 'CENTER', fill: true, stroke: true }, 'component');
  const items = h.slot(c, 'Items', { direction: 'HORIZONTAL', align: 'CENTER' });
  c.appendChild(items);
  for (const [state, text] of [['Open', 'File'], ['Default', 'Edit'], ['Default', 'View'], ['Default', 'Help']]) {
    const i = set.children.find((x) => x.variantProperties.State === state).createInstance();
    i.name = 'item';
    i.setProperties({ [labelKey]: text });
    items.appendChild(i);
  }
  return c;
}
