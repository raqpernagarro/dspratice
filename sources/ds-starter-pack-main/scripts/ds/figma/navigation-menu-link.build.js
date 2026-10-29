// Navigation Menu Link: a card with the page's title and a line of description.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN', fill: true }, 'component');
  c.resize(300, 60);
  c.primaryAxisSizingMode = 'AUTO';
  for (const [name, text] of [['title', 'Quick start'], ['description', 'Install and assemble your first component.']]) {
    const t = h.text(name, text);
    c.appendChild(t);
    t.layoutAlign = 'STRETCH';
    t.textAutoResize = 'HEIGHT';
  }
  return c;
}
