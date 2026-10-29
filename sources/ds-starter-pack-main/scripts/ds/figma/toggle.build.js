// Toggle: a square button holding the icon. Line icon while off, filled while on (like code).
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'AUTO', counter: 'FIXED', justify: 'CENTER', align: 'CENTER', fill: true }, 'component');
  c.resize(36, 36);
  const icon = h.icon('Heart', v.selected === 'true' ? 'Format=Stroke, Weight=Fill' : 'Format=Outline, Weight=Regular');
  icon.name = 'icon';
  c.appendChild(icon);
  return c;
}
