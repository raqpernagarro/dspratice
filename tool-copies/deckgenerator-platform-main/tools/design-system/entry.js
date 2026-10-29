// Bundle entry for the design system: the real template engine as one global, window.NagarroSlides.
// Built by build.mjs with esbuild (IIFE). Paths are relative to this file.
import { allTemplates, getTemplate } from "../../js/templates/index.js";
import { esc, SectionHeader, Logo, Footer, DEFAULT_FOOTER, Chrome } from "../../js/components.js";
import { topBar, footerBar, pageHeader, frame } from "../../js/frame.js";
import { ICONS, ICON_ALIASES, icon } from "../../js/icons.js";
import { metric, metricCard } from "../../js/metric-blocks.js";
import { NAGARRO_LOGO } from "../../js/logo.js";
import { ROLE_CATEGORY } from "./.build/role-category.js";

const VERSION = "2026.10.13";
const FALLBACK_CATEGORY = "Other";
const CATEGORY_ORDER = ["Covers & Title","Chapters & Index","Statements & Quotes","Content","Cards","Charts & Diagrams","Comparison Tables","Timelines & Roadmaps","Results & Impact","Services & Capabilities","Team & CV","Logos & Clients","Photo & Gallery","Case Studies","Closing"];
const list = (typeof allTemplates === "function" ? allTemplates() : allTemplates);
const categoryOf = (t) => ROLE_CATEGORY[String(t.role || "").toLowerCase()] || FALLBACK_CATEGORY;

const cfg = { assetBase: "../../media/" };
const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));

/** Point every site-relative asset path ("assets/…") at the published media folder. */
function rewriteAssets(html) {
  const fix = (p) => cfg.assetBase + encodeURI(decodeURI(p.replace(/^\//, "")));
  return html
    .replace(/(src=["'])(\/?assets\/[^"']+)/g, (_, a, p) => a + fix(p))
    .replace(/(url\((?:&quot;|["'])?)(\/?assets\/[^"')&]+)/g, (_, a, p) => a + fix(p));
}

/** Template metadata, no render function. */
function info(t) {
  return { name: t.name, family: t.family, role: t.role, category: categoryOf(t), shape: t.shape, theme: t.theme || "light",
    media: t.media || [], capacity: t.capacity, slots: t.slots, description: t.description, use: t.use, intent: t.intent,
    schema: t.schema, example: clone(t.example) };
}

/**
 * Render one slide as an HTML string: a 1920×1080 <section class="ns-stage">.
 * content: fields per the template's schema (missing fields fall back to the template's example).
 * opts: { theme, meta, footer, useExample (default true) }
 */
function render(name, content, opts = {}) {
  const t = getTemplate(name);
  const base = opts.useExample === false ? {} : clone(t.example) || {};
  const s = Object.assign(base, content || {});
  if (opts.meta) s.meta = Object.assign({}, s.meta, opts.meta);
  if (opts.footer) s.footer = Object.assign({}, s.footer, opts.footer);
  const theme = opts.theme || s.theme || t.theme || "light";
  const useChrome = s.chrome ?? t.chrome ?? true;
  const inner = t.render(s, { deck: opts.deck || {}, esc }) + (useChrome ? Chrome(s, opts.deck || {}) : "");
  return '<section class="ns-stage" data-theme="' + theme + '" data-template="' + esc(t.name) + '">' + rewriteAssets(inner) + "</section>";
}

/** Render a list of { template, ...content } slides. Deck-level meta/footer apply to every slide. */
function renderDeck(slides, deck = {}) {
  const total = slides.length;
  return slides.map((sl, i) => {
    const { template, theme, ...content } = sl;
    const meta = Object.assign({ studio: deck.studio, name: deck.title, page: String(i + 1).padStart(2, "0") }, deck.meta, content.meta);
    Object.keys(meta).forEach((k) => meta[k] == null && delete meta[k]);
    const footer = Object.assign({}, deck.footer, content.footer);
    return render(template, content, { theme, meta, footer, deck });
  });
}

/** Mount a slide into an element, scaled to the element's width (or opts.width px). Returns the stage element. */
function mount(el, name, content, opts = {}) {
  const w = opts.width || el.clientWidth || 480;
  const scale = w / 1920;
  el.classList.add("ns-viewport");
  el.style.width = w + "px"; el.style.height = Math.round(1080 * scale) + "px";
  el.innerHTML = '<div class="ns-scaler" style="transform:scale(' + scale + ')">' + render(name, content, opts) + "</div>";
  return el.firstElementChild.firstElementChild;
}

/** Thumbnail helper: an HTML string of a scaled slide of width w. */
function thumb(name, content, opts = {}) {
  const w = opts.width || 320, scale = w / 1920;
  return '<div class="ns-viewport" style="width:' + w + "px;height:" + Math.round(1080 * scale) + 'px"><div class="ns-scaler" style="transform:scale(' + scale + ')">' + render(name, content, opts) + "</div></div>";
}

const templates = list.map(info);
const byCategory = () => {
  const m = {}; for (const t of templates) (m[t.category] ||= []).push(t);
  return CATEGORY_ORDER.filter((c) => m[c]).map((c) => ({ category: c, templates: m[c] }))
    .concat(Object.keys(m).filter((c) => !CATEGORY_ORDER.includes(c)).map((c) => ({ category: c, templates: m[c] })));
};

window.NagarroSlides = {
  version: VERSION,
  config(o = {}) { Object.assign(cfg, o); return { ...cfg }; },
  templates, categories: CATEGORY_ORDER, roleCategory: ROLE_CATEGORY, byCategory,
  get: (name) => templates.find((t) => t.name === name) || null,
  find(q = {}) { return templates.filter((t) => Object.entries(q).every(([k, v]) => Array.isArray(v) ? v.includes(t[k]) : t[k] === v)); },
  render, renderDeck, mount, thumb, esc,
  blocks: { topBar, footerBar, pageHeader, frame, SectionHeader, Logo, Footer, DEFAULT_FOOTER, metric, metricCard,
    logo: () => NAGARRO_LOGO },
  // Icon names as Figma spells them (Nagarro-Icons). The old code keys still resolve.
  icon, iconAliases: ICON_ALIASES,
  iconNames: (() => { const fig = Object.fromEntries(Object.entries(ICON_ALIASES).map(([f, k]) => [k, f])); return Object.keys(ICONS).map((k) => fig[k] || k).sort(); })(),
};
