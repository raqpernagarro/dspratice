// Breadcrumb Item: the link text, then a caret (hidden on the current page). Hover underlines, as in code.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', align: 'CENTER' }, 'component');
  const link = h.text('link', 'Projects');
  if (v.state === 'hover') link.textDecoration = 'UNDERLINE';
  c.appendChild(link);
  const separator = h.icon('CaretRight', 'Format=Stroke, Weight=Fill');
  separator.name = 'separator';
  c.appendChild(separator);
  separator.visible = v.state !== 'current';
  return c;
}
