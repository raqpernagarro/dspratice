// Toolbar: an Items slot of groups (ghost Icon Buttons, Toggles) split by vertical Separators.
async function buildVariant(v, h) {
  const sets = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] });
  const toggleSet = sets.find((s) => s.name === 'Toggle');
  const buttonSet = sets.find((s) => s.name === 'Icon Button');
  const separatorSet = sets.find((s) => s.name === 'Separator');
  if (!toggleSet || !buttonSet || !separatorSet) throw new Error('Build Toggle, Icon Button and Separator first');
  // Swap an instance's library icon, keeping the weight the variant uses (Toggle: 'icon', Icon Button:
  // 'Icon'). The lookups are async: start them all and await them together (see §2a, plugin gotchas).
  const swaps = [];
  const swapIcon = (inst, name) => {
    const glyph = inst.findOne((n) => n.type === 'INSTANCE' && n.name.toLowerCase() === 'icon');
    const variants = globalThis.__icons[name].set.children;
    swaps.push(glyph.getMainComponentAsync().then((m) => glyph.swapComponent(variants.find((x) => x.name === m?.name) ?? variants.find((x) => x.name === 'Format=Stroke, Weight=Fill'))));
  };
  const c = h.frame('', { direction: 'HORIZONTAL', align: 'CENTER', fill: true, stroke: true }, 'component');
  const items = h.slot(c, 'Items', { direction: 'HORIZONTAL', align: 'CENTER' });
  c.appendChild(items);
  const group = (children) => {
    const g = h.frame('group', { direction: 'HORIZONTAL', align: 'CENTER' });
    for (const child of children) g.appendChild(child);
    items.appendChild(g);
  };
  const separator = () => {
    const s = separatorSet.children.find((x) => x.variantProperties.Orientation === 'Vertical').createInstance();
    s.name = 'separator';
    items.appendChild(s);
  };
  const button = (icon) => {
    const b = buttonSet.children.find((x) => { const p = x.variantProperties; return p.Type === 'Ghost' && p.Size === 'Medium' && p.State === 'Default' && p.Destructive === 'False'; }).createInstance();
    b.name = 'button';
    swapIcon(b, icon);
    return b;
  };
  const toggle = (icon, selected) => {
    const t = toggleSet.children.find((x) => { const p = x.variantProperties; return p.Size === 'Medium' && p.State === 'Default' && p.Selected === selected; }).createInstance();
    t.name = 'toggle';
    swapIcon(t, icon);
    return t;
  };
  group([button('ArrowArcLeft'), button('ArrowArcRight')]);
  separator();
  group([toggle('TextB', 'True'), toggle('TextItalic', 'False')]);
  separator();
  group([toggle('TextAlignLeft', 'True'), toggle('TextAlignCenter', 'False'), toggle('TextAlignRight', 'False')]);
  await Promise.all(swaps);
  return c;
}
