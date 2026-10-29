// =============================================================================
// Reference Service — Domain Layer.
//
// References are source material a person attaches to a deck: documents,
// spreadsheets, images and screenshots, pasted text. Each is read once, on
// upload, into plain text the generation steps can quote from. This is NOT
// the .pptx import (which turns a file into the deck itself); a .pptx here is
// only read for its words.
//
//   PDF              pdfjs-dist, page text in order
//   Word (.docx)     word/document.xml paragraph text
//   PowerPoint       extractSlideText (shared with the import's XML readers)
//   Excel (.xlsx)    one Markdown table per sheet, headed Sheet!A1:D20
//   CSV              one Markdown table
//   .txt / .md       as-is
//   PNG / JPG / WebP stored (downscaled to 2000px when sharp is available) and
//                    described by the provider; a failed description never
//                    fails the upload — the image is kept with empty text and
//                    `described: false`, and can still be used on slides.
//
// The provider is passed in (same rule as every other service: Domain code
// never imports a concrete provider).
// =============================================================================
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { join, extname } from "node:path";
import JSZip from "jszip";
import { extractSlideText, PptxParseError } from "./pptx-import-service.js";
import { referenceRepository as defaultRepository, REFERENCES_DIR } from "../storage/reference-repository.js";

export const MAX_REFERENCE_BYTES = 30 * 1024 * 1024;
export const MAX_REFERENCE_CHARS = 60_000;
export const MAX_REFERENCES_PER_GENERATION = 10;
const MAX_SHEET_ROWS = 200;
export const MAX_PDF_PAGES = 500;
const PDF_TIMEOUT_MS = 30_000;
const MAX_ZIP_ENTRIES = 5_000;
export const MAX_ZIP_ENTRY_BYTES = 50 * 1024 * 1024;
export const MAX_SHEET_XML_BYTES = 20 * 1024 * 1024;
const MAX_ZIP_TOTAL_BYTES = 200 * 1024 * 1024;
/** exceljs builds an object per cell for the WHOLE workbook before the
 *  200-row cap applies, so a workbook's total decompressed XML is held to
 *  this, not to the general 200 MB. */
export const MAX_XLSX_TOTAL_BYTES = 25 * 1024 * 1024;
const PREVIEW_CHARS = 300;
const MAX_IMAGE_PX = 2000;
const TRUNCATED = "[truncated]";

/** extension → kind */
const TYPES = {
  ".pdf": "document",
  ".docx": "document",
  ".pptx": "document",
  ".xlsx": "spreadsheet",
  ".csv": "spreadsheet",
  ".txt": "text",
  ".md": "text",
  ".markdown": "text",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
};

export const SUPPORTED_TYPES_MESSAGE =
  "This file type can't be used as a reference. Supported: PDF, Word (.docx), " +
  "PowerPoint (.pptx), Excel (.xlsx), CSV, text (.txt, .md), and images (PNG, JPG, WebP).";

export class ReferenceNotFoundError extends Error {
  constructor() { super("Reference not found."); this.name = "ReferenceNotFoundError"; }
}
export class UnsupportedReferenceError extends Error {
  constructor() { super(SUPPORTED_TYPES_MESSAGE); this.name = "UnsupportedReferenceError"; }
}
export class ReferenceTooLargeError extends Error {
  constructor() { super("This file is larger than 30 MB. Try a smaller file."); this.name = "ReferenceTooLargeError"; }
}
export class ReferenceParseError extends Error {
  constructor(message) { super(message); this.name = "ReferenceParseError"; }
}
export class ReferenceValidationError extends Error {
  constructor(message) { super(message); this.name = "ReferenceValidationError"; }
}

// ---- readers ----------------------------------------------------------------

function decodeXml(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

/** Reads at most MAX_PDF_PAGES pages and stops early once the text is past
 *  the character cap. pdfjs parses on the main thread in Node, so the whole
 *  read also has a deadline, checked between pages and raced per page. */
let loadPdfjs = () => import("pdfjs-dist/legacy/build/pdf.mjs");

/** Replaces the PDF reader's loader (tests); returns the one it replaced. */
export function setPdfjsLoader(loader) {
  const prior = loadPdfjs;
  loadPdfjs = loader;
  return prior;
}

async function readPdf(buffer) {
  // pdfjs-dist 6 needs Node 22.13+; on an older Node its import itself fails,
  // which would otherwise read as a damaged file.
  let pdfjs;
  try {
    pdfjs = await loadPdfjs();
  } catch {
    throw new ReferenceParseError("Reading PDFs needs Node 22.13 or newer.");
  }
  const task = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
    verbosity: 0,
  });
  const deadline = Date.now() + PDF_TIMEOUT_MS;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new ReferenceParseError("This PDF took too long to read. Try a smaller file.")), PDF_TIMEOUT_MS);
  });
  timeout.catch(() => {});
  try {
    const doc = await Promise.race([task.promise, timeout]);
    const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES);
    const pages = [];
    let chars = 0;
    for (let n = 1; n <= pageCount && chars <= MAX_REFERENCE_CHARS; n++) {
      if (Date.now() > deadline) throw new ReferenceParseError("This PDF took too long to read. Try a smaller file.");
      const page = await Promise.race([doc.getPage(n), timeout]);
      const content = await Promise.race([page.getTextContent(), timeout]);
      let text = "";
      for (const item of content.items) {
        if (typeof item.str !== "string") continue;
        text += item.str + (item.hasEOL ? "\n" : "");
      }
      page.cleanup();
      text = text.trim();
      if (text) { pages.push(text); chars += text.length + 2; }
    }
    const note = doc.numPages > MAX_PDF_PAGES ? `\n\n(first ${MAX_PDF_PAGES} of ${doc.numPages} pages)` : "";
    return pages.join("\n\n") + note;
  } finally {
    clearTimeout(timer);
    await task.destroy();
  }
}

/**
 * Opens a .docx/.xlsx and decompresses every entry ONCE through a counting
 * stream, so the caps hold on the bytes that actually come out, not on the
 * sizes the archive declares (which a crafted file can lie about). Anything
 * over a cap is refused before a parser (exceljs, the XML readers) sees it.
 */
async function openZip(buffer, { maxEntryBytes = MAX_ZIP_ENTRY_BYTES, maxTotalBytes = MAX_ZIP_TOTAL_BYTES } = {}) {
  const tooBig = () => new ReferenceParseError("This file expands to more data than can be read. Try a smaller file.");
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files).filter((e) => !e.dir);
  if (entries.length > MAX_ZIP_ENTRIES) throw tooBig();
  let total = 0;
  for (const entry of entries) {
    const declared = entry?._data?.uncompressedSize || 0;
    if (declared > maxEntryBytes || total + declared > maxTotalBytes) throw tooBig();
    total += await countEntryBytes(entry, Math.min(maxEntryBytes, maxTotalBytes - total), tooBig);
  }
  return zip;
}

function countEntryBytes(entry, limit, tooBig) {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    const stream = entry.internalStream("uint8array");
    stream
      .on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > limit) { stream.pause(); reject(tooBig()); }
      })
      .on("error", reject)
      .on("end", () => resolve(bytes))
      .resume();
  });
}

async function readDocx(buffer) {
  const xml = await (await openZip(buffer)).file("word/document.xml")?.async("string");
  if (!xml) throw new ReferenceParseError("This file isn't a readable Word document.");
  const paragraphs = [];
  for (const p of xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || []) {
    const text = (p.match(/<w:t\b[^>]*>[\s\S]*?<\/w:t>|<w:tab\/>|<w:br\/>/g) || [])
      .map((r) => (r === "<w:tab/>" ? "\t" : r === "<w:br/>" ? "\n" : decodeXml(r.replace(/^<w:t\b[^>]*>|<\/w:t>$/g, ""))))
      .join("");
    if (text.trim()) paragraphs.push(text.trim());
  }
  return paragraphs.join("\n");
}

const cellText = (v) => String(v ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();

function markdownTable(rows) {
  const width = rows.reduce((w, r) => Math.max(w, r.length), 0);
  const pad = (r) => Array.from({ length: width }, (_, i) => cellText(r[i]));
  const line = (r) => `| ${pad(r).join(" | ")} |`;
  return [line(rows[0]), `| ${Array(width).fill("---").join(" | ")} |`, ...rows.slice(1).map(line)].join("\n");
}

function columnLetter(n) {
  let s = "";
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function excelValue(v) {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v !== "object") return v;
  if ("result" in v) return excelValue(v.result);          // formula
  if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join("");
  if ("text" in v) return excelValue(v.text);               // hyperlink
  if ("error" in v) return v.error;
  return "";
}

async function readXlsx(buffer) {
  await openZip(buffer, { maxEntryBytes: MAX_SHEET_XML_BYTES, maxTotalBytes: MAX_XLSX_TOTAL_BYTES });
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const parts = [];
  workbook.eachSheet((sheet) => {
    const rows = [];
    let total = 0;
    let width = 0;
    sheet.eachRow({ includeEmpty: false }, (row) => {
      total++;
      if (rows.length >= MAX_SHEET_ROWS) return;
      const values = [];
      row.eachCell({ includeEmpty: true }, (cell, col) => { values[col - 1] = excelValue(cell.value); });
      width = Math.max(width, values.length);
      rows.push({ number: row.number, values });
    });
    if (!rows.length) return;
    const lastRow = rows[rows.length - 1].number;
    const range = `${sheet.name}!A1:${columnLetter(width)}${lastRow}`;
    const note = total > rows.length ? ` (first ${rows.length} of ${total} rows)` : "";
    parts.push(`${range}${note}\n${markdownTable(rows.map((r) => r.values))}`);
  });
  return parts.join("\n\n");
}

/** RFC 4180-ish: quoted fields, doubled quotes, commas and newlines inside
 *  quotes. Keeps the first `keep` rows and counts the rest. */
function parseCsv(text, keep = MAX_SHEET_ROWS) {
  const rows = [];
  let total = 0;
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim())) { total++; if (rows.length < keep) rows.push(row); }
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim())) { total++; if (rows.length < keep) rows.push(row); }
  return { rows, total };
}

function readCsv(buffer) {
  const { rows, total } = parseCsv(buffer.toString("utf8").replace(/^\uFEFF/, ""));
  if (!rows.length) return "";
  const note = total > rows.length ? `(first ${rows.length} of ${total} rows)\n` : "";
  return note + markdownTable(rows);
}

async function readText(ext, buffer) {
  try {
    switch (ext) {
      case ".pdf": return await readPdf(buffer);
      case ".docx": return await readDocx(buffer);
      case ".pptx": return await extractSlideText(buffer);
      case ".xlsx": return await readXlsx(buffer);
      case ".csv": return readCsv(buffer);
      default: return buffer.toString("utf8").replace(/^﻿/, "");
    }
  } catch (err) {
    if (err instanceof ReferenceParseError) throw err;
    if (err instanceof PptxParseError) throw new ReferenceParseError(err.message);
    throw new ReferenceParseError("Could not read this file. It may be damaged, or not the type its name says.");
  }
}

function capText(text) {
  const clean = String(text || "").trim();
  if (clean.length <= MAX_REFERENCE_CHARS) return clean;
  return clean.slice(0, MAX_REFERENCE_CHARS - TRUNCATED.length - 1) + "\n" + TRUNCATED;
}

function preview(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, PREVIEW_CHARS);
}

function summary(record) {
  return {
    id: record.id,
    name: record.name,
    kind: record.kind,
    chars: record.text.length,
    useOnSlides: record.useOnSlides,
    preview: preview(record.text),
    ...(record.kind === "image" ? { described: record.described === true } : {}),
  };
}

let sharpPromise;
function loadSharp() {
  if (!sharpPromise) sharpPromise = import("sharp").then((m) => m.default).catch(() => null);
  return sharpPromise;
}

/** Downscales to ≤ 2000px on the long edge, same format, when sharp is
 *  available; otherwise the original bytes. Bytes sharp can't decode are
 *  not an image. */
async function prepareImage(buffer) {
  const sharp = await loadSharp();
  if (!sharp) return buffer;
  try {
    await sharp(buffer).metadata();
  } catch {
    throw new ReferenceParseError("Could not read this image. It may be damaged, or not the type its name says.");
  }
  return sharp(buffer)
    .rotate()
    .resize({ width: MAX_IMAGE_PX, height: MAX_IMAGE_PX, fit: "inside", withoutEnlargement: true })
    .toBuffer();
}

// ---- service ----------------------------------------------------------------

export class ReferenceService {
  /**
   * @param {import("../infrastructure/ai/ai-provider.js").AIProvider} provider
   * @param {{repository?: import("../storage/reference-repository.js").ReferenceRepository, dir?: string}} [deps]
   */
  constructor(provider, { repository = defaultRepository, dir = REFERENCES_DIR } = {}) {
    this.provider = provider;
    this.repository = repository;
    this.dir = dir;
  }

  /** @returns {Promise<{id, name, kind, chars, useOnSlides, preview, described?}>} */
  async create(context, { buffer, filename }) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new ReferenceValidationError("No file uploaded.");
    if (buffer.length > MAX_REFERENCE_BYTES) throw new ReferenceTooLargeError();
    const name = String(filename || "").trim().slice(0, 200) || "Reference";
    const ext = extname(name).toLowerCase();
    const kind = TYPES[ext];
    if (!kind) throw new UnsupportedReferenceError();

    if (kind !== "image") {
      const text = capText(await readText(ext, buffer));
      const record = await this.repository.create({ ...owner(context), name, kind, text });
      return summary(record);
    }

    const id = this.repository.newId();
    const imageFile = `${id}${ext === ".jpeg" ? ".jpg" : ext}`;
    const path = join(this.dir, imageFile);
    await mkdir(this.dir, { recursive: true });
    await writeFile(path, await prepareImage(buffer));
    let text = "";
    try {
      text = capText((await this.provider?.describeImage?.({ path })) || "");
    } catch (err) {
      console.warn(`[references] could not describe ${name}: ${err?.message || err}`);
    }
    try {
      const record = await this.repository.create({ id, ...owner(context), name, kind, text, imageFile, described: Boolean(text) });
      return summary(record);
    } catch (err) {
      await unlink(path).catch(() => {});
      throw err;
    }
  }

  async createFromText(context, { name, text } = {}) {
    if (typeof text !== "string" || !text.trim()) throw new ReferenceValidationError("text is required.");
    const label = typeof name === "string" && name.trim() ? name.trim().slice(0, 200) : "Pasted text";
    const record = await this.repository.create({ ...owner(context), name: label, kind: "text", text: capText(text) });
    return summary(record);
  }

  /** @returns {Promise<{id, name, kind, text, imagePath?, useOnSlides}>} */
  async get(context, id) {
    const record = await this.repository.findById(context.workspaceId, id);
    if (!record) throw new ReferenceNotFoundError();
    return this.#full(record);
  }

  /** The references a generation reads, in the order given. */
  async getMany(context, ids = []) {
    if (ids.length > MAX_REFERENCES_PER_GENERATION) {
      throw new ReferenceValidationError(`A deck can use at most ${MAX_REFERENCES_PER_GENERATION} references.`);
    }
    return Promise.all(ids.map((id) => this.get(context, id)));
  }

  async setUseOnSlides(context, id, useOnSlides) {
    if (typeof useOnSlides !== "boolean") throw new ReferenceValidationError("useOnSlides must be true or false.");
    const record = await this.repository.update(context.workspaceId, id, { useOnSlides });
    if (!record) throw new ReferenceNotFoundError();
    return summary(record);
  }

  async remove(context, id) {
    const record = await this.repository.delete(context.workspaceId, id);
    if (!record) throw new ReferenceNotFoundError();
    if (record.imageFile) await unlink(join(this.dir, record.imageFile)).catch(() => {});
  }

  #full(record) {
    return {
      id: record.id,
      name: record.name,
      kind: record.kind,
      text: record.text,
      ...(record.imageFile ? { imagePath: join(this.dir, record.imageFile) } : {}),
      useOnSlides: record.useOnSlides,
    };
  }
}

function owner(context) {
  return { workspaceId: context.workspaceId, userId: context.userId };
}
