#!/usr/bin/env node
// tools/repair-decks.mjs
// =============================================================================
// Repairs decks already written by a bug that has since been fixed.
//
// Fixing a pipeline does not repair the data it already produced. One stored
// slide holds a string in `notes`, a field planning/grid-15 declares as a list
// and renders with .map() — so it throws, does not mount, and is blank in the
// editor and blank in the export. The pipeline stopped producing that months
// ago; the slide is still broken.
//
// Only removes values whose TYPE the template cannot render, so the slide falls
// back to the template's own example for that field and mounts again. It never
// rewrites wording, and it never touches a field the layout can handle.
//
// Dry by default, because this edits the user's own decks:
//   node tools/repair-decks.mjs            # say what would change
//   node tools/repair-decks.mjs --apply    # change it, after a backup
// =============================================================================
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { allTemplates } from "../js/templates/index.js";

const APPLY = process.argv.includes("--apply");
const dataArg = process.argv.indexOf("--data");
const DATA = dataArg !== -1 && process.argv[dataArg + 1]
  ? resolve(process.argv[dataArg + 1])
  : fileURLToPath(new URL("../product/data/presentations.json", import.meta.url));

if (!existsSync(DATA)) {
  console.error(`No deck data at ${DATA}.`);
  process.exit(1);
}

const byName = new Map(allTemplates.map((t) => [t.name, t]));
const decks = JSON.parse(readFileSync(DATA, "utf8"));
const shapeOf = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);

const repairs = [];
for (const deck of decks) {
  for (const slide of deck.slides || []) {
    const template = byName.get(slide.templateReference?.templateName);
    if (!template?.example) continue;
    for (const [key, shown] of Object.entries(template.example)) {
      if (key === "meta" || key === "footer") continue;
      if (!(key in (slide.content || {}))) continue;
      const want = shapeOf(shown);
      const got = shapeOf(slide.content[key]);
      if (want === "object" || got === "undefined" || want === got) continue;
      repairs.push({
        deck: deck.title || deck.id, slide: (slide.order ?? 0) + 1,
        template: template.name, key, want, got,
        apply: () => { delete slide.content[key]; },
      });
    }
  }
}

if (!repairs.length) {
  console.log("Nothing to repair.");
  process.exit(0);
}

console.log(`${repairs.length} field(s) hold a value their layout cannot render:\n`);
for (const r of repairs) {
  console.log(`  ${String(r.deck).slice(0, 34).padEnd(36)} s${String(r.slide).padStart(2)}  ` +
              `${r.template} · ${r.key} is a ${r.got}, wants a ${r.want}`);
}

if (!APPLY) {
  console.log(`\nDry run. Re-run with --apply to remove them and fall back to the template's own value.`);
  process.exit(0);
}

const backup = `${DATA}.repair-backup`;
copyFileSync(DATA, backup);
for (const r of repairs) r.apply();
writeFileSync(DATA, JSON.stringify(decks, null, 2) + "\n");
console.log(`\nRepaired ${repairs.length} field(s). Previous file kept at ${backup}.`);
