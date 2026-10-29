// Tabs: a List slot of Tabs (the set's size) over the Panel slot. The list overlaps the panel's top
// border by 1px and is stacked above it, so the selected tab hides that border, like code.
async function buildVariant(v, h, props) {
  const tabSet = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Tab');
  if (!tabSet) throw new Error('Build Tab first');
  const labelKey = Object.keys(tabSet.componentPropertyDefinitions).find((k) => k.startsWith('Label'));
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN' }, 'component');
  c.resize(320, 120);
  c.primaryAxisSizingMode = 'AUTO';
  c.itemSpacing = -1;
  c.itemReverseZIndex = true;
  const list = h.slot(c, 'List', { direction: 'HORIZONTAL', align: 'MAX' });
  c.appendChild(list);
  for (const [selected, text] of [['True', 'Overview'], ['False', 'Projects'], ['False', 'Account']]) {
    const t = tabSet.children.find((x) => { const p = x.variantProperties; return p.Size === props.Size && p.Selected === selected && p.State === 'Default'; }).createInstance();
    t.name = 'tab';
    t.setProperties({ [labelKey]: text });
    list.appendChild(t);
  }
  const panel = h.slot(c, 'Panel', { direction: 'VERTICAL', fill: true, stroke: true });
  const text = h.text('text', 'Workspace stats and activity.');
  panel.appendChild(text);
  text.layoutAlign = 'STRETCH';
  text.textAutoResize = 'HEIGHT';
  c.appendChild(panel);
  panel.layoutAlign = 'STRETCH';
  return c;
}
