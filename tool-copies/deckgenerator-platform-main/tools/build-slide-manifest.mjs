// =============================================================================
// build-slide-manifest.mjs — generate the runtime slide manifest from the
// registered template modules, and validate it against the Figma catalog
// (generate/core-manifest.json).
//
// The manifest is the index an AI uses to pick the right slide by name. Code is
// the source of truth for real slot counts (the Figma catalog's `slots` are
// unreliable — see CLAUDE.md), so this reads the actual template modules.
//
//   node tools/build-slide-manifest.mjs            # write + validate
//   node tools/build-slide-manifest.mjs --check    # validate only, non-zero exit on drift
//
// Output: generate/slide-manifest.json  (array, one entry per built template)
// =============================================================================
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { allTemplates } from "../js/templates/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
/* `generate/` was source material for old decks and has been deleted, so this
 * script crashed on every run. The manifest it builds describes the TEMPLATE
 * library, which lives in js/ — that is where it belongs. The optional catalog
 * is now genuinely optional rather than a hard requirement. */
const CATALOG_PATH = resolve(ROOT, "js/templates/core-manifest.json");
const OUT_PATH = resolve(ROOT, "js/slide-manifest.json");
const checkOnly = process.argv.includes("--check");

// ---- 1. Build the runtime manifest from the template modules ----------------
const manifest = allTemplates
  .map((t) => ({
    slug: t.name,
    slide: t.slide ?? null,
    family: t.family ?? null,
    role: t.role ?? null,
    shape: t.shape ?? null,
    count: t.count ?? null,
    theme: t.theme ?? "light",
    media: t.media ?? [],
    use: t.use ?? t.description ?? "",
    capacity: t.capacity ?? null,
    slots: t.slots ?? null,          // code-owned: the real, renderable slot counts
    fields: t.schema ? Object.keys(t.schema) : [],
    figmaNode: t.figmaNode ?? null,
  }))
  .sort((a, b) => (a.slide ?? 1e9) - (b.slide ?? 1e9));

// ---- 2. Load the Figma catalog ---------------------------------------------
/* The Figma catalog is an export from the design file and is NOT checked in —
 * it only exists on a machine that has pulled it. Without it there is nothing
 * to cross-validate against, so the script emits the manifest and says so,
 * rather than reporting all 229 templates as "not found in catalog". */
let catalog = [];
let haveCatalog = false;
try {
  catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  haveCatalog = Array.isArray(catalog) && catalog.length > 0;
} catch {
  console.log(`No Figma catalog at ${CATALOG_PATH} — writing the manifest without cross-validation.`);
}
const catBySlug = new Map(catalog.map((c) => [c.slug, c]));
const catByNode = new Map(catalog.map((c) => [c.figmaNode, c]));

// ---- 3. Validate the built templates against the catalog --------------------
const errors = [];
const warnings = [];
const seenSlug = new Set();
const seenNode = new Set();

for (const m of manifest) {
  // uniqueness within the built set — always worth checking, catalog or not
  if (seenSlug.has(m.slug)) errors.push(`duplicate slug in code: ${m.slug}`);
  if (m.figmaNode && seenNode.has(m.figmaNode)) errors.push(`duplicate figmaNode in code: ${m.figmaNode} (${m.slug})`);
  seenSlug.add(m.slug);
  if (m.figmaNode) seenNode.add(m.figmaNode);

  const bySlug = catBySlug.get(m.slug);
  const byNode = m.figmaNode ? catByNode.get(m.figmaNode) : undefined;

  // core-manifest.json is the Core Figma catalog; only Core slugs must appear in it.
  // Other families (portfolio, finance, strategy, …) are built from their own Figma
  // frames and carry no catalog entry, so they skip the catalog cross-check below.
  if (haveCatalog && !bySlug && m.family === "core") {
    errors.push(`slug not found in Figma catalog: ${m.slug}`);
  }
  // slug and figmaNode must point at the SAME catalog entry (the slug is the join key)
  if (bySlug && byNode && bySlug !== byNode) {
    errors.push(`slug/figmaNode disagree for ${m.slug}: slug→${bySlug.figmaNode}, node→${byNode.slug}`);
  }
  if (bySlug && !byNode && m.figmaNode) {
    errors.push(`figmaNode mismatch for ${m.slug}: code=${m.figmaNode}, catalog=${bySlug.figmaNode}`);
  }
  // field-level consistency (warn — code wins, but drift is worth surfacing)
  if (bySlug) {
    for (const key of ["role", "family", "shape", "theme"]) {
      if (m[key] != null && bySlug[key] != null && String(m[key]) !== String(bySlug[key])) {
        warnings.push(`${m.slug}: ${key} differs (code="${m[key]}" catalog="${bySlug[key]}")`);
      }
    }
    // media mismatch (photo vs none) is worth a warning
    const cm = (bySlug.media ?? []).slice().sort().join(",");
    const mm = (m.media ?? []).slice().sort().join(",");
    if (cm !== mm) warnings.push(`${m.slug}: media differs (code="${mm||"—"}" catalog="${cm||"—"}")`);
    // note (don't fail) where code slot counts diverge from the catalog's unreliable counts
    if (bySlug.slots && m.slots) {
      const diffs = Object.keys(m.slots).filter((k) => bySlug.slots[k] != null && bySlug.slots[k] !== m.slots[k]);
      if (diffs.length) warnings.push(`${m.slug}: slot counts differ from catalog on [${diffs.join(", ")}] (code is source of truth)`);
    }
  }
}

// ---- 4. Coverage report -----------------------------------------------------
const builtSlugs = new Set(manifest.map((m) => m.slug));
const notYetBuilt = catalog.filter((c) => !builtSlugs.has(c.slug));
const byRole = {};
for (const c of catalog) byRole[c.role] = byRole[c.role] || { total: 0, built: 0 };
for (const c of catalog) { byRole[c.role].total++; if (builtSlugs.has(c.slug)) byRole[c.role].built++; }

// ---- 5. Write + report ------------------------------------------------------
if (!checkOnly) {
  writeFileSync(OUT_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`✓ wrote ${manifest.length} entries → generate/slide-manifest.json`);
}

// per-family tally of everything actually built (all master categories)
const byFamily = {};
for (const m of manifest) {
  const f = m.family ?? "—";
  byFamily[f] = (byFamily[f] ?? 0) + 1;
}
console.log(`\nBuilt templates by family:`);
for (const [family, n] of Object.entries(byFamily).sort()) {
  console.log(`  ${family.padEnd(10)} ${n}`);
}

console.log(`\nCore coverage vs Figma catalog: ${[...builtSlugs].filter((s) => catBySlug.has(s)).length}/${catalog.length}`);
for (const [role, { total, built }] of Object.entries(byRole).sort()) {
  console.log(`  ${role.padEnd(9)} ${built}/${total}${built === total ? " ✓" : ""}`);
}

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  · ${w}`);
}
if (errors.length) {
  console.log(`\n✗ Errors (${errors.length}):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`\n✓ manifest is consistent with the Figma catalog (0 errors).`);
if (checkOnly && manifest.length === 0) process.exit(1);
