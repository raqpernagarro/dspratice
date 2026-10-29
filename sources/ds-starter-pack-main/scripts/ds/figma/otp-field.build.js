// OTP Field: six OTP Slot instances of the same size (two filled, the third focused).
async function buildVariant(v, h, props) {
  const set = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'OTP Slot');
  if (!set) throw new Error('Build OTP Slot first');
  const c = h.frame('', { direction: 'HORIZONTAL', align: 'CENTER' }, 'component');
  for (let i = 0; i < 6; i++) {
    const state = i === 2 ? 'Focused' : 'Default';
    const filled = i < 2 ? 'True' : 'False';
    const slot = set.children.find((x) => { const p = x.variantProperties; return p.Size === props.Size && p.State === state && p.Filled === filled && p.Invalid === 'False'; }).createInstance();
    slot.name = 'slot';
    c.appendChild(slot);
  }
  return c;
}
