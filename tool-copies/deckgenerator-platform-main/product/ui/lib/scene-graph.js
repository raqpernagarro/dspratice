// =============================================================================
// Scene Graph — Phase 1 of the object-model migration.
//
// A slide becomes a collection of OBJECTS. Templates keep generating slides
// exactly as they do today (this module changes no rendering and no export
// path); after each render the editor derives the equivalent scene graph
// from the rendered, decorated stage and uses IT as the editing model:
// selection resolves to an object, the AI receives the object layout, and
// every future capability (resize handles, alignment, grouping, components,
// constraints) hangs off this structure instead of template fields.
//
// Sources of truth, deliberately layered:
//   content   → the slide record (template fields) — still what persists.
//   geometry  → measured from the rendered DOM, in slide units (1920×1080).
//   binding   → the decoration passes (editable-canvas.js + the editor's
//               chrome/image decorators) already tag DOM nodes with their
//               field origin; this module lifts those tags into objects.
//   inventory → visible leaves that no decoration reached become objects
//               with editable:false — the exact worklist Phase 2 burns down.
//
// The graph is DERIVED, never stored: existing presentations, exports and
// APIs are untouched by construction, and rebuilding it after each render
// keeps it correct without any synchronization protocol.
// =============================================================================

let nextId = 0;
const uid = () => `obj_${(++nextId).toString(36)}`;

/** Slide-unit geometry of `el` inside `stageEl` (which may be scaled). */
function measure(el, stageRect, scale) {
  const r = el.getBoundingClientRect();
  return {
    x: Math.round(((r.left - stageRect.left) / scale) * 10) / 10,
    y: Math.round(((r.top - stageRect.top) / scale) * 10) / 10,
    width: Math.round((r.width / scale) * 10) / 10,
    height: Math.round((r.height / scale) * 10) / 10,
    rotation: 0, // templates never rotate today; the slot exists for Phase 5
  };
}

function textStyleOf(el) {
  const cs = getComputedStyle(el);
  return {
    fontSize: Math.round(parseFloat(cs.fontSize) * 10) / 10,
    fontWeight: cs.fontWeight,
    textAlign: cs.textAlign,
    color: cs.color,
  };
}

/**
 * Builds the scene graph for one rendered slide.
 *
 * @param {HTMLElement} stageEl - the decorated .stage already in the DOM
 * @param {{slide: object, fieldDefs: object[]}} ctx
 * @returns {{canvas: {width, height}, objects: object[], byEl: WeakMap}}
 */
export function buildSceneGraph(stageEl, { slide, fieldDefs = [] } = {}) {
  const stageRect = stageEl.getBoundingClientRect();
  if (!stageRect.width) return { canvas: { width: 1920, height: 1080 }, objects: [], byEl: new WeakMap() };
  const scale = stageRect.width / 1920;
  const objects = [];
  const byEl = new WeakMap();
  const labelOf = (key) => fieldDefs.find((d) => d.key === key)?.label || key;
  let z = 0;

  const push = (obj, el) => {
    obj.zIndex = z++;
    objects.push(obj);
    if (el) byEl.set(el, obj);
    return obj;
  };

  // Row groups: bound row-field spans that share a rowUid belong to one
  // repeatable unit — modeled as a group object the members point at.
  const rowGroups = new Map(); // rowUid -> group object

  // ---- Bound objects: everything the decoration passes reached ------------
  for (const el of stageEl.querySelectorAll(".ed-editable, .ed-editable-img")) {
    const g = measure(el, stageRect, scale);
    if (el.classList.contains("ed-editable-img")) {
      push({
        id: uid(), type: "image", geometry: g,
        content: { src: el.getAttribute("src") || "" },
        style: {}, constraints: { aspectLocked: true }, parentId: null,
        origin: { templateField: el.dataset.edImgField, kind: "image" },
        editable: true,
        ai: { label: labelOf(el.dataset.edImgField), text: false },
        metadata: {},
      }, el);
      continue;
    }
    const kind = el.dataset.edKind;
    let parentId = null;
    if (kind === "row-field" && el.dataset.edRow) {
      let group = rowGroups.get(el.dataset.edRow);
      if (!group) {
        group = push({
          id: uid(), type: "group", geometry: null, // finalized below from members
          content: {}, style: {}, constraints: {}, parentId: null,
          origin: { templateField: el.dataset.edField, kind: "row", rowUid: el.dataset.edRow },
          editable: true, ai: { label: `${labelOf(el.dataset.edField)} item`, text: false }, metadata: { members: [] },
        });
        rowGroups.set(el.dataset.edRow, group);
      }
      parentId = group.id;
      group.metadata.members.push(el);
    }
    push({
      id: uid(),
      type: kind === "deck" ? "chrome-text" : "text",
      geometry: g,
      content: { text: el.dataset.edMultiline ? el.innerText : el.textContent },
      style: textStyleOf(el),
      constraints: {},
      parentId,
      origin: kind === "deck"
        ? { deckField: el.dataset.edDeckField, kind }
        : {
            templateField: el.dataset.edField, kind,
            index: el.dataset.edIndex !== undefined ? Number(el.dataset.edIndex) : undefined,
            rowUid: el.dataset.edRow,
            rowIndex: el.dataset.edRowindex !== undefined ? Number(el.dataset.edRowindex) : undefined,
            subKey: el.dataset.edSubkey,
          },
      editable: true,
      ai: {
        label: kind === "deck" ? `Footer (${el.dataset.edDeckField})` : labelOf(el.dataset.edField),
        text: true,
      },
      metadata: {},
    }, el);
  }

  // Group geometry = union of member rects.
  for (const group of rowGroups.values()) {
    const rects = group.metadata.members.map((el) => measure(el, stageRect, scale));
    group.metadata.members = rects.length; // drop live nodes; keep the count
    if (!rects.length) continue;
    const x = Math.min(...rects.map((r) => r.x));
    const y = Math.min(...rects.map((r) => r.y));
    group.geometry = {
      x, y,
      width: Math.round((Math.max(...rects.map((r) => r.x + r.width)) - x) * 10) / 10,
      height: Math.round((Math.max(...rects.map((r) => r.y + r.height)) - y) * 10) / 10,
      rotation: 0,
    };
  }

  // ---- Inventory: visible leaves nothing reached ---------------------------
  // These are the "why can't I edit this?" candidates. Each becomes a real
  // object with editable:false and enough origin data to plan its adapter.
  const claimed = (el) => byEl.has(el) || !!el.closest(".ed-editable, .ed-editable-img");
  for (const el of stageEl.querySelectorAll("img, svg")) {
    if (claimed(el)) continue;
    const g = measure(el, stageRect, scale);
    if (g.width < 8 || g.height < 8) continue;
    push({
      id: uid(), type: el.tagName === "IMG" ? "image" : "graphic", geometry: g,
      content: el.tagName === "IMG" ? { src: el.getAttribute("src") || "" } : {},
      style: {}, constraints: {}, parentId: null,
      origin: { kind: "unbound", chrome: !!el.closest(".logo, .footer") },
      editable: false,
      ai: { label: el.closest(".logo") ? "Logo" : "Graphic", text: false },
      metadata: {},
    }, el);
  }
  const walker = document.createTreeWalker(stageEl, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (n.parentElement?.closest(".ed-editable")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node;
  // eslint-disable-next-line no-cond-assign
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (byEl.has(el)) continue;
    const g = measure(el, stageRect, scale);
    if (g.width < 4 || g.height < 4) continue;
    push({
      id: uid(), type: "text", geometry: g,
      content: { text: el.textContent.trim().slice(0, 200) },
      style: textStyleOf(el), constraints: {}, parentId: null,
      origin: { kind: "unbound", chrome: !!el.closest(".logo, .footer") },
      editable: false,
      ai: { label: "Decorative text", text: true },
      metadata: {},
    }, el);
  }

  return { canvas: { width: 1920, height: 1080 }, objects, byEl };
}

/**
 * Compact layout digest for the AI — object types, labels and positions in
 * slide units. This is what lets the model reason about LAYOUT ("the body
 * crowds the right half", "there is no image on this slide") instead of
 * only seeing field text.
 */
export function sceneDigest(graph, { max = 18 } = {}) {
  if (!graph?.objects?.length) return "";
  const fmt = (o) =>
    `[${o.id}] ${o.type}${o.ai?.label ? ` "${o.ai.label}"` : ""} at (${Math.round(o.geometry.x)},${Math.round(o.geometry.y)}) ${Math.round(o.geometry.width)}×${Math.round(o.geometry.height)}${o.editable ? "" : " [not editable]"}`;
  return graph.objects
    .filter((o) => o.geometry && o.type !== "group")
    .slice(0, max)
    .map(fmt)
    .join("; ");
}
