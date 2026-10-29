import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the import route accepts uploads to 200mb", async () => {
  const src = await readFile("product/application/routes/presentations.js", "utf8");
  const limit = src.match(/post\("\/import",\s*raw\(\{[^}]*limit:\s*"([^"]+)"/)?.[1];
  assert.equal(limit, "200mb");
});

test("both upload UIs pre-check the file size before posting", async () => {
  for (const path of ["product/ui/home.js", "product/ui/presentations.js"]) {
    const src = await readFile(path, "utf8");
    assert.match(
      src,
      /MAX_IMPORT_BYTES\s*=\s*200 \* 1024 \* 1024/,
      `${path} must gate on a 200MB MAX_IMPORT_BYTES`
    );
  }
});
