// =============================================================================
// PPTX Import Service — MVP Sprint 1, Domain Layer.
//
// Parses an uploaded .pptx (a zip of OOXML files) into the exact same
// {title, content} shape GenerationService's proposedMapping already
// produces, then reuses buildSlidesFromMapping (generation-service.js) to
// turn it into real slides on the "core/cover-single"/"core/content-twocol" templates — the same
// two templates AI generation already maps onto (Decision 1, Phase 4).
// One slide-mapping code path for every content source; no second
// presentation model, no new templates.
//
// Text extraction is a pragmatic, regex-based reader of the slide XML
// (title/subtitle/body placeholders, paragraph text runs) and the sibling
// notesSlide XML for speaker notes — not a full OOXML object model. It
// covers ordinary title+bullets slides, which is the overwhelming majority
// of real-world decks; unusual layouts (SmartArt, charts, grouped shapes)
// degrade gracefully to whatever plain text can be found rather than
// failing the whole import. Image placement is not reconstructed — a
// documented limitation (see the Sprint 1 report), not a silent gap.
// =============================================================================
import JSZip from "jszip";
import { generationRepository } from "../storage/generation-repository.js";
import { storeImportedImage, isSharpAvailable } from "./media-upload-service.js";

export class PptxParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "PptxParseError";
  }
}

function decodeXmlEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractParagraphs(xmlFragment) {
  const paragraphs = [];
  const pMatches = xmlFragment.match(/<a:p>[\s\S]*?<\/a:p>/g) || [];
  for (const p of pMatches) {
    const runs = p.match(/<a:t>[\s\S]*?<\/a:t>/g) || [];
    const text = runs.map((r) => decodeXmlEntities(r.replace(/^<a:t>|<\/a:t>$/g, ""))).join("");
    if (text.trim()) paragraphs.push(text.trim());
  }
  return paragraphs;
}

function extractShapes(slideXml) {
  return slideXml.match(/<p:sp>[\s\S]*?<\/p:sp>/g) || [];
}

/** One slide's shapes → { title, subtitle, bullets }, using each shape's
 * placeholder type (<p:ph type="...">) when present, falling back to
 * "first shape's first line is the title" when a deck doesn't use
 * standard title/body placeholders. */
function parseSlideXml(slideXml) {
  const shapes = extractShapes(slideXml);
  let title = "";
  let subtitle = "";
  const bullets = [];

  for (const shape of shapes) {
    const phType = shape.match(/<p:ph[^>]*type="([^"]*)"/)?.[1] || null;
    const paragraphs = extractParagraphs(shape);
    if (!paragraphs.length) continue;

    if (phType === "title" || phType === "ctrTitle") title = paragraphs.join(" ");
    else if (phType === "subTitle") subtitle = paragraphs.join(" ");
    else bullets.push(...paragraphs);
  }

  if (!title && bullets.length) title = bullets.shift();

  return { title, subtitle, bullets };
}

/** Excludes the notesSlide's own slide-number/date/slide-image
 * placeholders — only the actual speaker-notes body text. */
function parseNotesXml(notesXml) {
  const shapes = extractShapes(notesXml);
  const parts = [];
  for (const shape of shapes) {
    const phType = shape.match(/<p:ph[^>]*type="([^"]*)"/)?.[1] || null;
    if (phType === "sldNum" || phType === "sldImg" || phType === "dt" || phType === "ftr") continue;
    parts.push(...extractParagraphs(shape));
  }
  return parts.join("\n");
}

function parseRelationships(relsXml) {
  const map = {};
  for (const rel of relsXml.match(/<Relationship\b[^>]*\/>/g) || []) {
    const id = rel.match(/Id="([^"]*)"/)?.[1];
    const target = rel.match(/Target="([^"]*)"/)?.[1];
    const type = rel.match(/Type="([^"]*)"/)?.[1] || "";
    if (id && target) map[id] = { target, type };
  }
  return map;
}

function normalizePath(path) {
  const out = [];
  for (const part of path.split("/")) {
    if (part === "..") out.pop();
    else if (part !== ".") out.push(part);
  }
  return out.join("/");
}

/** Tables on a slide → array of tables, each rows × cells of plain text. */
function extractTables(slideXml) {
  const tables = [];
  for (const tbl of slideXml.match(/<a:tbl\b[^>]*>[\s\S]*?<\/a:tbl>/g) || []) {
    const rows = [];
    for (const tr of tbl.match(/<a:tr\b[\s\S]*?<\/a:tr>/g) || []) {
      const cells = (tr.match(/<a:tc\b[\s\S]*?<\/a:tc>/g) || [])
        .map((tc) => extractParagraphs(tc).join(" "));
      if (cells.some((c) => c.trim())) rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

function countCharts(slideXml) {
  return (slideXml.match(/<a:graphicData[^>]*uri="[^"]*\/chart"/g) || []).length;
}

/** The r:embed ids of every picture on a slide, in document order. */
function extractImageRefs(slideXml) {
  const refs = [];
  for (const pic of slideXml.match(/<p:pic\b[^>]*>[\s\S]*?<\/p:pic>/g) || []) {
    const rId = pic.match(/<a:blip[^>]*r:embed="([^"]*)"/)?.[1];
    if (rId) refs.push(rId);
  }
  return refs;
}

/**
 * Resolves a slide's pictures to stored asset paths.
 * `mediaCache` maps a zip media path to its stored result (or null), so an
 * image reused on five slides is read and stored once per import.
 */
async function storeSlideImages(zip, slidePath, slideXml, mediaCache, warnings, slideNumber) {
  const slideFileName = slidePath.split("/").pop();
  const relsFile = zip.file(`ppt/slides/_rels/${slideFileName}.rels`);
  if (!relsFile) return [];
  const rels = parseRelationships(await relsFile.async("string"));

  const paths = [];
  for (const rId of extractImageRefs(slideXml)) {
    const target = rels[rId]?.target;
    if (!target) continue;
    const mediaPath = normalizePath(`ppt/slides/${target}`);
    if (!(mediaPath in mediaCache)) {
      const file = zip.file(mediaPath);
      if (!file) {
        // The relationship points at a target the archive doesn't actually
        // contain — a malformed or hand-edited .pptx, not an unsupported
        // format (that case is caught below, once the bytes ARE read).
        warnings.push(`An image on slide ${slideNumber} could not be read from the file.`);
      }
      const buffer = file ? await file.async("nodebuffer") : null;
      mediaCache[mediaPath] = buffer ? await storeImportedImage(buffer) : null;
      if (buffer && !mediaCache[mediaPath]) {
        warnings.push(`An image on this deck uses a format that can't be imported (${mediaPath.split("/").pop()}).`);
      }
    }
    if (mediaCache[mediaPath]) paths.push(mediaCache[mediaPath].path);
  }
  return paths;
}

/** Slide order comes from presentation.xml's <p:sldIdLst>, resolved through
 * presentation.xml.rels — not from slide file naming, which is not
 * guaranteed to match visual order. */
async function getSlideOrder(zip) {
  const presXml = await zip.file("ppt/presentation.xml")?.async("string");
  const relsXml = await zip.file("ppt/_rels/presentation.xml.rels")?.async("string");
  if (!presXml || !relsXml) throw new PptxParseError("This file is missing required PowerPoint structure.");

  const rels = parseRelationships(relsXml);
  const order = [];
  for (const sldId of presXml.match(/<p:sldId\b[^>]*\/>/g) || []) {
    const rId = sldId.match(/r:id="([^"]*)"/)?.[1];
    if (rId && rels[rId]) order.push(rels[rId].target);
  }
  return order; // paths relative to ppt/, e.g. "slides/slide3.xml"
}

async function getNotesForSlide(zip, slidePath) {
  const slideFileName = slidePath.split("/").pop();
  const relsFile = zip.file(`ppt/slides/_rels/${slideFileName}.rels`);
  if (!relsFile) return "";

  const rels = parseRelationships(await relsFile.async("string"));
  const notesRel = Object.values(rels).find((r) => r.type.includes("notesSlide"));
  if (!notesRel) return "";

  const notesPath = normalizePath(`ppt/slides/${notesRel.target}`);
  const notesFile = zip.file(notesPath);
  if (!notesFile) return "";

  return parseNotesXml(await notesFile.async("string"));
}

/**
 * Lines that appear on most slides, which makes them chrome rather than content.
 *
 * A running header, a footer, a page number, a confidentiality notice: every
 * deck has some, and PowerPoint does not mark them as such once they are baked
 * into each slide's shapes. Our own exports are the extreme case — the studio
 * name, the deck name and the date sit in the first text shape of all of them.
 *
 * Repetition is the signal, and it needs no list of known strings, so it works
 * for a client's template as well as for ours. A page number differs per slide
 * and survives; that is what the digit rule below is for.
 *
 * @param {Array<{title: string, subtitle: string, bullets: string[]}>} slides
 * @returns {Set<string>} lower-cased lines to drop
 */
function repeatedLines(slides) {
  const boilerplate = new Set();
  // Under four slides, a line repeating twice is as likely to be a real echo.
  if (slides.length < 4) return boilerplate;

  const seen = new Map();
  for (const s of slides) {
    const lines = new Set(
      [s.title, s.subtitle, ...(s.bullets || [])]
        .map((t) => String(t || "").trim())
        .filter(Boolean)
        .map((t) => t.toLowerCase())
    );
    for (const line of lines) seen.set(line, (seen.get(line) || 0) + 1);
  }

  const threshold = Math.max(3, Math.ceil(slides.length * 0.6));
  for (const [line, count] of seen) {
    if (count >= threshold) boilerplate.add(line);
  }
  // A bare number is a page number wherever it appears, on every slide.
  for (const s of slides) {
    for (const t of [s.title, ...(s.bullets || [])]) {
      const line = String(t || "").trim();
      if (/^\d{1,3}$/.test(line)) boilerplate.add(line.toLowerCase());
    }
  }
  return boilerplate;
}

function deriveTitleFromFilename(filename) {
  if (!filename) return "";
  return filename.replace(/\.pptx$/i, "").replace(/[-_]+/g, " ").trim();
}

/** Opens a .pptx as a zip, with the decompression caps checked before anything
 * is extracted. Shared by the import and by extractSlideText below. */
async function openPptxArchive(buffer) {
  if (!buffer || buffer.length < 4 || buffer.subarray(0, 2).toString("hex") !== "504b") {
    throw new PptxParseError("This file isn't a valid .pptx (not a PowerPoint archive).");
  }

  let zip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new PptxParseError("Could not read this file as a .pptx archive.");
  }

  // Decompression caps: the 200 MB route limit bounds only the COMPRESSED
  // upload; a crafted archive can expand to gigabytes. Check the declared
  // uncompressed sizes before extracting anything.
  const entries = Object.values(zip.files);
  if (entries.length > 5_000) {
    throw new PptxParseError("This archive contains too many files to import.");
  }
  let totalUncompressed = 0;
  for (const entry of entries) {
    const size = entry?._data?.uncompressedSize || 0;
    if (size > 100 * 1024 * 1024) throw new PptxParseError("This archive contains a file too large to import.");
    totalUncompressed += size;
  }
  if (totalUncompressed > 500 * 1024 * 1024) {
    throw new PptxParseError("This archive expands to more data than can be imported.");
  }
  return zip;
}

/**
 * Every slide's text, in slide order, as plain text: "Slide N" then one line
 * per paragraph, table rows as cells joined by " | ". Used when a .pptx is
 * attached as a reference (source material) rather than imported as a deck.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractSlideText(buffer) {
  const zip = await openPptxArchive(buffer);
  const slidePaths = await getSlideOrder(zip);
  const out = [];
  for (const [i, slidePath] of slidePaths.entries()) {
    const xml = await zip.file(`ppt/${slidePath}`)?.async("string");
    if (!xml) continue;
    const lines = extractShapes(xml).flatMap((shape) => extractParagraphs(shape));
    for (const table of extractTables(xml)) lines.push(...table.map((row) => row.join(" | ")));
    if (lines.length) out.push(`Slide ${i + 1}\n${lines.join("\n")}`);
  }
  return out.join("\n\n");
}

export class PptxImportService {
  /**
   * @param {{userId, workspaceId, role}} context
   * @param {{buffer: Buffer, filename: string, imageSource?: "source"|"brand"}} params
   */
  async importPptx(context, { buffer, filename, imageSource }) {
    const zip = await openPptxArchive(buffer);

    const slidePaths = await getSlideOrder(zip);
    if (slidePaths.length === 0) throw new PptxParseError("This presentation has no slides.");

    /* Parsed in full BEFORE anything is decided, because the boilerplate can
     * only be recognised by looking across slides. */
    const parsed = [];
    const mediaCache = {};
    const parseWarnings = [];
    let sawPicture = false;
    for (let i = 0; i < slidePaths.length; i++) {
      const file = zip.file(`ppt/${slidePaths[i]}`);
      if (!file) continue;
      const slideXml = await file.async("string");
      const imageRefs = extractImageRefs(slideXml);
      if (imageRefs.length) sawPicture = true;
      parsed.push({
        index: i,
        ...parseSlideXml(slideXml),
        notes: await getNotesForSlide(zip, slidePaths[i]),
        images: await storeSlideImages(zip, slidePaths[i], slideXml, mediaCache, parseWarnings, i + 1),
        tables: extractTables(slideXml),
        charts: countCharts(slideXml),
      });
    }
    // Only relevant when there's actually a picture to (maybe) recompress —
    // a text-only deck shouldn't be told about an image pipeline it never uses.
    if (sawPicture && !(await isSharpAvailable())) {
      parseWarnings.push("Image recompression is unavailable on this machine — imported images are stored at original size.");
    }

    const boilerplate = repeatedLines(parsed);
    const strip = (line) => !boilerplate.has(String(line).trim().toLowerCase());

    const proposedMapping = [];
    for (const slide of parsed) {
      const bullets = slide.bullets.filter(strip);
      /* A title that IS boilerplate is not a title. Our own exported decks put
       * the running header in the first shape and carry no title placeholder,
       * so the fallback in parseSlideXml handed every slide "Product Studio" —
       * the studio name from the top bar — and the real heading went into the
       * body. Every slide of an imported round-trip was mistitled. */
      const ownTitle = strip(slide.title) ? slide.title : (bullets.shift() || "");
      const resolvedTitle = ownTitle || `Slide ${slide.index + 1}`;

      proposedMapping.push({
        slideNumber: slide.index + 1,
        title: resolvedTitle,
        content: {
          title: resolvedTitle,
          /* The cover slide used to keep only its first line (subtitle, or
           * else bullets[0]) and silently drop the rest — fine for an
           * ordinary title+subtitle cover, but it lost real content (e.g. a
           * grouped shape's text) whenever a cover slide carried more than
           * one extra line. When there's no real subtitle, the full bullets
           * array survives instead — every downstream reader already
           * normalizes content.body whether it's a string or an array
           * (composeSlides, buildSlidesFromMapping), so this costs nothing
           * there and only stops text from being lost here. */
          body: slide.index === 0
            ? ((strip(slide.subtitle) && slide.subtitle) ? [slide.subtitle] : bullets)
            : bullets,
          notes: slide.notes,
          images: slide.images,
          tables: slide.tables,
        },
        elements: {
          images: slide.images.length,
          tables: slide.tables.length,
          charts: slide.charts,
          bullets: bullets.length,
        },
      });
    }

    if (proposedMapping.length === 0) throw new PptxParseError("Could not read any slides from this file.");

    /* The deck's OWN title first, the filename only as a fallback.
     *
     * The filename won before, so a round-tripped export came back named
     * "deck" — and because the deck title is copied into meta.name, "deck" was
     * then printed in the top bar of all nine slides and shown as the deck's
     * name in the library. A file is called whatever it was saved as; the title
     * slide is what the deck is actually called. */
    const fromCover = String(proposedMapping[0]?.title || "").trim();
    const fromFile = deriveTitleFromFilename(filename);
    // "Slide 1" is parseSlideXml's own placeholder, not a title.
    const coverIsReal = fromCover && !/^slide \d+$/i.test(fromCover);
    const title = (coverIsReal && fromCover) || fromFile || "Imported presentation";

    /* Import stops here and hands the outline to the generation pipeline,
     * rather than composing inline and returning a finished deck.
     *
     * An imported deck needs the same art direction as a generated one —
     * PowerPoint gives text with no layout intent, so without composition every
     * import landed as a cover plus N identical text slides. But composing 16
     * slides measured 260-286 seconds inside this one request, and the browser
     * aborts at 150: the import "failed" for the user while the server finished
     * and created the deck anyway.
     *
     * Parsing is the fast part (seconds) and stays here. Everything after it is
     * exactly what approving a prompt-generated outline already does, so an
     * import now becomes a Generation the caller approves and polls — one
     * asynchronous path for both ways of creating a deck, instead of two. */
    const record = await generationRepository.insert({
      workspaceId: context.workspaceId,
      userId: context.userId,
      prompt: `Imported from ${filename || "a PowerPoint file"}`,
      origin: "import",
      imageSource,
    });

    return generationRepository.updateStatus(record.id, {
      status: "completed",
      proposedMapping,
      output: { title, slides: proposedMapping, warnings: parseWarnings },
    });
  }
}

export const pptxImportService = new PptxImportService();
