// Fieldset: a legend over a Fields slot holding two Field instances of the same size (plain text
// fields: the nested Inputs have no icon).
async function buildVariant(v, h, props) {
  const set = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Field');
  if (!set) throw new Error('Build Field first');
  const input = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((x) => x.name === 'Input');
  const labelKey = Object.keys(set.componentPropertyDefinitions).find((k) => k.startsWith('Label#'));
  const showKey = Object.keys(set.componentPropertyDefinitions).find((k) => k.startsWith('Show description#'));
  const iconKey = Object.keys(input.componentPropertyDefinitions).find((k) => k.startsWith('Show icon#'));
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN' }, 'component');
  c.resize(240, 100);
  c.primaryAxisSizingMode = 'AUTO';
  c.appendChild(h.text('legend', 'Billing details'));
  const fields = h.slot(c, 'Fields', { direction: 'VERTICAL' });
  c.appendChild(fields);
  for (const text of ['Company', 'Tax ID']) {
    const field = set.children.find((x) => x.variantProperties.Size === props.Size && x.variantProperties.Invalid === 'False').createInstance();
    field.name = 'field';
    field.setProperties({ [labelKey]: text, [showKey]: false });
    field.findOne((x) => x.type === 'INSTANCE' && x.name === 'control').setProperties({ [iconKey]: false });
    fields.appendChild(field);
    field.layoutAlign = 'STRETCH';
  }
  for (const n of c.children) n.layoutAlign = 'STRETCH';
  return c;
}
