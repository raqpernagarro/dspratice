// Preview Card: picture placeholder, title and summary; the arrow on the edge facing the link.
async function buildVariant(v, h) {
  const c = h.frame('', { direction: 'VERTICAL', primary: 'AUTO', counter: 'FIXED', align: 'MIN', fill: true, stroke: true }, 'component');
  c.resize(240, 200);
  c.primaryAxisSizingMode = 'AUTO';
  const image = h.frame('image', { direction: 'VERTICAL', primary: 'FIXED', counter: 'FIXED', fill: true });
  image.resize(224, 144);
  c.appendChild(image);
  image.layoutAlign = 'STRETCH';
  const title = h.text('title', 'Typography');
  c.appendChild(title);
  const summary = h.text('summary', 'The art and science of arranging type to make written language clear and appealing.');
  c.appendChild(summary);
  for (const t of [title, summary]) { t.layoutAlign = 'STRETCH'; t.textAutoResize = 'HEIGHT'; }
  addArrow(c, v.side);
  return c;
}

// The arrow on the edge facing the trigger: a clipping frame (12 × 6, or 6 × 12 on the sides)
// showing half of a bordered diamond whose centre sits on the popup's edge, like code.
const ARROW_CENTRE = { bottom: [6, 6], top: [6, 0], right: [6, 6], left: [0, 6] };
function addArrow(parent, side) {
  const across = side === "left" || side === "right";
  const a = figma.createFrame();
  a.name = "arrow";
  a.fills = [];
  a.clipsContent = true;
  a.resize(across ? 6 : 12, across ? 12 : 6);
  parent.appendChild(a);
  a.layoutPositioning = "ABSOLUTE";
  const s = figma.createFrame();
  s.name = "shape";
  s.resize(6 * Math.SQRT2, 6 * Math.SQRT2);
  s.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  s.strokes = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  s.strokeAlign = "INSIDE";
  a.appendChild(s);
  const c = Math.SQRT1_2;
  const [cx, cy] = ARROW_CENTRE[side];
  s.relativeTransform = [[c, c, cx - 6], [-c, c, cy]];
  placeArrow(a, side);
  return a;
}
// Overlaps the border by 1px so the tip joins the surface. Re-run once sizes are bound.
function placeArrow(a, side) {
  const p = a.parent;
  if (side === "bottom") { a.x = Math.round(p.width / 2 - 6); a.y = -5; a.constraints = { horizontal: "CENTER", vertical: "MIN" }; }
  if (side === "top") { a.x = Math.round(p.width / 2 - 6); a.y = p.height - 1; a.constraints = { horizontal: "CENTER", vertical: "MAX" }; }
  if (side === "right") { a.x = -5; a.y = Math.round(p.height / 2 - 6); a.constraints = { horizontal: "MIN", vertical: "CENTER" }; }
  if (side === "left") { a.x = p.width - 1; a.y = Math.round(p.height / 2 - 6); a.constraints = { horizontal: "MAX", vertical: "CENTER" }; }
}
async function afterBind(set) {
  for (const variant of set.type === "COMPONENT_SET" ? set.children : [set]) {
    const side = (variant.variantProperties?.Side ?? "Bottom").toLowerCase();
    for (const a of variant.findAll((n) => n.name === "arrow")) placeArrow(a, side);
  }
}

