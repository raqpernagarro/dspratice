// Pagination on page 5 of 10: previous · 1 … 4 [5] 6 … 10 · next. Ghost Buttons for pages, a Secondary
// Button for the current page, ghost Icon Buttons with carets for previous / next.
async function buildVariant(v, h) {
  const sets = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] });
  const buttonSet = sets.find((s) => s.name === 'Button');
  const iconSet = sets.find((s) => s.name === 'Icon Button');
  if (!buttonSet || !iconSet) throw new Error('Build Button and Icon Button first');
  const size = { sm: 'Small', md: 'Medium', lg: 'Large' }[v.size];
  const c = h.frame('', { direction: 'HORIZONTAL', align: 'CENTER' }, 'component');
  const list = h.frame('list', { direction: 'HORIZONTAL', align: 'CENTER' });
  c.appendChild(list);
  const swaps = [];
  const arrow = (name, icon) => {
    const b = iconSet.children.find((x) => { const p = x.variantProperties; return p.Type === 'Ghost' && p.Size === size && p.State === 'Default' && p.Destructive === 'False'; }).createInstance();
    b.name = name;
    const glyph = b.findOne((n) => n.type === 'INSTANCE' && n.name.toLowerCase() === 'icon');
    const variants = globalThis.__icons[icon].set.children;
    swaps.push(glyph.getMainComponentAsync().then((m) => glyph.swapComponent(variants.find((x) => x.name === m?.name) ?? variants.find((x) => x.name === 'Format=Stroke, Weight=Fill'))));
    list.appendChild(b);
  };
  const page = (n, current) => {
    const b = buttonSet.children.find((x) => { const p = x.variantProperties; return p.Type === (current ? 'Secondary' : 'Ghost') && p.Size === size && p.State === 'Default' && p.Destructive === 'False'; }).createInstance();
    b.name = current ? 'current' : 'page';
    const label = Object.keys(b.componentProperties).find((k) => k.startsWith('Text#'));
    const props = Object.fromEntries(Object.keys(b.componentProperties).filter((k) => /^Show (Lead|Trail)#/.test(k)).map((k) => [k, false]));
    if (label) props[label] = String(n);
    b.setProperties(props);
    b.primaryAxisAlignItems = 'CENTER';
    list.appendChild(b);
  };
  const ellipsis = () => {
    const t = h.text('ellipsis', '…');
    t.textAlignHorizontal = 'CENTER';
    list.appendChild(t);
  };
  arrow('previous', 'CaretLeft');
  page(1);
  ellipsis();
  page(4);
  page(5, true);
  page(6);
  ellipsis();
  page(10);
  arrow('next', 'CaretRight');
  await Promise.all(swaps);
  return c;
}
