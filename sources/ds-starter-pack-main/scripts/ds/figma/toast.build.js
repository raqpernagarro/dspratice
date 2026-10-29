// Toast: the surface › content (type icon; text: title, description; close: a Dismiss Button).
const TOAST_ICONS = { neutral: 'Info', success: 'CheckCircle', warning: 'Warning', error: 'XCircle' };
async function buildVariant(v, h) {
  const buttonSet = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === 'Button');
  const key = (prefix) => Object.keys(buttonSet.componentPropertyDefinitions).find((k) => k.startsWith(prefix));
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN', fill: true, stroke: true }, 'component');
  c.resize(360, 80);
  c.primaryAxisSizingMode = 'AUTO';
  const content = h.frame('content', { direction: 'HORIZONTAL', align: 'MIN' });
  const icon = h.icon(TOAST_ICONS[v.type], 'Format=Stroke, Weight=Fill');
  icon.name = 'icon';
  content.appendChild(icon);
  const text = h.frame('text', { direction: 'VERTICAL', align: 'MIN' });
  for (const [name, t] of [['title', 'Message sent'], ['description', 'Your message is on its way.']]) {
    const n = h.text(name, t);
    text.appendChild(n);
    n.layoutAlign = 'STRETCH';
    n.textAutoResize = 'HEIGHT';
  }
  content.appendChild(text);
  text.layoutGrow = 1;
  const b = buttonSet.children.find((x) => { const p = x.variantProperties; return p.Type === 'Secondary' && p.Size === 'Medium' && p.State === 'Default' && p.Destructive === 'False'; }).createInstance();
  b.name = 'close';
  const props = { [key('Text')]: 'Dismiss' };
  if (key('Show Lead')) props[key('Show Lead')] = false;
  if (key('Show Trail')) props[key('Show Trail')] = false;
  b.setProperties(props);
  content.appendChild(b);
  c.appendChild(content);
  content.layoutAlign = 'STRETCH';
  // A horizontal row only stretches with a fixed width (hugging wraps the text word by word).
  content.primaryAxisSizingMode = 'FIXED';
  return c;
}
