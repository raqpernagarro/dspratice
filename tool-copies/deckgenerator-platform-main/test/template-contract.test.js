import test from "node:test";
import assert from "node:assert/strict";
import { validateModule } from "../tools/validate-templates.mjs";
import { allTemplates } from "../js/templates/index.js";
import { KNOWN_SHAPES } from "../product/domain/template-scoring.js";

test("every registered template passes the contract", () => {
  const failures = [];
  for (const t of allTemplates) {
    const errors = validateModule(t, { names: allTemplates.map((x) => x.name) });
    if (errors.length) failures.push(`${t.name}: ${errors.join("; ")}`);
  }
  assert.deepEqual(failures, []);
});

test("a module with an unknown role fails loudly, naming the tables to extend", () => {
  const bad = { ...allTemplates[0], name: "core/fake-test", role: "holographic" };
  const errors = validateModule(bad, { names: [] });
  assert.ok(errors.some((e) => /ROLE_CATEGORY/.test(e) && /ROLE_AFFINITY/.test(e)), errors.join("; "));
});

test("a module missing capacity fails", () => {
  const bad = { ...allTemplates[0], name: "core/fake-test2", capacity: undefined };
  const errors = validateModule(bad, { names: [] });
  assert.ok(errors.some((e) => /capacity/.test(e)));
});

test("an unknown shape fails and KNOWN_SHAPES covers the live library", () => {
  for (const t of allTemplates) assert.ok(KNOWN_SHAPES.has(t.shape), `${t.name} shape "${t.shape}" not in KNOWN_SHAPES`);
  const bad = { ...allTemplates[0], name: "core/fake-test3", shape: "dodecahedron" };
  assert.ok(validateModule(bad, { names: [] }).some((e) => /KNOWN_SHAPES/.test(e)));
});
