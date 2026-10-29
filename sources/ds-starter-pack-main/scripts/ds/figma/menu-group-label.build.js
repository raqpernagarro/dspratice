// Menu Group Label: the label row (stretches to the menu's width).
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', align: 'CENTER' }, 'component');
  c.resize(212, 24);
  c.appendChild(h.text('text', 'Library'));
  return c;
}
