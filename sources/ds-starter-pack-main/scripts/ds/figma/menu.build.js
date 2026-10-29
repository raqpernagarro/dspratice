// Menu: the popup with an Items slot holding a group label, Menu Items and a separator (like
// MenuPreview in code). Designers add Menu Items, Menu Group Labels and Menu Separators to the slot.
async function buildVariant(v, h) {
  const sets = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] });
  const itemSet = sets.find((s) => s.name === 'Menu Item' && s.type === 'COMPONENT_SET');
  const groupLabel = sets.find((s) => s.name === 'Menu Group Label' && s.type === 'COMPONENT');
  const separator = sets.find((s) => s.name === 'Menu Separator' && s.type === 'COMPONENT');
  if (!itemSet || !groupLabel || !separator) throw new Error('Build Menu Item, Menu Group Label and Menu Separator first');
  const labelKey = Object.keys(itemSet.componentPropertyDefinitions).find((k) => k.startsWith('Label'));
  const item = (props, text) => {
    const variant = itemSet.children.find((c) => Object.entries(props).every(([k, x]) => c.variantProperties[k] === x));
    const i = variant.createInstance();
    i.name = 'item';
    i.setProperties({ [labelKey]: text });
    return i;
  };
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN', fill: true, stroke: true }, 'component');
  c.resize(220, 100);
  c.primaryAxisSizingMode = 'AUTO';
  const items = h.slot(c, 'Items', { direction: 'VERTICAL' });
  c.appendChild(items);
  items.layoutAlign = 'STRETCH';
  const g = groupLabel.createInstance();
  g.name = 'group label';
  items.appendChild(g);
  items.appendChild(item({ Type: 'Default', State: 'Default', Checked: 'False' }, 'Add to Library'));
  items.appendChild(item({ Type: 'Default', State: 'Highlighted', Checked: 'False' }, 'Add to Playlist'));
  items.appendChild(item({ Type: 'Submenu', State: 'Default', Checked: 'False' }, 'Share'));
  const s = separator.createInstance();
  s.name = 'separator';
  items.appendChild(s);
  items.appendChild(item({ Type: 'Checkbox', State: 'Default', Checked: 'True' }, 'Shuffle'));
  items.appendChild(item({ Type: 'Checkbox', State: 'Default', Checked: 'False' }, 'Repeat'));
  for (const n of items.children) n.layoutAlign = 'STRETCH';
  return c;
}
