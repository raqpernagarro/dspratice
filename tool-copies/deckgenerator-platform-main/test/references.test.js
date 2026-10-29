// test/references.test.js
// =============================================================================
// References: files and pasted text attached as source material for a deck.
//
// The service is exercised in-process against a throwaway data directory, with
// a stub provider standing in for describeImage — no test ever calls a model.
// The HTTP routes are exercised on a real server whose PATH has no Claude CLI,
// so an image description fails fast and the upload still succeeds.
// =============================================================================
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { startTestServer } from "./helpers/server.js";

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "references");
const fixture = (name) => readFileSync(join(FIXTURES, name));

const dataDir = mkdtempSync(join(tmpdir(), "nps-ref-"));
process.env.NPS_DATA_DIR = dataDir;

const {
  ReferenceService,
  ReferenceNotFoundError,
  UnsupportedReferenceError,
  ReferenceTooLargeError,
  MAX_REFERENCE_BYTES,
  MAX_REFERENCE_CHARS,
  MAX_REFERENCES_PER_GENERATION,
  MAX_PDF_PAGES,
  MAX_ZIP_ENTRY_BYTES,
  MAX_SHEET_XML_BYTES,
  MAX_XLSX_TOTAL_BYTES,
  ReferenceParseError,
} = await import("../product/domain/reference-service.js");
const { extractSlideText } = await import("../product/domain/pptx-import-service.js");
const { AIProvider } = await import("../product/infrastructure/ai/ai-provider.js");
const { claudeArgs, ClaudeCliProvider, buildDescribeImagePrompt } = await import("../product/infrastructure/ai/claude-cli-provider.js");
const { default: JSZip } = await import("jszip");
const { PDFDocument, StandardFonts } = await import("pdf-lib");

const ctxA = { userId: "u-a", workspaceId: "ws-a", role: "owner" };
const ctxB = { userId: "u-b", workspaceId: "ws-b", role: "owner" };

class StubProvider extends AIProvider {
  constructor(impl) { super(); this.impl = impl; this.calls = []; }
  async describeImage(req) { this.calls.push(req); return this.impl(req); }
}

after(() => rmSync(dataDir, { recursive: true, force: true }));

describe("caps", () => {
  test("values", () => {
    assert.equal(MAX_REFERENCE_BYTES, 30 * 1024 * 1024);
    assert.equal(MAX_REFERENCE_CHARS, 60_000);
    assert.equal(MAX_REFERENCES_PER_GENERATION, 10);
  });
});

describe("parsing each kind", () => {
  const service = new ReferenceService(new StubProvider(async () => "A green square chart titled Growth 2026"));

  const cases = [
    ["brief.pdf", "document", "Quarterly revenue grew 42 percent"],
    ["notes.docx", "document", "Customer churn fell to 3 percent"],
    ["source.pptx", "document", "Platform migration completes in March"],
    ["figures.xlsx", "spreadsheet", "North"],
    ["regions.csv", "spreadsheet", "South, coastal"],
    ["notes.md", "text", "The pilot reached 1,200 users"],
    ["chart.png", "image", "Growth 2026"],
  ];
  for (const [file, kind, phrase] of cases) {
    test(`${file} → ${kind}, text contains its phrase`, async () => {
      const created = await service.create(ctxA, { buffer: fixture(file), filename: file });
      assert.equal(created.kind, kind);
      assert.equal(created.name, file);
      assert.equal(created.useOnSlides, false);
      assert.ok(created.id);
      assert.ok(created.preview.length <= 300);
      const ref = await service.get(ctxA, created.id);
      assert.ok(ref.text.includes(phrase), `missing "${phrase}" in:\n${ref.text}`);
      assert.equal(created.chars, ref.text.length);
    });
  }

  test("xlsx: one Markdown table per sheet with a Sheet!range header", async () => {
    const created = await service.create(ctxA, { buffer: fixture("figures.xlsx"), filename: "figures.xlsx" });
    const { text } = await service.get(ctxA, created.id);
    assert.match(text, /\| Region \| Q1 \| Q2 \|/);
    assert.match(text, /\| Item \| Amount \|/);
    assert.match(text, /Revenue!A1:C3/);
    assert.match(text, /Costs!A1:B3/);
    assert.match(text, /\| Licences \| 20 \|/); // formula → its result
  });

  test("csv: a Markdown table with the header row", async () => {
    const created = await service.create(ctxA, { buffer: fixture("regions.csv"), filename: "regions.csv" });
    const { text } = await service.get(ctxA, created.id);
    assert.match(text, /\| Region \| Revenue \|/);
    assert.match(text, /\| South, coastal \| 95 \|/);
  });

  test("image: stored on disk, described, path passed to the provider", async () => {
    const provider = new StubProvider(async () => "A chart");
    const s = new ReferenceService(provider);
    const created = await s.create(ctxA, { buffer: fixture("chart.png"), filename: "chart.png" });
    assert.equal(created.described, true);
    const ref = await s.get(ctxA, created.id);
    assert.ok(ref.imagePath && existsSync(ref.imagePath));
    assert.ok(ref.imagePath.endsWith(`${created.id}.png`));
    assert.equal(provider.calls[0].path, ref.imagePath);
  });

  test("pptx helper: extractSlideText reads every slide", async () => {
    const text = await extractSlideText(fixture("source.pptx"));
    assert.match(text, /Platform migration completes in March/);
    assert.match(text, /Train the support team/);
  });
});

describe("failure handling", () => {
  test("describeImage rejecting → still created, described:false, text empty", async () => {
    const s = new ReferenceService(new StubProvider(async () => { throw new Error("CLI down"); }));
    const created = await s.create(ctxA, { buffer: fixture("chart.png"), filename: "shot.png" });
    assert.equal(created.kind, "image");
    assert.equal(created.described, false);
    assert.equal((await s.get(ctxA, created.id)).text, "");
  });

  test("a provider without describeImage → described:false", async () => {
    const s = new ReferenceService(new AIProvider());
    const created = await s.create(ctxA, { buffer: fixture("chart.png"), filename: "shot.png" });
    assert.equal(created.described, false);
  });

  test("unsupported type → UnsupportedReferenceError listing supported types", async () => {
    const s = new ReferenceService(new StubProvider(async () => null));
    await assert.rejects(s.create(ctxA, { buffer: Buffer.from("MZ"), filename: "setup.exe" }), (err) => {
      assert.ok(err instanceof UnsupportedReferenceError);
      assert.match(err.message, /PDF/);
      assert.match(err.message, /\.xlsx/);
      return true;
    });
  });

  test("a PDF on a Node too old for the PDF reader says so, not \"damaged\"", async () => {
    const { setPdfjsLoader } = await import("../product/domain/reference-service.js");
    const s = new ReferenceService(new StubProvider(async () => null));
    const pdf = await PDFDocument.create();
    pdf.addPage([200, 100]);
    const restore = setPdfjsLoader(async () => { throw new SyntaxError("Unexpected token '??='"); });
    try {
      await assert.rejects(s.create(ctxA, { buffer: Buffer.from(await pdf.save()), filename: "brief.pdf" }), (err) => {
        assert.ok(err instanceof ReferenceParseError);
        assert.equal(err.message, "Reading PDFs needs Node 22.13 or newer.");
        return true;
      });
    } finally {
      setPdfjsLoader(restore);
    }
  });

  test("over 30 MB → ReferenceTooLargeError", async () => {
    const s = new ReferenceService(new StubProvider(async () => null));
    await assert.rejects(
      s.create(ctxA, { buffer: Buffer.alloc(MAX_REFERENCE_BYTES + 1), filename: "big.txt" }),
      ReferenceTooLargeError
    );
  });

  test("long text truncated to the cap with [truncated]", async () => {
    const s = new ReferenceService(new StubProvider(async () => null));
    const created = await s.createFromText(ctxA, { text: "word ".repeat(20_000) });
    const { text } = await s.get(ctxA, created.id);
    assert.ok(text.length <= MAX_REFERENCE_CHARS);
    assert.ok(text.endsWith("[truncated]"));
    assert.equal(created.kind, "text");
  });
});

describe("resource caps", () => {
  const s = new ReferenceService(new StubProvider(async () => null));
  const zipWith = async (files) => {
    const zip = new JSZip();
    for (const [name, body] of Object.entries(files)) zip.file(name, body);
    return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  };
  const rejectsAsTooMuch = (promise) => assert.rejects(promise, (err) => {
    assert.ok(err instanceof ReferenceParseError, err?.name);
    assert.match(err.message, /expands to more data/);
    return true;
  });

  test("xlsx whose sheet XML is over the cap is refused before exceljs loads it", async () => {
    const buffer = await zipWith({
      "[Content_Types].xml": "<Types/>",
      "xl/workbook.xml": "<workbook/>",
      "xl/worksheets/sheet1.xml": "<sheetData>" + "<row/>".repeat(Math.ceil(MAX_SHEET_XML_BYTES / 6) + 10) + "</sheetData>",
    });
    assert.ok(buffer.length < 1024 * 1024, "small on the wire");
    await rejectsAsTooMuch(s.create(ctxA, { buffer, filename: "bomb.xlsx" }));
  });

  test("xlsx whose sheets are each under the per-entry cap but over the workbook total is refused", async () => {
    const sheets = 3;
    const perSheet = Math.ceil(MAX_XLSX_TOTAL_BYTES / sheets) + 1024;
    assert.ok(perSheet < MAX_SHEET_XML_BYTES, "each sheet is under the per-entry cap");
    const files = { "[Content_Types].xml": "<Types/>", "xl/workbook.xml": "<workbook/>" };
    for (let n = 1; n <= sheets; n++) files[`xl/worksheets/sheet${n}.xml`] = "<sheetData>" + "<row/>".repeat(Math.ceil(perSheet / 6)) + "</sheetData>";
    const buffer = await zipWith(files);
    assert.ok(buffer.length < 1024 * 1024, "small on the wire");
    await rejectsAsTooMuch(s.create(ctxA, { buffer, filename: "wide.xlsx" }));
  });

  test("docx with an entry over the per-entry cap is refused", async () => {
    const buffer = await zipWith({ "word/document.xml": "<w:document>" + " ".repeat(MAX_ZIP_ENTRY_BYTES + 1) + "</w:document>" });
    await rejectsAsTooMuch(s.create(ctxA, { buffer, filename: "bomb.docx" }));
  });

  test("a 200k-row CSV uploads and keeps the first 200 rows", async () => {
    const lines = ["Region,Value"];
    for (let i = 1; i < 200_000; i++) lines.push(`R${i},${i}`);
    const created = await s.create(ctxA, { buffer: Buffer.from(lines.join("\n")), filename: "big.csv" });
    const { text } = await s.get(ctxA, created.id);
    assert.match(text, /\(first 200 of 200000 rows\)/);
    assert.match(text, /\| Region \| Value \|/);
    assert.match(text, /\| R199 \| 199 \|/);
    assert.ok(!text.includes("R200 "));
  });

  test(`a PDF stops at ${MAX_PDF_PAGES} pages`, async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    for (let n = 1; n <= MAX_PDF_PAGES + 20; n++) pdf.addPage([200, 100]).drawText(`P${n}`, { x: 10, y: 50, size: 10, font });
    const created = await s.create(ctxA, { buffer: Buffer.from(await pdf.save()), filename: "long.pdf" });
    const { text } = await s.get(ctxA, created.id);
    assert.match(text, new RegExp(`\\bP${MAX_PDF_PAGES}\\b`));
    assert.ok(!new RegExp(`\\bP${MAX_PDF_PAGES + 1}\\b`).test(text));
    assert.match(text, new RegExp(`first ${MAX_PDF_PAGES} of ${MAX_PDF_PAGES + 20} pages`));
  });
});

describe("workspace scope, toggle, delete", () => {
  const s = new ReferenceService(new StubProvider(async () => "x"));

  test("another workspace cannot get, patch or delete the id", async () => {
    const created = await s.createFromText(ctxA, { name: "Brief", text: "Secret plan" });
    await assert.rejects(s.get(ctxB, created.id), ReferenceNotFoundError);
    await assert.rejects(s.setUseOnSlides(ctxB, created.id, true), ReferenceNotFoundError);
    await assert.rejects(s.remove(ctxB, created.id), ReferenceNotFoundError);
    assert.equal((await s.get(ctxA, created.id)).text, "Secret plan");
  });

  test("useOnSlides toggles; delete removes record and image file", async () => {
    const created = await s.create(ctxA, { buffer: fixture("chart.png"), filename: "chart.png" });
    const updated = await s.setUseOnSlides(ctxA, created.id, true);
    assert.equal(updated.useOnSlides, true);
    const { imagePath } = await s.get(ctxA, created.id);
    await s.remove(ctxA, created.id);
    await assert.rejects(s.get(ctxA, created.id), ReferenceNotFoundError);
    assert.equal(existsSync(imagePath), false);
  });

  test("getMany refuses more than 10", async () => {
    const ids = Array.from({ length: 11 }, (_, i) => `id-${i}`);
    await assert.rejects(s.getMany(ctxA, ids), /10/);
  });
});

describe("describeImage CLI arguments", () => {
  test("read access only for the image call, scoped to one directory", () => {
    const plain = claudeArgs("hi");
    for (const flag of ["--allowedTools", "--add-dir", "--tools", "--disallowedTools"]) assert.ok(!plain.includes(flag));
    const withRead = claudeArgs("describe", null, { readDir: "/tmp/nps-describe-x" });
    const after = (flag) => withRead[withRead.indexOf(flag) + 1];
    assert.equal(after("--tools"), "Read");
    assert.equal(after("--allowedTools"), "Read(//tmp/nps-describe-x/**)"); // never a bare "Read"
    assert.ok(!withRead.some((a, i) => a === "Read" && withRead[i - 1] === "--allowedTools"));
    assert.match(after("--disallowedTools"), /Bash/);
    assert.match(after("--disallowedTools"), /WebFetch/);
    assert.ok(withRead.includes("--strict-mcp-config"));
    assert.equal(after("--setting-sources"), "");
    assert.equal(after("--add-dir"), "/tmp/nps-describe-x");
    assert.ok(!withRead.includes("--json-schema"));
  });

  test("describeImage runs in a fresh temp dir holding only a copy, removed afterwards", async () => {
    const calls = [];
    const provider = new ClaudeCliProvider({
      run: async (prompt, schema, opts) => {
        calls.push({ prompt, schema, opts, files: readdirSync(opts.cwd) });
        return { result: "  A mint square  " };
      },
    });
    const src = join(FIXTURES, "chart.png");
    assert.equal(await provider.describeImage({ path: src }), "A mint square");
    const [{ prompt, schema, opts, files }] = calls;
    assert.equal(schema, null);
    assert.equal(opts.cwd, opts.readDir);
    assert.match(basename(opts.cwd), /^nps-describe-/);
    assert.ok(!opts.cwd.startsWith(dirname(FIXTURES)), "not the repo");
    assert.deepEqual(files, ["image.png"]);
    assert.ok(prompt.includes(join(opts.cwd, "image.png")));
    assert.ok(!prompt.includes(src));
    assert.equal(existsSync(opts.cwd), false, "temp dir removed");
  });

  test("the temp dir is removed when the CLI call fails", async () => {
    let dir;
    const provider = new ClaudeCliProvider({ run: async (_p, _s, opts) => { dir = opts.cwd; throw new Error("boom"); } });
    await assert.rejects(provider.describeImage({ path: join(FIXTURES, "chart.png") }), /boom/);
    assert.ok(dir);
    assert.equal(existsSync(dir), false);
  });

  test("the prompt limits reading to the one file and treats image text as data", () => {
    const prompt = buildDescribeImagePrompt("/tmp/x/image.png");
    assert.match(prompt, /only that one file/i);
    assert.match(prompt, /not instructions/i);
  });

  test("base provider resolves null", async () => {
    assert.equal(await new AIProvider().describeImage({ path: "/x.png" }), null);
  });
});

describe("HTTP /api/references", () => {
  const NO_CLAUDE = { PATH: "/usr/bin:/bin" };
  let open, closed;
  before(async () => {
    [open, closed] = await Promise.all([
      startTestServer({ env: NO_CLAUDE }),
      startTestServer({ env: { ...NO_CLAUDE, AUTO_LOGIN: "0" } }),
    ]);
  });
  after(async () => { await Promise.all([open?.stop(), closed?.stop()]); });

  const upload = (server, filename, body) => fetch(
    `${server.origin}/api/references?filename=${encodeURIComponent(filename)}`,
    { method: "POST", headers: { "Content-Type": "application/octet-stream", Origin: server.origin }, body }
  );
  const json = (server, method, path, body) => fetch(`${server.origin}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Origin: server.origin },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  test("401 without a session", async () => {
    const res = await upload(closed, "notes.md", fixture("notes.md"));
    assert.equal(res.status, 401);
  });

  test("201 with the reference shape", async () => {
    const res = await upload(open, "notes.md", fixture("notes.md"));
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.deepEqual(Object.keys(body).sort(), ["chars", "id", "kind", "name", "preview", "useOnSlides"].sort());
    assert.equal(body.kind, "text");
    assert.match(body.preview, /pilot reached/);
  });

  test("image upload with no CLI → 201, described:false", async () => {
    const res = await upload(open, "chart.png", fixture("chart.png"));
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.kind, "image");
    assert.equal(body.described, false);
  });

  test("31 MB → 413", async () => {
    const res = await upload(open, "big.pdf", Buffer.alloc(31 * 1024 * 1024));
    assert.equal(res.status, 413);
  });

  test(".exe → 415 with a plain message", async () => {
    const res = await upload(open, "setup.exe", Buffer.from("MZ"));
    assert.equal(res.status, 415);
    assert.match((await res.json()).error, /PDF/);
  });

  test("a corrupt .pdf → 400", async () => {
    const res = await upload(open, "broken.pdf", Buffer.from("not a pdf"));
    assert.equal(res.status, 400);
  });

  test("text, patch, delete", async () => {
    const res = await json(open, "POST", "/api/references/text", { name: "Pasted", text: "Board wants a 3-year plan" });
    assert.equal(res.status, 201);
    const created = await res.json();
    assert.equal(created.kind, "text");
    assert.equal(created.name, "Pasted");

    const empty = await json(open, "POST", "/api/references/text", { text: "  " });
    assert.equal(empty.status, 400);

    const patched = await json(open, "PATCH", `/api/references/${created.id}`, { useOnSlides: true });
    assert.equal(patched.status, 200);
    assert.equal((await patched.json()).useOnSlides, true);

    const bad = await json(open, "PATCH", `/api/references/${created.id}`, { useOnSlides: "yes" });
    assert.equal(bad.status, 400);

    const del = await json(open, "DELETE", `/api/references/${created.id}`);
    assert.equal(del.status, 204);
    const again = await json(open, "DELETE", `/api/references/${created.id}`);
    assert.equal(again.status, 404);
  });
});
