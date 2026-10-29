// Form: a Fields slot (two Field instances) and an Actions slot (a primary and a ghost Button).
async function buildVariant(v, h) {
  const sets = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] });
  const fieldSet = sets.find((s) => s.name === 'Field');
  const buttonSet = sets.find((s) => s.name === 'Button');
  const input = sets.find((x) => x.name === 'Input');
  const key = (set, prefix) => Object.keys(set.componentPropertyDefinitions).find((k) => k.startsWith(prefix));
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN' }, 'component');
  c.resize(240, 100);
  c.primaryAxisSizingMode = 'AUTO';
  const fields = h.slot(c, 'Fields', { direction: 'VERTICAL' });
  c.appendChild(fields);
  for (const text of ['Email', 'Password']) {
    const field = fieldSet.children.find((x) => x.variantProperties.Size === 'Medium' && x.variantProperties.Invalid === 'False').createInstance();
    field.name = 'field';
    field.setProperties({ [key(fieldSet, 'Label#')]: text, [key(fieldSet, 'Show description#')]: false });
    // Plain text fields: no leading icon on the nested Input.
    field.findOne((x) => x.type === 'INSTANCE' && x.name === 'control').setProperties({ [key(input, 'Show icon#')]: false });
    fields.appendChild(field);
    field.layoutAlign = 'STRETCH';
  }
  const actions = h.slot(c, 'Actions', { direction: 'HORIZONTAL', align: 'CENTER' });
  c.appendChild(actions);
  for (const [type, text] of [['Primary', 'Sign in'], ['Ghost', 'Cancel']]) {
    const b = buttonSet.children.find((x) => { const p = x.variantProperties; return p.Type === type && p.Size === 'Medium' && p.State === 'Default' && p.Destructive === 'False'; }).createInstance();
    b.name = 'button';
    const props = { [key(buttonSet, 'Text')]: text };
    const lead = key(buttonSet, 'Show Lead'), trail = key(buttonSet, 'Show Trail');
    if (lead) props[lead] = false;
    if (trail) props[trail] = false;
    b.setProperties(props);
    actions.appendChild(b);
  }
  for (const n of c.children) n.layoutAlign = 'STRETCH';
  return c;
}
