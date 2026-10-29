// OTP Slot: a square box like Input's, with the character centered.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', justify: 'CENTER', align: 'CENTER', fill: true, stroke: true }, 'component');
  c.resize(36, 36);
  const value = h.text('value', v.filled === 'true' ? '4' : '');
  value.textAlignHorizontal = 'CENTER';
  c.appendChild(value);
  return c;
}
