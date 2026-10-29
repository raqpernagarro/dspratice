/**
 * Spec → Figma documentation: writes a plugin snippet that builds each component's documentation
 * panel in its frame on its page (the panel the Button and Icon Button pages have:
 * breadcrumb, title, summary, then Specs, Anatomy, Features, Usage and Accessibility). The content
 * is the spec's — the same text Storybook's SpecDocs renders — so Figma and Storybook can't drift.
 *
 *   npm run ds:figma-docs                → scripts/ds/.out/docs-runtime.js + docs-all.js
 *   npm run ds:figma-docs -- Dialog      → scripts/ds/.out/docs-runtime.js + docs-dialog.js
 *
 * Run docs-runtime.js once per bridge session, then the docs snippet (figma-console `figma_execute`). Each component gets a frame
 * like "01 · Button" (its documentation panel, then the component) on its category page, made from its "❖" section the first
 * time; frames are numbered in catalog order (spec/categories.ts).
 * Re-running replaces the panel (found by shared plugin data), so edit the spec and regenerate rather than editing in Figma.
 * Button and Icon Button keep their hand-made panels.
 */
import { SPECS, variantsOf, type ComponentSpec } from '../../stories/base-ui/spec'
import { CATEGORIES, catalogNumber, categoryOf } from '../../stories/base-ui/spec/categories'
import { pickSpecs, writeSnippet } from './snippet-io'

const HAND_MADE = ['Button', 'Icon Button']

interface Item {
  label?: string
  lines: string[]
  /** Lines shown as a bulleted list. */
  bullets?: boolean
  link?: string
}
interface Section {
  heading: string
  items?: Item[]
  tags?: string[]
}
export interface DocPanel {
  name: string
  /** Its frame's number, in catalog order: "03 · Toggle". */
  number: string
  /** The category page it sits on. */
  category: string
  breadcrumb: string
  summary: string
  sections: Section[]
}

const list = (xs: string[]) => xs.join(', ').replace(/, ([^,]*)$/, ' and $1')
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function specsSection(spec: ComponentSpec): Section {
  const items: Item[] = []
  const count = variantsOf(spec).length
  items.push(
    spec.axes.length
      ? { label: `${count} variant${count === 1 ? '' : 's'}`, lines: spec.axes.map((a) => `${a.figma}: ${list(a.values.map((v) => v.figma))}`) }
      : { label: 'Single component', lines: ['No variant properties: one component, configured through its properties.'] },
  )
  const props = spec.figmaProps ?? []
  if (props.length) {
    const kind = { slot: 'slot', boolean: 'boolean', text: 'text', expose: 'nested instance' } as const
    items.push({
      label: 'Figma properties',
      bullets: true,
      lines: props.map((p) => {
        const extra = p.kind === 'slot' && p.preferred?.length ? `, suggests ${list(p.preferred)}` : p.kind === 'boolean' ? `, ${p.default ? 'on' : 'off'} by default` : ''
        return `${p.name}: ${kind[p.kind]}${extra}`
      }),
    })
  }
  const overrides = new Set(spec.bindings.flatMap((b) => (b.override ? [b.override.id] : [])))
  items.push({
    label: 'Tokens',
    lines: [
      'Every color, size, spacing, radius, border, shadow and text style is bound to a semantic variable, so brands and Light / Dark apply on their own.',
      overrides.size
        ? `${overrides.size} ${overrides.size === 1 ? 'property' : 'properties'} can be overridden for this component alone (${spec.slug}/… tokens, set in the DS Configurator).`
        : 'Nothing is overridden per component: it follows the semantic tokens.',
    ],
  })
  const parts = spec.parts.flatMap((p) => (p.baseUi ? [p.baseUi] : []))
  items.push({
    label: 'Built on Base UI',
    lines: [
      parts.length ? `${list([...new Set(parts)])}. Behavior, keyboard and ARIA come from Base UI; this design system styles it.` : 'Styled with the design system; no Base UI part of its own.',
    ],
    link: spec.docs.baseUi,
  })
  return { heading: 'Specs', items }
}

function anatomySection(spec: ComponentSpec): Section {
  // One entry per Figma layer: the layer's name ('' is the component itself), the Base UI parts it
  // stands for and what they do. Code-only parts (no layer) use their id. Parts that share a layer
  // (an animating panel and the padded content inside it are one frame in Figma) merge.
  const entries = new Map<string, { name: string; path: string[]; baseUi: string[]; text: string[] }>()
  for (const p of spec.parts) {
    const layer = [p.figma].flat()[0]
    const key = layer ?? `code:${p.id}`
    const path = layer === '' ? [spec.name] : (layer ?? p.id).split(' › ').map((n) => sentence(n.replace(/-/g, ' ')))
    const e = entries.get(key) ?? entries.set(key, { name: path[path.length - 1], path, baseUi: [], text: [] }).get(key)!
    if (p.baseUi && !e.baseUi.includes(p.baseUi)) e.baseUi.push(p.baseUi)
    if (p.description) e.text.push(p.description)
  }
  // Different layers with the same name (decrement › icon, increment › icon): add the parent.
  const all = [...entries.values()]
  const names = all.map((e) => e.name)
  for (const e of all) if (e.path.length > 1 && names.filter((n) => n === e.name).length > 1) e.name = e.path.slice(-2).join(' › ')
  return {
    heading: 'Anatomy',
    items: all.map((e) => ({ label: e.baseUi.length ? `${e.name} · ${e.baseUi.join(' + ')}` : e.name, lines: [e.text.join(' ')] })),
  }
}

function features(spec: ComponentSpec): string[] {
  const props = spec.figmaProps ?? []
  const has = (property: string) => spec.bindings.some((b) => b.property === property)
  return [
    'Variable System',
    'Auto Layout',
    'Light / Dark',
    has('text-style') ? 'Text Styles' : null,
    props.some((p) => p.kind === 'slot') ? 'Slots' : null,
    props.some((p) => p.kind === 'boolean' || p.kind === 'text') ? 'Properties' : null,
    spec.parts.some((p) => p.instanceOf) || props.some((p) => p.kind === 'expose') ? 'Nested Instances' : null,
    spec.parts.some((p) => /icon|caret/.test(p.id)) ? 'Icons' : null,
    spec.bindings.some((b) => b.override) ? 'Configurable' : null,
    'Base UI',
  ].filter((x): x is string => Boolean(x))
}

export function docPanel(spec: ComponentSpec): DocPanel {
  const { docs } = spec
  const usage: Item[] = []
  if (docs.usage?.length) usage.push({ label: 'Do', lines: docs.usage, bullets: true })
  if (docs.dont?.length) usage.push({ label: 'Don’t', lines: docs.dont, bullets: true })
  const sections: Section[] = [specsSection(spec), anatomySection(spec), { heading: 'Features', tags: features(spec) }]
  if (usage.length) sections.push({ heading: 'Usage', items: usage })
  if (docs.accessibility?.length) sections.push({ heading: 'Accessibility', items: [{ lines: docs.accessibility, bullets: true }] })
  const category = categoryOf(spec.name)
  return { name: spec.name, number: catalogNumber(spec.name), category, breadcrumb: ['Components', category, spec.name].join('  /  '), summary: docs.summary, sections }
}

/** Runs in the plugin: builds (or rebuilds) the panels, placing each left of its component's section. */
const BUILD = /* js */ `globalThis.__dsDocs = async function (DOCS) {
const CATEGORIES = ${JSON.stringify(Object.keys(CATEGORIES))};
await figma.loadAllPagesAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const semantic = cols.find((c) => c.name === 'semantic')?.id;
const V = (name) => {
  const v = vars.find((x) => x.name === name && x.variableCollectionId === semantic) ?? vars.find((x) => x.name === name);
  if (!v) throw new Error('No variable ' + name);
  return v;
};
const styles = new Map((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]));
for (const n of ['Body/MD', 'Body/MD Strong', 'Heading/MD']) {
  if (!styles.has(n)) throw new Error('No text style ' + n);
  await figma.loadFontAsync(styles.get(n).fontName);
}
const paint = (name) => [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V(name))];
const pending = [];
const links = [];
const text = (name, chars, style, color) => {
  const t = figma.createText();
  t.name = name;
  t.fontName = styles.get(style).fontName;
  t.characters = chars;
  t.fills = paint(color);
  pending.push(t.setTextStyleIdAsync(styles.get(style).id));
  return t;
};
const frame = (name, dir, gap, pad = [0, 0, 0, 0]) => {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = dir;
  f.itemSpacing = gap;
  [f.paddingTop, f.paddingRight, f.paddingBottom, f.paddingLeft] = pad;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [];
  f.clipsContent = false;
  return f;
};
// Appends and stretches to the parent's width (texts wrap there).
const add = (parent, child, fill = true) => {
  parent.appendChild(child);
  if (fill) child.layoutSizingHorizontal = 'FILL';
  if (child.type === 'TEXT') child.textAutoResize = fill ? 'HEIGHT' : 'WIDTH_AND_HEIGHT';
  return child;
};

// Like the Button panel's: the label between two bars, then a rule to the end of the row.
function heading(parent, label) {
  const row = add(parent, frame('Section heading', 'HORIZONTAL', 10));
  row.counterAxisAlignItems = 'CENTER';
  const chip = add(row, frame('Chip', 'HORIZONTAL', 0, [3, 8, 3, 8]), false);
  chip.strokes = paint('color/border/interactive/hover');
  chip.strokeAlign = 'INSIDE';
  chip.strokeTopWeight = 0;
  chip.strokeBottomWeight = 0;
  chip.strokeLeftWeight = 1;
  chip.strokeRightWeight = 1;
  add(chip, text('Heading', label.toUpperCase(), 'Body/MD Strong', 'color/foreground/neutral/primary'), false);
  const rule = figma.createRectangle();
  rule.name = 'Rule';
  rule.resize(10, 1);
  rule.fills = paint('color/border/neutral/regular');
  row.appendChild(rule);
  rule.layoutSizingHorizontal = 'FILL';
}

// The category page (pages are in catalog order, after the foundations pages).
function categoryPage(name) {
  let page = figma.root.children.find((p) => p.name === name);
  if (page) return page;
  page = figma.createPage();
  page.name = name;
  const order = CATEGORIES.indexOf(name);
  const after = figma.root.children.filter((p) => CATEGORIES.indexOf(p.name) >= 0 && CATEGORIES.indexOf(p.name) < order).pop();
  figma.root.insertChild(after ? figma.root.children.indexOf(after) + 1 : figma.root.children.length, page);
  return page;
}

// The component's frame, like "01 · Button": documentation on the left, the component on the
// right, on its category page. Made the first time from the component's "❖" section (a newly
// built component's page is removed once empty).
function frameFor(comp, doc) {
  let box = comp.parent;
  const page = categoryPage(doc.category);
  if (!(box.type === 'FRAME' && box.getSharedPluginData('ds_docs', 'frame') === doc.name)) {
    const section = box.type === 'SECTION' ? box : null;
    let from = comp;
    while (from.type !== 'PAGE') from = from.parent;
    box = frame(doc.name, 'HORIZONTAL', 24, [48, 48, 48, 48]);
    box.fills = paint('color/background/neutral/tertiary');
    box.cornerRadius = 24;
    box.setSharedPluginData('ds_docs', 'frame', doc.name);
    box.appendChild(comp);
    if (section && !section.children.length) section.remove();
    if (from !== page && !from.children.length && !CATEGORIES.includes(from.name)) {
      if (figma.currentPage === from) figma.currentPage = page;
      from.remove();
    }
  }
  box.name = doc.number + ' · ' + doc.name;
  if (box.parent !== page) page.appendChild(box);
  return box;
}

// A category page's frames in catalog order, in rows about 6000 wide, tops aligned per row.
function arrange(page) {
  const boxes = page.children.filter((n) => n.getSharedPluginData('ds_docs', 'frame')).sort((a, b) => a.name.localeCompare(b.name));
  let x = 0, y = 0, rowH = 0;
  for (const b of boxes) {
    if (x > 0 && x + b.width > 6000) { x = 0; y += rowH + 200; rowH = 0; }
    b.x = x; b.y = y;
    x += b.width + 100;
    rowH = Math.max(rowH, b.height);
  }
  // The layers panel lists the last child first: 01 on top.
  for (const b of [...boxes].reverse()) page.appendChild(b);
}

function panel(doc) {
  const outer = frame('Documentation', 'VERTICAL', 0);
  outer.resize(516, 100);
  outer.primaryAxisSizingMode = 'AUTO';
  outer.counterAxisSizingMode = 'FIXED';
  const p = add(outer, frame(doc.name + ' panel', 'VERTICAL', 36, [32, 32, 32, 32]));
  p.fills = paint('color/background/neutral/primary');
  p.strokes = paint('color/border/neutral/regular');
  p.strokeWeight = 1;
  p.strokeAlign = 'INSIDE';
  add(p, text('Breadcrumb', doc.breadcrumb, 'Body/MD', 'color/foreground/neutral/secondary'));
  const intro = add(p, frame('Intro', 'VERTICAL', 12));
  add(intro, text('Title', doc.name, 'Heading/MD', 'color/foreground/neutral/primary'));
  add(intro, text('Summary', doc.summary, 'Body/MD', 'color/foreground/neutral/secondary'));
  for (const s of doc.sections) {
    const sec = add(p, frame(s.heading, 'VERTICAL', s.tags ? 20 : 24));
    heading(sec, s.heading);
    if (s.tags) {
      const tags = add(sec, frame('Feature tags', 'HORIZONTAL', 8));
      tags.layoutWrap = 'WRAP';
      tags.counterAxisSpacing = 8;
      for (const tag of s.tags) {
        const chip = add(tags, frame('Feature', 'HORIZONTAL', 0, [4, 8, 4, 8]), false);
        chip.strokes = paint('color/border/neutral/regular');
        chip.strokeWeight = 1;
        chip.strokeAlign = 'INSIDE';
        chip.cornerRadius = 24;
        add(chip, text('Label', tag, 'Body/MD Strong', 'color/foreground/neutral/primary'), false);
      }
      continue;
    }
    const items = add(sec, frame('Specifications', 'VERTICAL', 16));
    for (const it of s.items) {
      const spec = add(items, frame('Specification', 'VERTICAL', 4));
      if (it.label) add(spec, text('Label', it.label, 'Body/MD Strong', 'color/foreground/neutral/primary'));
      const d = add(spec, text('Description', it.lines.join('\\n'), 'Body/MD', 'color/foreground/neutral/secondary'));
      if (it.bullets) d.setRangeListOptions(0, d.characters.length, { type: 'UNORDERED' });
      if (it.link) {
        const l = add(spec, text('Link', it.link.replace(/^https:\\/\\//, ''), 'Body/MD', 'color/foreground/interactive/default'));
        l.hyperlink = { type: 'URL', value: it.link };
        links.push(l);
      }
    }
  }
  return outer;
}

const roots = figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] }).filter((n) => n.parent?.type !== 'COMPONENT_SET');
const report = [];
const touched = new Set();
for (const doc of DOCS) {
  const comp = roots.find((r) => r.name === doc.name);
  if (!comp) { report.push(doc.name + ': not found'); continue; }
  const box = frameFor(comp, doc);
  for (const old of [...box.parent.children, ...box.children].filter((n) => n.getSharedPluginData('ds_docs', 'component') === doc.name)) old.remove();
  const outer = panel(doc);
  outer.setSharedPluginData('ds_docs', 'component', doc.name);
  box.insertChild(0, outer);
  touched.add(box.parent);
  report.push(doc.name);
}
await Promise.all(pending);
// After the text styles: applying a style resets the decoration.
for (const l of links) l.textDecoration = 'UNDERLINE';
for (const page of touched) arrange(page);
return report;
};
return 'docs builder installed';
`

const args = process.argv.slice(2)
const specs = pickSpecs(SPECS, args).filter((s) => !HAND_MADE.includes(s.name))
writeSnippet('docs-runtime', `// Generated by scripts/ds/figma-docs.ts — installs the panel builder (once per bridge session).\n${BUILD}`)
// Batches of 8 panels, so each run stays well inside figma_execute's time limit.
const name = specs.length === 1 ? specs[0].slug : args.filter((a) => !a.startsWith('--')).length ? 'some' : 'all'
for (let i = 0; i < specs.length; i += 8) {
  const batch = specs.slice(i, i + 8)
  writeSnippet(
    specs.length > 8 ? `docs-${name}-${i / 8 + 1}` : `docs-${name}`,
    `// Generated by scripts/ds/figma-docs.ts — builds documentation panels: ${batch.map((s) => s.name).join(', ')} (run docs-runtime.js first).\nreturn await globalThis.__dsDocs(${JSON.stringify(batch.map(docPanel))});\n`,
  )
}
