// Breadcrumb: an Items slot of Breadcrumb Items, Home › Projects › Design system (current).
async function buildVariant(v, h) {
  const itemSet = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Breadcrumb Item');
  if (!itemSet) throw new Error('Build Breadcrumb Item first');
  const c = h.frame('', { direction: 'HORIZONTAL', align: 'CENTER' }, 'component');
  const items = h.slot(c, 'Items', { direction: 'HORIZONTAL', align: 'CENTER' });
  c.appendChild(items);
  for (const [text, state] of [['Home', 'Default'], ['Projects', 'Default'], ['Design system', 'Current']]) {
    const item = itemSet.children.find((x) => x.variantProperties.State === state).createInstance();
    item.name = 'item';
    const label = Object.keys(item.componentProperties).find((k) => k.startsWith('Label#'));
    if (label) item.setProperties({ [label]: text });
    items.appendChild(item);
  }
  return c;
}
