// Accordion: a bordered frame with an Items slot of Accordion Items; the first open and without its divider.
async function buildVariant(v, h) {
  const set = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Accordion Item');
  if (!set) throw new Error('Build Accordion Item first');
  const key = (prefix) => Object.keys(set.componentPropertyDefinitions).find((k) => k.startsWith(prefix));
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN', fill: true, stroke: true }, 'component');
  c.resize(320, 120);
  c.primaryAxisSizingMode = 'AUTO';
  c.clipsContent = true;
  const items = h.slot(c, 'Items', { direction: 'VERTICAL' });
  c.appendChild(items);
  items.layoutAlign = 'STRETCH';
  [['True', 'What is Base UI?'], ['False', 'How do I get started?'], ['False', 'Can I use it for my project?']].forEach(([open, title], i) => {
    const item = set.children.find((x) => x.variantProperties.Open === open && x.variantProperties.State === 'Default').createInstance();
    item.name = 'item';
    item.setProperties({ [key('Title')]: title, [key('Show divider')]: i > 0 });
    items.appendChild(item);
    item.layoutAlign = 'STRETCH';
  });
  return c;
}
