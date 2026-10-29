// Regenerates js/templates/index.js from the folder contents. The output is a
// static ES module (the browser imports it directly — no build step), so this
// runs at authoring time and the result is committed.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const DIR = fileURLToPath(new URL("../js/templates/", import.meta.url));
const files = (await readdir(DIR))
  .filter((f) => f.endsWith(".js") && f !== "index.js" && !f.startsWith("_"))
  .sort();

// A filename that doesn't match this shape can't become a valid JS
// identifier (or breaks the family-slug -> "family/slug" name convention),
// so it's skipped with a clear error rather than emitted as a broken import —
// same treatment as a module with no default export, below.
const FILENAME_RE = /^[a-z0-9][a-z0-9-]*\.js$/;

// Import each module to read its declared name/family — the registry is
// ordered by family then name so diffs stay reviewable.
const entries = [];
const usedIdents = new Set();
for (const file of files) {
  if (!FILENAME_RE.test(file)) {
    console.error(`SKIP ${file}: filename must match ${FILENAME_RE} (lowercase, digits, hyphens) — rename the file.`);
    process.exitCode = 1;
    continue;
  }
  let mod;
  try {
    mod = (await import(pathToFileURL(DIR + file))).default;
  } catch (e) {
    // Caught per-file (not left to crash the loop) so one broken module in a
    // batch doesn't hide every OTHER broken module in the same run — all of
    // them get reported together, in one pass.
    console.error(`SKIP ${file}: failed to import — ${e.message}`);
    process.exitCode = 1;
    continue;
  }
  if (!mod?.name) {
    console.error(`SKIP ${file}: no default export with a name — fix the module first.`);
    process.exitCode = 1;
    continue;
  }
  let ident = file.replace(/\.js$/, "").replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  if (usedIdents.has(ident)) {
    let n = 2;
    while (usedIdents.has(`${ident}${n}`)) n++;
    ident = `${ident}${n}`;
  }
  usedIdents.add(ident);
  entries.push({ file, ident, name: mod.name, family: mod.family || "core" });
}
entries.sort((a, b) => a.family.localeCompare(b.family) || a.name.localeCompare(b.name));

const byFamily = new Map();
for (const e of entries) {
  if (!byFamily.has(e.family)) byFamily.set(e.family, []);
  byFamily.get(e.family).push(e);
}

const lines = [];
lines.push("// =============================================================================");
lines.push("// Template registry (v2). GENERATED — do not edit; run npm run templates:index.");
lines.push(`// ${entries.length} modules. See _CONTRACT.md for the module shape.`);
lines.push("// =============================================================================");
lines.push("");
for (const e of entries) lines.push(`import ${e.ident} from "./${e.file}";`);
lines.push("");
lines.push("export const modules = [");
for (const [family, list] of byFamily) {
  lines.push(`  // ---- ${family} (${list.length}) ----`);
  for (const e of list) lines.push(`  ${e.ident},`);
}
lines.push("];");
lines.push("");
lines.push("export const allTemplates = modules;");
lines.push("export const templates = Object.fromEntries(modules.map((m) => [m.name, m]));");
lines.push("");
lines.push("export function getTemplate(name) {");
lines.push("  const t = templates[name];");
lines.push("  if (!t) throw new Error(`Unknown template: \\\"${name}\\\" (${modules.length} registered).`);");
lines.push("  return t;");
lines.push("}");
lines.push("");
lines.push("let installed = false;");
lines.push("export function installTemplateStyles(doc = document) {");
lines.push("  if (installed) return;");
lines.push("  installed = true;");
lines.push("  const style = doc.createElement(\"style\");");
lines.push("  style.id = \"template-styles\";");
lines.push("  style.textContent = modules.map((m) => m.css || \"\").join(\"\\n\\n\");");
lines.push("  doc.head.appendChild(style);");
lines.push("}");
lines.push("");

await writeFile(DIR + "index.js", lines.join("\n"));
console.log(`Wrote js/templates/index.js: ${entries.length} modules, ${byFamily.size} families.`);
