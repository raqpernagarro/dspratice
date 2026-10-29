// Checkbox group: a label and Checkbox instances (option) of the same size.
async function buildVariant(v, h, props) {
  const set = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Checkbox');
  if (!set) throw new Error('Build Checkbox first');
  const labelKey = Object.keys(set.componentPropertyDefinitions).find((k) => k.startsWith('Label#'));
  const c = h.frame('', { direction: 'VERTICAL', align: 'MIN' }, 'component');
  const options = h.slot(c, 'Options', { direction: 'VERTICAL' });
  c.appendChild(h.text('label', 'Notifications'));
  'Email|SMS|Push'.split('|').forEach((text, i) => {
    const variant = set.children.find((x) => x.variantProperties.Size === props.Size && x.variantProperties.State === 'Default' && x.variantProperties.Checked === (i === 0 ? 'True' : 'False'));
    const option = variant.createInstance();
    option.name = 'option';
    option.setProperties({ [labelKey]: text });
    options.appendChild(option);
  });
  c.appendChild(options);
  return c;
}

async function afterSet(set) {
  const label = set.addComponentProperty('Label', 'TEXT', 'Notifications');
  for (const c of set.children) c.findChild((n) => n.name === 'label').componentPropertyReferences = { characters: label };
}
