import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

test("the registry is generated and covers every module file", async () => {
  const src = await readFile("js/templates/index.js", "utf8");
  assert.match(src, /GENERATED — do not edit/, "index.js must carry the generated header");
  const files = (await readdir("js/templates")).filter(
    (f) => f.endsWith(".js") && f !== "index.js" && !f.startsWith("_")
  );
  for (const f of files) {
    assert.ok(src.includes(`./${f}`), `module file ${f} is not registered — run npm run templates:index`);
  }
});

test("registry exports keep their contract", async () => {
  const { modules, allTemplates, templates, getTemplate } = await import("../js/templates/index.js");
  assert.ok(Array.isArray(modules) && modules.length > 200);
  assert.equal(allTemplates, modules);
  assert.equal(Object.keys(templates).length, modules.length, "duplicate template names");
  assert.equal(getTemplate(modules[0].name), modules[0]);
  assert.throws(() => getTemplate("nope/nope"), /Unknown template/);
});
