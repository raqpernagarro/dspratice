// Autocomplete: an Input (focused, typed text) over a Listbox whose Options hide their indicator.
async function buildVariant(v, h) {
  const sets = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] });
  const input = sets.find((s) => s.name === 'Input' && s.type === 'COMPONENT_SET');
  const listbox = sets.find((s) => s.name === 'Listbox' && s.type === 'COMPONENT');
  if (!input || !listbox) throw new Error('Build Input and Listbox first');
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN' }, 'component');
  c.resize(240, 100);
  c.primaryAxisSizingMode = 'AUTO'; // resize() fixes both axes: hug the content again.
  const field = input.children.find((x) => { const p = x.variantProperties; return p.Size === 'Medium' && p.State === 'Focused' && p.Filled === 'True' && p.Invalid === 'False'; }).createInstance();
  field.name = 'input';
  c.appendChild(field);
  // What the user typed so far.
  const typed = field.findOne((n) => n.type === 'TEXT' && n.name === 'value');
  await figma.loadFontAsync(typed.fontName);
  typed.characters = 'fe';
  const list = listbox.createInstance();
  list.name = 'listbox';
  c.appendChild(list);
  const option = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Option');
  const showKey = Object.keys(option.componentPropertyDefinitions).find((k) => k.startsWith('Show indicator'));
  const labelKey = Object.keys(option.componentPropertyDefinitions).find((k) => k.startsWith('Label'));
  const texts = ['feature', 'fix', 'performance', 'design'];
  list.findAll((n) => n.type === 'INSTANCE' && n.name === 'option').forEach((o, i) => {
    // Suggestions: none is selected; the highlight stays on the third.
    const p = o.variantProperties;
    if (p.Selected === 'True') o.swapComponent(option.children.find((x) => x.variantProperties.State === p.State && x.variantProperties.Selected === 'False'));
    o.setProperties({ [showKey]: false, [labelKey]: texts[i] ?? 'tag' });
  });
  for (const n of c.children) n.layoutAlign = 'STRETCH';
  return c;
}
