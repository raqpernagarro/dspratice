// Menu Separator: padding around the line.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN' }, 'component');
  c.resize(212, 9);
  c.primaryAxisSizingMode = 'AUTO';
  const line = h.frame('line', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', fill: true });
  line.resize(196, 1);
  c.appendChild(line);
  line.layoutAlign = 'STRETCH';
  return c;
}
