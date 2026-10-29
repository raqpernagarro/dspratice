// Slider: control (padding = hit area) › track › indicator (40%) + thumb at 40%, absolutely placed.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'AUTO', align: 'CENTER' }, 'component');
  c.resize(224, 28);
  const track = h.frame('track', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', align: 'MIN', fill: true });
  track.resize(224, 4);
  c.appendChild(track);
  track.layoutGrow = 1;
  const indicator = h.frame('indicator', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', fill: true });
  indicator.resize(90, 4);
  track.appendChild(indicator);
  indicator.layoutAlign = 'STRETCH';
  const thumb = h.frame('thumb', { direction: 'HORIZONTAL', primary: 'FIXED', counter: 'FIXED', fill: true, stroke: true });
  thumb.resize(16, 16);
  track.appendChild(thumb);
  thumb.layoutPositioning = 'ABSOLUTE';
  thumb.constraints = { horizontal: 'SCALE', vertical: 'CENTER' };
  return c;
}

// The thumb sits on the indicator's end, centered on the track (sizes are final after binding).
async function afterBind(set) {
  for (const c of set.children) {
    const track = c.findChild((n) => n.name === 'track');
    const indicator = track.findChild((n) => n.name === 'indicator');
    const thumb = track.findChild((n) => n.name === 'thumb');
    thumb.x = indicator.width - thumb.width / 2;
    thumb.y = (track.height - thumb.height) / 2;
  }
}
