// Scroll Area: a clipped box; the bordered viewport holds the content (cut off at the bottom) and
// the scrollbar runs along the right edge (shown, as while hovering).
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'VERTICAL', primary: 'FIXED', counter: 'FIXED', align: 'MIN' }, 'component');
  c.resize(320, 136);
  c.clipsContent = true;
  const viewport = h.frame('viewport', { direction: 'VERTICAL', primary: 'FIXED', align: 'MIN', fill: true, stroke: true });
  viewport.clipsContent = true;
  c.appendChild(viewport);
  viewport.layoutAlign = 'STRETCH';
  viewport.layoutGrow = 1;
  const content = h.slot(c, 'Content', { direction: 'VERTICAL' });
  for (const t of [
    'Vernacular architecture is building done outside any academic tradition, and without professional guidance. It is not a particular architectural movement or style, but rather a broad category.',
    'This type of architecture usually serves immediate, local needs, is constrained by the materials available in its region and reflects local traditions.',
  ]) {
    const p = h.text('text', t);
    content.appendChild(p);
    p.layoutAlign = 'STRETCH';
    p.textAutoResize = 'HEIGHT';
  }
  viewport.appendChild(content);
  content.layoutAlign = 'STRETCH';
  const scrollbar = h.frame('scrollbar', { direction: 'VERTICAL', primary: 'FIXED', counter: 'FIXED', align: 'MIN' });
  c.appendChild(scrollbar);
  scrollbar.layoutPositioning = 'ABSOLUTE';
  scrollbar.resize(8, 136);
  scrollbar.constraints = { horizontal: 'MAX', vertical: 'STRETCH' };
  const thumb = h.frame('thumb', { direction: 'VERTICAL', primary: 'FIXED', counter: 'FIXED', fill: true });
  thumb.resize(4, 56);
  scrollbar.appendChild(thumb);
  thumb.layoutAlign = 'STRETCH';
  return c;
}

// The scrollbar hugs the right edge at its bound width.
async function afterBind(set) {
  const scrollbar = set.findChild((n) => n.name === 'scrollbar');
  scrollbar.x = set.width - scrollbar.width;
  scrollbar.y = 0;
}
