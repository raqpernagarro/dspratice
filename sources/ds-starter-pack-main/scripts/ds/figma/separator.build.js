// Separator: a line; its height (horizontal) or width (vertical) is the thickness.
async function buildVariant(v, h) {
  const vertical = v.orientation === 'vertical';
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', fill: true }, 'component');
  c.resize(vertical ? 1 : 240, vertical ? 24 : 1);
  return c;
}
