// Toggle Group: a bordered row of three Toggle instances of the same size (alignment icons).
async function buildVariant(v, h, props) {
  const set = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Toggle');
  if (!set) throw new Error('Build Toggle first');
  const c = h.frame('', { direction: 'HORIZONTAL', align: 'CENTER', fill: true, stroke: true }, 'component');
  const items = h.slot(c, 'Items', { direction: 'HORIZONTAL', align: 'CENTER' });
  c.appendChild(items);
  [['TextAlignLeft', 'True'], ['TextAlignCenter', 'False'], ['TextAlignRight', 'False']].forEach(([glyph, selected]) => {
    const variant = set.children.find((x) => x.variantProperties.Size === props.Size && x.variantProperties.State === 'Default' && x.variantProperties.Selected === selected);
    const toggle = variant.createInstance();
    toggle.name = 'toggle';
    const icon = toggle.findChild((n) => n.name === 'icon');
    icon.swapComponent(globalThis.__icons[glyph].set.children.find((x) => x.name === (selected === 'True' ? 'Format=Stroke, Weight=Fill' : 'Format=Outline, Weight=Regular')));
    items.appendChild(toggle);
  });
  return c;
}
