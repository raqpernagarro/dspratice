// test/photo-selection.test.js
// =============================================================================
// Photographs are chosen for the slide, not inherited from the template.
//
// The library ships 208 captioned photographs. None of them was ever used:
// composition locked every image to whatever its template's example happened to
// show, so about 23 photos appeared in every deck regardless of subject, and
// the rest were dead weight in the repository.
//
// Two constraints must never be traded away, because breaking either produces a
// visibly broken slide rather than a merely worse one: `text_safe` where type
// sits over the image, and never inventing a path that is not on disk.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { choosePhotos, photoCount } from "../product/domain/photo-selection.js";
import { contentSignature } from "../product/domain/content-signature.js";
import { allTemplates } from "../js/templates/index.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const manifest = JSON.parse(readFileSync(new URL("../assets/photography/manifest.json", import.meta.url), "utf8"));
const rows = Array.isArray(manifest) ? manifest : manifest.photos || Object.values(manifest);
const byFile = new Map(rows.map((r) => [r.file, r]));

/* `media` is an ARRAY on the template modules (["photo"]), not a string. */
const photoTemplate = (min = 3) =>
  allTemplates.find((t) => (t.slots?.images || 0) >= min && (t.media || []).includes("photo"));

const sigFor = (text, over = {}) => ({ ...contentSignature({ title: text, bullets: [] }, { index: 2, total: 9 }), ...over });

describe("the whole manifest is available", () => {
  test("all 208 photographs are on disk", () => {
    assert.ok(photoCount() > 200, `only ${photoCount()} photographs loaded`);
    for (const r of rows) {
      assert.ok(existsSync(new URL(`../assets/photography/${r.file}`, import.meta.url)),
        `${r.file} is in the manifest but not on disk`);
    }
  });
});

describe("what gets chosen", () => {
  test("only real files, never an invented path", () => {
    const t = photoTemplate();
    const picks = choosePhotos({ template: t, signature: sigFor("A workshop with the client team"), text: "A workshop with the client team", used: new Set() });
    assert.ok(picks.length > 0);
    for (const p of picks) {
      assert.match(p, /^assets\/photography\//);
      assert.ok(existsSync(new URL(`../${p}`, import.meta.url)), `${p} does not exist`);
    }
  });

  test("as many as the template has slots, and no duplicates within a slide", () => {
    const t = photoTemplate(3);
    const picks = choosePhotos({ template: t, signature: sigFor("Our delivery team"), text: "Our delivery team", used: new Set() });
    assert.equal(picks.length, Math.min(t.slots.images, picks.length));
    assert.equal(new Set(picks).size, picks.length, "the same photo appeared twice on one slide");
  });

  test("a template with no image slots gets none", () => {
    const t = allTemplates.find((x) => !(x.slots?.images));
    assert.deepEqual(choosePhotos({ template: t, signature: sigFor("Anything"), text: "Anything", used: new Set() }), []);
  });

  test("type over an image only ever lands on a text-safe photograph", () => {
    // Relaxing this produces illegible overlaid type — image-filter.js treats it
    // as a correctness constraint, not a preference, and so does this.
    const t = photoTemplate(1);
    const picks = choosePhotos({
      template: t, signature: sigFor("Modernising claims"), text: "Modernising claims",
      used: new Set(), textSafe: true,
    });
    for (const p of picks) {
      const meta = byFile.get(p.split("/").pop());
      assert.equal(meta?.text_safe, true, `${p} is not text_safe but type will sit over it`);
    }
  });
});

describe("choice actually follows the content", () => {
  const describeOf = (p) => (byFile.get(p.split("/").pop())?.description || "").toLowerCase();

  test("different subjects get different photographs", () => {
    const t = photoTemplate(2);
    const a = choosePhotos({ template: t, signature: sigFor("A collaborative design workshop at the whiteboard"), text: "A collaborative design workshop at the whiteboard", used: new Set() });
    const b = choosePhotos({ template: t, signature: sigFor("Celebrating the go-live with the whole team"), text: "Celebrating the go-live with the whole team", used: new Set() });
    assert.notDeepEqual(a, b, "two very different slides got identical photography");
  });

  test("a workshop slide reaches a workshop photograph", () => {
    const t = photoTemplate(2);
    const text = "A collaborative design workshop with the client team at the whiteboard";
    const picks = choosePhotos({ template: t, signature: sigFor(text), text, used: new Set() });
    const joined = picks.map(describeOf).join(" ");
    assert.match(joined, /workshop|whiteboard|sticky|meeting/,
      `expected a workshop scene, got: ${picks.map(describeOf).map((d) => d.slice(0, 50)).join(" | ")}`);
  });

  test("the same slide always gets the same photographs", () => {
    // Deterministic on purpose: regenerating a deck should not reshuffle its
    // imagery, and a test that cannot rely on this cannot assert anything.
    const t = photoTemplate(2);
    const text = "Engineers reviewing the platform together";
    const once = choosePhotos({ template: t, signature: sigFor(text), text, used: new Set() });
    const twice = choosePhotos({ template: t, signature: sigFor(text), text, used: new Set() });
    assert.deepEqual(once, twice);
  });

  test("photographs already used in the deck are avoided", () => {
    const t = photoTemplate(2);
    const text = "A collaborative design workshop at the whiteboard";
    const first = choosePhotos({ template: t, signature: sigFor(text), text, used: new Set() });
    const used = new Set(first);
    const second = choosePhotos({ template: t, signature: sigFor(text), text, used });
    assert.equal(second.filter((p) => used.has(p)).length, 0,
      "a photograph already used in this deck was chosen again for identical content");
  });
});

describe("a deck reaches beyond the handful the examples used", () => {
  test("a varied deck draws on many photographs", () => {
    const t = photoTemplate(2);
    const used = new Set();
    const slides = [
      "Where claims stand today across the estate",
      "A collaborative design workshop with the client",
      "Engineers reviewing code in the delivery centre",
      "Celebrating the go-live with the whole team",
      "Our leadership team and their responsibilities",
      "The office and how we work day to day",
    ];
    for (const text of slides) {
      for (const p of choosePhotos({ template: t, signature: sigFor(text), text, used })) used.add(p);
    }
    assert.ok(used.size >= 8,
      `six photo slides should reach a good spread of the library, got ${used.size}`);
  });
});

describe("a celebratory photograph does not illustrate a grave slide", () => {
  /* The library is 208 pictures of Nagarro life — high-fives, laughter,
   * bicycles — and nothing in it is sombre. A board slide quoting a clinical
   * director on patients whose surgery is cancelled on the morning came back
   * illustrated with two colleagues high-fiving in a corridor. Nothing was
   * broken; it simply read as tone-deaf, which in that room is worse. */
  const QUOTE = "What they said We cancel patients on the morning of surgery because a bed " +
    "went to an emergency overnight. That is not a clinical failure — it is a design failure.";
  const template = allTemplates.find((t) => t.name === "core/quote-split-photo");

  const toneOf = (path) => {
    const file = path.split("/").pop();
    const entry = (manifest.photos || manifest).find((p) => p.file === file);
    return `${entry?.tone || ""} ${(entry?.tags || []).join(" ")}`;
  };

  test("the grave reading changes which photograph is chosen", () => {
    const cheerful = choosePhotos({ template, signature: { isGrave: false }, text: QUOTE, used: new Set() });
    const sober = choosePhotos({ template, signature: { isGrave: true }, text: QUOTE, used: new Set() });
    assert.notEqual(sober[0], cheerful[0], "the guard must actually move the choice");
    assert.match(toneOf(cheerful[0]), /playful|celebration|high-five/i,
      "this test is pointless unless the ungarded pick really is the celebratory one");
    assert.doesNotMatch(toneOf(sober[0]), /playful|celebrat|high-five|laugh|exuberant|joyful/i,
      `a grave slide was still given ${sober[0]}`);
  });

  test("the language of cancellation and failure is what marks it", () => {
    const grave = (text) => contentSignature({ title: "A slide", bullets: [text] }, { index: 1, total: 5 }).isGrave;
    assert.equal(grave("Cases are cancelled on the day because beds are unavailable."), true);
    assert.equal(grave("Eleven vacancies across the anaesthetic rota."), true);
    assert.equal(grave("We opened three new studios and grew the team by a fifth."), false);
  });

  test("a grave slide still gets a photograph rather than none", () => {
    const picks = choosePhotos({ template, signature: { isGrave: true }, text: QUOTE, used: new Set() });
    assert.equal(picks.length, 1, "demotion must never empty the pool");
  });
});
