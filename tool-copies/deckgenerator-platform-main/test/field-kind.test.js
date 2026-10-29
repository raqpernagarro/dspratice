// test/field-kind.test.js
// =============================================================================
// The client and the server must agree about what type a schema field is.
//
// They used to hold two copies of the same regexes, each with a comment saying
// the other must be kept in step. They were not: `string[3]` matched in the
// editor but not on the server, so a real array was joined into one
// newline-separated string, and templates calling `cols.slice(0,3).map(...)`
// threw "map is not a function" — a hard render failure that reached the deck
// as a blank slide.
//
// There is one definition now (js/field-kind.js). These tests hold the line on
// that: the two exports must resolve to the same underlying answer, and every
// phrasing the real template library actually uses must classify.
// =============================================================================
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { fieldKind, editorFieldKind } from "../js/field-kind.js";
import { fieldKind as domainFieldKind } from "../product/domain/slide-content.js";
import { allTemplates } from "../js/templates/index.js";
import { editableFields, fieldLabel, fieldHelp, structuredKeys } from "../product/ui/lib/slide-fields.js";

const EQUIVALENT = { objectArray: "structured", stringArray: "list", string: "text" };

describe("one definition, two vocabularies", () => {
  test("the domain re-exports the shared function, not a copy of it", () => {
    assert.equal(domainFieldKind, fieldKind,
      "product/domain/slide-content.js must re-export js/field-kind.js, not reimplement it");
  });

  test("the editor's labels map exactly onto the server's", () => {
    for (const t of allTemplates) {
      for (const [field, description] of Object.entries(t.schema || {})) {
        assert.equal(
          editorFieldKind(description), EQUIVALENT[fieldKind(description)],
          `${t.name}.${field} (${JSON.stringify(description)}) classifies differently on each side`
        );
      }
    }
  });
});

describe("the phrasings the library actually uses", () => {
  const CASES = [
    ["string", "string"],
    ["string — photo path", "string"],
    ["string[]", "stringArray"],
    ["string[3]", "stringArray"],
    ["string[3] — bold column titles", "stringArray"],
    ["string []", "stringArray"],
    ["array of strings", "stringArray"],
    ["array<string>", "stringArray"],
    ["array of 3 strings", "stringArray"],
    ["string[][]", "objectArray"],
    ["{ title, body }", "objectArray"],
    ["{ studio, name, page }", "objectArray"],
    ["array of { label, value }", "objectArray"],
    ["array<{ a, b }>", "objectArray"],
    ["object", "objectArray"],
    ["array of up to 2 paragraphs", "objectArray"],
  ];

  for (const [description, expected] of CASES) {
    test(`${JSON.stringify(description)} is ${expected}`, () => {
      assert.equal(fieldKind(description), expected);
    });
  }

  test("a sized string list is never plain text", () => {
    // The exact regression: falling through to "string" here is what joined
    // arrays into prose and broke every comparison table.
    for (const d of ["string[2]", "string[3]", "string[4]", "string[10]"]) {
      assert.equal(fieldKind(d), "stringArray", `${d} must be a list`);
    }
  });

  test("a single object is structured, not a list", () => {
    // The other half of the same class of bug: treating "{ title, body }" as
    // an array meant the field was dropped, and the merge fell back to the
    // template's lorem-ipsum example.
    assert.equal(fieldKind("{ title, body }"), "objectArray");
  });
});

describe("every field in the real library classifies", () => {
  test("no schema description falls through unrecognised", () => {
    const kinds = new Set();
    let fields = 0;
    for (const t of allTemplates) {
      for (const description of Object.values(t.schema || {})) {
        kinds.add(fieldKind(description));
        fields++;
      }
    }
    assert.ok(fields > 1000, `expected the whole library, saw ${fields} fields`);
    for (const k of kinds) {
      assert.ok(["objectArray", "stringArray", "string"].includes(k), `unexpected kind ${k}`);
    }
  });
});

describe("the editor's own callers actually run", () => {
  /* The regression this guards is subtle and was invisible. slide-fields.js
   * exported the shared function with `export { editorFieldKind as fieldKind }`
   * — an export ALIAS, which creates no local binding. Every internal call to
   * fieldKind() in that file then threw "fieldKind is not defined", but only
   * when editableFields() actually ran, which is during the editor's canvas
   * render. node --check passed. A test that imported the export passed. The
   * editor just drew an empty canvas, with nothing in the console.
   *
   * So: call what the editor calls, over the real library. */
  test("editableFields runs for every template in the library", () => {
    for (const t of allTemplates) {
      const fields = editableFields(t.schema || {});
      assert.ok(Array.isArray(fields), `${t.name}: editableFields did not return a list`);
    }
  });

  test("the other exported helpers run too", () => {
    const t = allTemplates.find((x) => x.name === "core/cover-single") || allTemplates[0];
    for (const [key, description] of Object.entries(t.schema || {})) {
      assert.equal(typeof fieldLabel(key, description), "string");
      assert.equal(typeof fieldHelp(key, description), "string");
      assert.ok(structuredKeys(description) === null || Array.isArray(structuredKeys(description)));
    }
  });

  test("a structured field reports its keys to the editor", () => {
    const withObject = allTemplates.find((t) =>
      Object.values(t.schema || {}).some((d) => /^\{/.test(String(d).trim())));
    assert.ok(withObject, "the library should have a single-object field");
    const [, description] = Object.entries(withObject.schema)
      .find(([, d]) => /^\{/.test(String(d).trim()));
    assert.equal(editorFieldKind(description), "structured");
  });
});
