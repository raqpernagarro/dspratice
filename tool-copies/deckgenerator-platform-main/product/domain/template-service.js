// =============================================================================
// Template Service — Milestone M5, Domain Layer (Phase 2.5 §04). Extended M8.
//
// SCOPE NOTE (AUDIT-M5-02, resolved at M8). Phase 2.5 §04 defines four public
// methods: listTemplates, getTemplate, promoteTemplate, refreshRegistryMirror.
// M8 adds getTemplate and search/category filtering to listTemplates —
// exactly what the Templates Gallery's acceptance criteria requires.
// promoteTemplate and refreshRegistryMirror remain unbuilt: promotion needs a
// "design operator" role that was never defined anywhere in the built Role
// system, and Phase 4's M8 acceptance criteria never requires it (approved
// decision A) — an acknowledged spec gap, not invented around.
// refreshRegistryMirror has no purpose without the persisted mirror state
// decision B explicitly declines to build.
//
// Decision B: Phase 2.5 assigns "category" to an unbuilt Template Repository
// (tags/category/promotion status). No Repository is introduced. Category is
// instead computed deterministically, read-only, entirely in this file, from
// each template's own immutable `archetype`/`name` — the engine's registry
// is still never mutated, and nothing is written back to it. The engine's
// own `archetype` field is nearly 1:1 with individual templates (95 unique
// values across 103 templates) and unusable as a real filter grouping on its
// own, so this groups them into the ~16 categories CLAUDE.md already
// documents as the brand library's own representative taxonomy.
// =============================================================================
import { allTemplates } from "../../js/templates/index.js";
import { liveTemplates } from "./live-templates.js";

/** Ordered, most-specific-first — the first matching rule wins. Keyword
 * matching is intentionally fuzzy (substring, case-insensitive over
 * `archetype + name`): this is a browsing convenience, not authoritative
 * engine data, so an occasional debatable placement is acceptable. */
const CATEGORY_RULES = [
  // Notes & Callouts is checked before Charts & Diagrams: "note-header-bar"
  // would otherwise false-positive-match Charts' "bar" keyword (it's a UI
  // header bar, not a chart) — found and fixed during M8's own testing.
  { category: "Notes & Callouts", keywords: ["note"] },
  { category: "Charts & Diagrams", keywords: ["chart", "diagram", "venn", "architecture", "layered", "chain", "bar", "circles"] },
  { category: "Timelines & Roadmaps", keywords: ["timeline", "roadmap", "gantt", "milestone"] },
  { category: "Team & CV", keywords: ["team", "cv-"] },
  { category: "Logo Walls", keywords: ["logo"] },
  { category: "Comparison Tables", keywords: ["table"] },
  { category: "Statements & Quotes", keywords: ["statement", "quote", "testimonial"] },
  // Executive Summaries is checked before Chapters & Index: "section-summary"
  // (the `summary` template's archetype) would otherwise false-positive-match
  // Chapters & Index's "section" keyword and bury an Executive Summary
  // template under the wrong chip — same class of bug as the note-header-bar
  // fix above, found while testing the gallery's category filter.
  { category: "Executive Summaries", keywords: ["summary", "overview"] },
  { category: "Chapters & Index", keywords: ["index", "chapter", "section"] },
  { category: "Stat Grids", keywords: ["stat", "metric", "capabilit", "bubbles", "badge", "feature"] },
  { category: "Full-bleed Photo", keywords: ["photo", "image", "collage", "cobrand"] },
  { category: "Process & Step Flows", keywords: ["process", "flow", "phase", "steps"] },
  { category: "Cards", keywords: ["cards", "column-lists", "mockup", "numbered-grid"] },
  { category: "Covers & Title", keywords: ["title"] },
  { category: "Closing", keywords: ["closing"] },
];
const FALLBACK_CATEGORY = "Other";

/** The v2 template library declares a `role` on every module — a small, closed
 *  vocabulary (content, cards, gallery, chart, quote, …) that is exactly the
 *  grouping a person browsing wants. Mapping it directly is both accurate and
 *  stable, where keyword-sniffing a name is neither: on the v2 library the
 *  keyword rules alone put 131 of 229 templates in "Other", because they were
 *  written against v1's `archetype` field, which v2 does not have. */
export const ROLE_CATEGORY = {
  cover: "Covers & Title",
  toc: "Chapters & Index",
  index: "Chapters & Index",
  divider: "Chapters & Index",
  content: "Content",
  text: "Content",
  brief: "Content",
  detail: "Content",
  cards: "Cards",
  gallery: "Photo & Gallery",
  showcase: "Photo & Gallery",
  chart: "Charts & Diagrams",
  data: "Charts & Diagrams",
  diagram: "Charts & Diagrams",
  quote: "Statements & Quotes",
  statement: "Statements & Quotes",
  stories: "Statements & Quotes",
  press: "Statements & Quotes",
  table: "Comparison Tables",
  timeline: "Timelines & Roadmaps",
  team: "Team & CV",
  cv: "Team & CV",
  skills: "Team & CV",
  services: "Services & Capabilities",
  results: "Results & Impact",
  awards: "Results & Impact",
  logos: "Logos & Clients",
  casestudy: "Case Studies",
  closing: "Closing",
  contact: "Closing",
};

function categorize(t) {
  // Prefer the declared role; fall back to keyword rules for any module that
  // predates it, so both library generations categorise correctly.
  const byRole = ROLE_CATEGORY[String(t.role || "").toLowerCase()];
  if (byRole) return byRole;
  const haystack = `${t.archetype || ""} ${t.name || ""}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) return rule.category;
  }
  return FALLBACK_CATEGORY;
}

function project(t) {
  return {
    name: t.name,
    description: t.description || "",
    archetype: t.archetype || "",
    category: categorize(t),
    // Raw module metadata (family: core/main/portfolio/finance/planning/
    // strategy; role: content/cards/gallery/…) — surfaced for M?'s family
    // facet and richer search on the Templates page, alongside the
    // Service's own computed `category` grouping above.
    family: t.family || "",
    role: t.role || "",
    theme: t.theme || "light",
    // The template's own example content, used to give a newly created
    // slide real content rather than an empty frame — the same thing the
    // engine's own Master Template deck does (js/decks/main-template.js) —
    // and, since M8, the source Template Card previews render from too.
    example: t.example || {},
    // Milestone M9: { field: "human description" } — every template module
    // has always exported this (js/templates/_CONTRACT.md's module shape),
    // just never previously read by the Product Layer. The Editor's labeled
    // content form, and the swap picker's unmapped/carried-field detection,
    // both need it.
    schema: t.schema || {},
  };
}

class TemplateService {
  /**
   * @param {{userId, workspaceId, role}} _context — accepted for signature
   *   consistency with every other Service (Decision K, M4). The template
   *   registry is brand-global, not workspace-scoped, so it is not used to
   *   filter; taking it keeps every Service call shaped identically.
   * @param {{category?: string, search?: string}} [filters] — Phase 2.5 §05's
   *   documented query params for GET /api/templates. Search matches name,
   *   category, and description (Phase 3 §13).
   */
  async listTemplates(_context, { category, search } = {}) {
    // Retired templates (replacedBy) still render for the decks that use them,
    // but are not offered in the gallery.
    let results = liveTemplates.map(project);

    if (category) {
      results = results.filter((t) => t.category === category);
    }
    if (search) {
      const q = search.trim().toLowerCase();
      if (q) {
        results = results.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
        );
      }
    }
    return results;
  }

  /** Phase 2.5 §05: "Template detail + preview ref" — the same projection a
   * list row already carries is sufficient to render the preview; nothing
   * extra is invented for the detail view. Returns null if not found — the
   * route layer maps that to 404. */
  async getTemplate(_context, name) {
    const found = allTemplates.find((t) => t.name === name);
    return found ? project(found) : null;
  }
}

export const templateService = new TemplateService();
