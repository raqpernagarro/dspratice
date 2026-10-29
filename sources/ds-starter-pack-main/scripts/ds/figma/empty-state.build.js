// Empty State: icon (a soft circle with a folder) › text (title, description) › Actions slot (a Button). 360 wide.
async function buildVariant(v, h) {
  const buttonSet = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Button');
  if (!buttonSet) throw new Error('Build Button first');
  const c = h.frame('', { direction: 'VERTICAL', align: 'CENTER', fill: true, width: 360 }, 'component');
  c.counterAxisSizingMode = 'FIXED';
  const icon = h.frame('icon', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', justify: 'CENTER', align: 'CENTER', fill: true });
  icon.resize(44, 44);
  c.appendChild(icon);
  const glyph = h.icon('FolderSimple', 'Format=Stroke, Weight=Fill');
  glyph.name = 'glyph';
  icon.appendChild(glyph);
  const text = h.frame('text', { direction: 'VERTICAL', align: 'CENTER' });
  c.appendChild(text);
  text.layoutAlign = 'STRETCH';
  const title = h.text('title', 'No projects yet');
  title.textAlignHorizontal = 'CENTER';
  text.appendChild(title);
  const description = h.text('description', 'Create a project to start designing with the system.');
  description.textAlignHorizontal = 'CENTER';
  text.appendChild(description);
  description.layoutAlign = 'STRETCH';
  description.textAutoResize = 'HEIGHT';
  const actions = h.slot(c, 'Actions', { direction: 'HORIZONTAL', justify: 'CENTER', align: 'CENTER' });
  c.appendChild(actions);
  const button = buttonSet.children.find((x) => { const p = x.variantProperties; return p.Type === 'Primary' && p.Size === 'Small' && p.State === 'Default' && p.Destructive === 'False'; }).createInstance();
  button.name = 'button';
  const label = Object.keys(button.componentProperties).find((k) => k.startsWith('Text#'));
  const props = Object.fromEntries(Object.keys(button.componentProperties).filter((k) => /^Show (Lead|Trail)#/.test(k)).map((k) => [k, false]));
  if (label) props[label] = 'New project';
  button.setProperties(props);
  actions.appendChild(button);
  return c;
}
