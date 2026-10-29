// Skeleton: a filled box. Text: one line, 200 wide; Circle: an avatar; Block: 200 × 96.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', fill: true }, 'component');
  if (v.shape === 'text') c.resize(200, 14);
  else if (v.shape === 'circle') c.resize(36, 36);
  else c.resize(200, 96);
  return c;
}
