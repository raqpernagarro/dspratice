// test/pptx-import-parse.test.js
// =============================================================================
// The parser's job goes beyond title+bullets: an imported slide's pictures,
// tables and grouped shapes must survive, and each mapped slide needs an
// element inventory the later approve/compose step can act on.
//
// importPptx writes a real Generation record (generationRepository) and
// stores images (storeImportedImage) — both resolve their directories from
// NPS_DATA_DIR (product/infrastructure/user-data.js). That override is set
// here, in a throwaway temp dir, BEFORE the modules that read it are
// imported — same pattern as test/generation-approve.test.js — so this test
// never touches a real install's product/data or assets/uploads.
// =============================================================================
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let buildFixturePptx, buildThreeSlideFixturePptx, pptxImportService, GenerationService;
let dataDir;

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), "nps-pptx-parse-"));
  process.env.NPS_DATA_DIR = dataDir;
  ({ buildFixturePptx, buildThreeSlideFixturePptx } = await import("./helpers/fixture-pptx.js"));
  ({ pptxImportService } = await import("../product/domain/pptx-import-service.js"));
  ({ GenerationService } = await import("../product/domain/generation-service.js"));
});

after(() => rmSync(dataDir, { recursive: true, force: true }));

const context = { userId: "u-test", workspaceId: "w-test", role: "editor" };

test("parser extracts images, tables, grouped text, and an element inventory", async () => {
  const buffer = await buildFixturePptx();
  const record = await pptxImportService.importPptx(context, { buffer, filename: "fixture.pptx" });
  const [s1, s2] = record.proposedMapping;

  assert.equal(s1.elements.images, 1);
  assert.equal(s1.elements.tables, 1);
  assert.equal(s1.content.images.length, 1);
  assert.match(s1.content.images[0], /^assets\/uploads\//);
  assert.deepEqual(s1.content.tables[0], [["H1", "H2"], ["C1", "C2"]]);
  assert.ok(
    [s1.content.body].flat().some((b) => String(b).includes("Grouped text")),
    "text inside <p:grpSp> must not be lost"
  );
  assert.equal(s2.elements.images, 0);
  assert.equal(s2.content.tables.length, 0);
});

test("updateOutline keeps each surviving slide's own images/tables/elements after a middle slide is removed", async () => {
  const buffer = await buildThreeSlideFixturePptx();
  const record = await pptxImportService.importPptx(context, { buffer, filename: "three.pptx" });
  const [orig1, orig2, orig3] = record.proposedMapping;

  // Sanity on the fixture: slide 2 is the only one carrying media.
  assert.equal(orig1.elements.images, 0);
  assert.equal(orig2.elements.images, 1);
  assert.equal(orig2.elements.tables, 1);
  assert.equal(orig3.elements.images, 0);

  // Mimic the outline editor after the user removes slide 2 (product/ui/home.js
  // readOutline(): re-renumbered slideNumber, but each row keeps the
  // ORIGINAL slide's number as sourceSlide).
  const edited = [
    { slideNumber: 1, title: orig1.title, sourceSlide: orig1.slideNumber, content: { body: ["Plain text one"], notes: "" } },
    { slideNumber: 2, title: orig3.title, sourceSlide: orig3.slideNumber, content: { body: ["Plain text three"], notes: "" } },
  ];

  const generationService = new GenerationService({ /* unused by updateOutline */ });
  const updated = await generationService.updateOutline(context, record.id, edited);
  const [u1, u2] = updated.proposedMapping;

  // u2 is what was originally slide 3 (plain) — it must NOT inherit slide
  // 2's image/table just because it now sits at array index 1, the same
  // index slide 2 used to occupy.
  assert.equal(u1.elements?.images ?? 0, 0, "surviving first slide keeps its own (empty) inventory");
  assert.equal(u2.elements?.images ?? 0, 0, "surviving second slide must not inherit the removed slide's image");
  assert.equal(u2.elements?.tables ?? 0, 0, "surviving second slide must not inherit the removed slide's table");
  assert.ok(!u2.content.images?.length, "no image path leaked from the removed slide");
  assert.ok(!u2.content.tables?.length, "no table leaked from the removed slide");
});

test("imageSource is stored on the generation record, defaulting to source", async () => {
  const buffer = await buildFixturePptx();
  const a = await pptxImportService.importPptx(context, { buffer, filename: "f.pptx" });
  assert.equal(a.imageSource, "source");
  const b = await pptxImportService.importPptx(context, { buffer, filename: "f.pptx", imageSource: "brand" });
  assert.equal(b.imageSource, "brand");
});

test("updateOutline ignores an invalid or missing sourceSlide rather than merging anything", async () => {
  const buffer = await buildThreeSlideFixturePptx();
  const record = await pptxImportService.importPptx(context, { buffer, filename: "three.pptx" });

  const edited = [
    { slideNumber: 1, title: "New slide with no source", content: { body: ["hand-typed"], notes: "" } },
    { slideNumber: 2, title: "Forged", sourceSlide: -1, content: { body: ["still hand-typed"], notes: "" } },
  ];

  const generationService = new GenerationService({});
  const updated = await generationService.updateOutline(context, record.id, edited);
  for (const slide of updated.proposedMapping) {
    assert.ok(!slide.content.images?.length);
    assert.ok(!slide.content.tables?.length);
  }
});
