// Per-module contract validation. Run via npm run templates:check.
// Exports validateModule for the test suite.
import { allTemplates } from "../js/templates/index.js";
import { ROLE_AFFINITY, KNOWN_SHAPES } from "../product/domain/template-scoring.js";
import { ROLE_CATEGORY } from "../product/domain/template-service.js";
import darkSafe from "../js/dark-safe.json" with { type: "json" };

const KNOWN_ROLES_CATEGORY = new Set(Object.keys(ROLE_CATEGORY));
const KNOWN_ROLES_AFFINITY = new Set(Object.values(ROLE_AFFINITY).flat());
const SLOT_KEYS = new Set(["images", "titles", "subtitles", "body", "stats", "icons", "list"]);

/** "cover", "closing" and "contact" are legitimately absent from ROLE_AFFINITY:
 *  scoreTemplate() (template-scoring.js ~L177-186) picks them by deck POSITION
 *  (first/last slide), not by content-shape affinity, so they were never meant
 *  to appear in that table. Confirmed against the live library: core/cover-single,
 *  core/closing-single, finance/cover, main/cover-01, main/cover-02,
 *  portfolio/cover, portfolio/grid-02 (cover), portfolio/grid-24 (contact),
 *  portfolio/text-16 (closing) all fail the naive "must be in both tables"
 *  check — every one is intentional, not a gap to fix. They still must be in
 *  ROLE_CATEGORY so the Templates page can group them. */
const POSITIONAL_ROLES = new Set(["cover", "closing", "contact"]);

/** Families whose every template must carry an intent card. Grows as each
 *  category is built or backfilled; see _CONTRACT.md "intent". */
export const REQUIRE_INTENT = new Set(["case-study", "pitch"]);
export const INTENT_FEELS = new Set(["dense", "airy", "visual", "data", "statement"]);

/** Checks an intent card's shape. Returns error strings. */
export function intentErrors(intent) {
  const out = [];
  const strings = (v) => Array.isArray(v) && v.every((x) => typeof x === "string" && x.trim());
  if (!intent || typeof intent !== "object") return ["intent must be an object"];
  if (!strings(intent.bestFor) || !intent.bestFor.length) out.push("intent.bestFor must be a non-empty array of strings");
  if (typeof intent.holds !== "string" || !intent.holds.trim()) out.push("intent.holds must be a non-empty string");
  if (!strings(intent.avoid) || !intent.avoid.length) out.push("intent.avoid must be a non-empty array of strings");
  if (!INTENT_FEELS.has(intent.feel)) out.push(`intent.feel must be one of ${[...INTENT_FEELS].join(", ")}`);
  if (!strings(intent.needs)) out.push("intent.needs must be an array of strings ([] when nothing is needed)");
  if (intent.itemChars !== undefined && !(Number.isInteger(intent.itemChars) && intent.itemChars > 0)) {
    out.push("intent.itemChars must be a positive integer when present");
  }
  return out;
}

export function validateModule(mod, { names = [] } = {}) {
  const errors = [];
  const err = (m) => errors.push(m);

  if (typeof mod?.name !== "string" || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(mod.name)) {
    err(`name must be "family/slug" (got ${JSON.stringify(mod?.name)})`);
    return errors; // nothing else is meaningful without a name
  }
  if (typeof mod.family !== "string" || !mod.family) err("family is required");
  else if (!mod.name.startsWith(`${mod.family}/`)) err(`name "${mod.name}" does not match family "${mod.family}"`);
  if (names.filter((n) => n === mod.name).length > 1) err(`duplicate name "${mod.name}"`);

  if (typeof mod.role !== "string" || !mod.role) err("role is required");
  else {
    const inCategory = KNOWN_ROLES_CATEGORY.has(mod.role);
    const inAffinity = KNOWN_ROLES_AFFINITY.has(mod.role) || POSITIONAL_ROLES.has(mod.role);
    if (!inCategory || !inAffinity) {
      err(`role "${mod.role}" is unknown to the engine — add it to ` +
        `${inCategory ? "" : "ROLE_CATEGORY (product/domain/template-service.js)"}` +
        `${!inCategory && !inAffinity ? " and " : ""}` +
        `${inAffinity ? "" : "ROLE_AFFINITY (product/domain/template-scoring.js)"}` +
        `, or the template will never be offered/categorized`);
    }
  }

  if (typeof mod.shape !== "string" || !mod.shape) err("shape is required");
  else if (!KNOWN_SHAPES.has(mod.shape)) {
    err(`shape "${mod.shape}" is not in KNOWN_SHAPES (product/domain/template-scoring.js) — add it there (and to SHAPE_AFFINITY if it should score)`);
  }

  // `media` is a list of media-type tags (e.g. ["photo"]), not a single string —
  // verified against all 229 live templates (js/templates/*.js), every one of
  // which declares `media: []` or `media: ["photo"]` etc. The brief's original
  // rule (`typeof mod.media !== "string"`) would fail every template in the
  // library, which is the signal that the rule's premise was wrong, not the
  // templates.
  if (!Array.isArray(mod.media) || mod.media.some((m) => typeof m !== "string")) {
    err("media must be an array of strings (may be empty)");
  }
  const cap = mod.capacity;
  if (!cap || typeof cap !== "object") err("capacity {items,min,max} is required");
  else {
    for (const k of ["items", "min", "max"]) {
      if (!Number.isInteger(cap[k]) || cap[k] < 0) err(`capacity.${k} must be a non-negative integer`);
    }
    if (Number.isInteger(cap.min) && Number.isInteger(cap.items) && Number.isInteger(cap.max) &&
        !(cap.min <= cap.items && cap.items <= cap.max)) {
      err(`capacity must satisfy min <= items <= max (got ${cap.min}/${cap.items}/${cap.max})`);
    }
  }
  if (!mod.slots || typeof mod.slots !== "object") err("slots object is required");
  else {
    for (const k of Object.keys(mod.slots)) {
      if (!SLOT_KEYS.has(k)) err(`slots.${k} is not a known slot (${[...SLOT_KEYS].join(", ")})`);
      else if (!Number.isInteger(mod.slots[k]) || mod.slots[k] < 0) err(`slots.${k} must be a non-negative integer`);
    }
  }

  if (typeof mod.theme !== "string") err("theme is required");
  if (typeof mod.description !== "string" || !mod.description.trim()) err("description is required");
  if (typeof mod.use !== "string" || !mod.use.trim()) err("use is required");
  if (!mod.schema || typeof mod.schema !== "object" || !Object.keys(mod.schema).length) err("non-empty schema is required");
  if (!mod.example || typeof mod.example !== "object" || !Object.keys(mod.example).length) err("non-empty example is required");
  if (typeof mod.render !== "function") err("render() function is required");

  if (mod.replacedBy !== undefined) {
    const target = allTemplates.find((t) => t.name === mod.replacedBy);
    if (!target) err(`replacedBy "${mod.replacedBy}" is not a registered template`);
    else if (target.replacedBy) err(`replacedBy "${mod.replacedBy}" is itself retired — point at the live template`);
  } else if (mod.intent !== undefined) for (const e of intentErrors(mod.intent)) err(e);
  else if (REQUIRE_INTENT.has(mod.family)) err(`intent card is required for the ${mod.family} family`);

  return errors;
}

// ---- CLI ----
const isMain = import.meta.url === (await import("node:url")).pathToFileURL(process.argv[1] || "").href;
if (isMain) {
  if (process.argv.includes("--only")) {
    console.error(`--only needs a value — use --only=family/slug-a,family/slug-b (bare --only matches nothing and silently runs every template).`);
    process.exit(1);
  }
  const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
  const pool = only ? allTemplates.filter((t) => only.includes(t.name)) : allTemplates;
  if (only) {
    const found = new Set(pool.map((t) => t.name));
    const unmatched = only.filter((n) => !found.has(n));
    if (unmatched.length) {
      console.error(`--only named template(s) not found in the library: ${unmatched.join(", ")}`);
      process.exit(1);
    }
  }
  const names = pool.map((t) => t.name);
  let failed = 0;
  for (const t of pool) {
    const errors = validateModule(t, { names });
    if (errors.length) {
      failed++;
      console.log(`FAIL  ${t.name}`);
      for (const e of errors) console.log(`      - ${e}`);
    }
  }
  const missing = pool.filter((t) => !darkSafe.safe?.includes(t.name) &&
    !darkSafe.unsafe?.some?.((u) => u.name === t.name)).map((t) => t.name);
  if (missing.length) {
    console.log(`\nWARN: ${missing.length} template(s) not yet dark-audited — run:`);
    console.log(`      node tools/audit-dark-mode.mjs --missing   (studio must be running)`);
  }
  console.log(`\n${pool.length - failed}/${pool.length} templates pass.`);
  if (failed) process.exit(1);
}
