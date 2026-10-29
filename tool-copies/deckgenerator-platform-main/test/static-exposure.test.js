// test/static-exposure.test.js
// =============================================================================
// The highest-value test in this repo.
//
// The server used to serve the whole checkout as static files. A plain GET —
// no session, from any machine on the network — returned the account's salt and
// password hash, live session tokens, every presentation, and enough of .git to
// reconstruct the source history.
//
// These tests fail if that ever comes back, by name and by class:
//   - the specific files that were exposed,
//   - and the general shape (anything under product/ that isn't the two
//     surfaces the browser genuinely needs).
// =============================================================================
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers/server.js";

let server;
before(async () => { server = await startTestServer(); });
after(async () => { await server?.stop(); });

const get = (path) => fetch(`${server.origin}${path}`, { redirect: "manual" });

describe("secrets are not reachable over HTTP", () => {
  const MUST_NOT_BE_SERVED = [
    "/product/infrastructure/identity/store/credentials.json",
    "/product/data/users.json",
    "/product/data/sessions.json",
    "/product/data/presentations.json",
    "/product/data/generations.json",
    "/product/infrastructure/config.js",
    "/product/application/server.js",
    "/product/domain/generation-service.js",
    "/.git/config",
    "/.git/HEAD",
    "/.git/index",
    "/package.json",
    "/CLAUDE.md",
  ];

  for (const path of MUST_NOT_BE_SERVED) {
    test(`404s ${path}`, async () => {
      const res = await get(path);
      assert.equal(res.status, 404, `${path} must not be served (got ${res.status})`);
    });
  }

  test("no path under product/ leaks a secret, whatever the traversal", async () => {
    // Encoded and traversal forms of the same target — express normalises these,
    // but asserting it means a future mount change can't quietly reopen them.
    const sneaky = [
      "/product/infrastructure/identity/store/../store/credentials.json",
      "/product%2Fdata%2Fusers.json",
      "/css/../product/data/users.json",
      "/assets/../product/data/sessions.json",
      "/product/ui/../data/users.json",
      "/product/export-runtime/../data/users.json",
    ];
    for (const path of sneaky) {
      const res = await get(path);
      assert.notEqual(res.status, 200, `${path} returned 200`);
    }
  });

  test("a secret is not merely empty — the body never contains a password hash", async () => {
    const res = await get("/product/infrastructure/identity/store/credentials.json");
    const body = await res.text();
    assert.doesNotMatch(body, /passwordHash/, "credential fields appeared in a response body");
  });
});

describe("what the browser genuinely needs still resolves", () => {
  const MUST_BE_SERVED = [
    "/",                                        // product home
    "/editor.html",
    "/templates.html",
    "/presentations.html",
    "/present.html",
    "/login.html",
    "/render.html",                             // viewer gateway the editor embeds
    "/css/tokens.css",
    "/css/primitives.css",
    "/js/templates/index.js",
    "/js/components.js",
    "/product/ui/editor.html",                  // legacy path, kept working
    "/product/export-runtime/capture.html",     // the exporter drives this
  ];

  for (const path of MUST_BE_SERVED) {
    test(`serves ${path}`, async () => {
      const res = await get(path);
      assert.equal(res.status, 200, `${path} should be served (got ${res.status})`);
    });
  }

  test("the API is not shadowed by the static mounts", async () => {
    assert.equal((await get("/api/presentations")).status, 200);
    assert.equal((await get("/api/definitely-not-a-route")).status, 404);
  });
});

describe("the server does not listen beyond this machine", () => {
  test("binds loopback, not every interface", async () => {
    // Asking the OS directly is the only honest check: a request to 127.0.0.1
    // succeeds either way. If this ever binds 0.0.0.0 again, the static
    // allow-list above becomes the only thing standing between a network peer
    // and the app — and auto-login makes that peer an admin.
    const { execFileSync } = await import("node:child_process");
    let out = "";
    try {
      out = execFileSync("lsof", ["-nP", "-iTCP:" + server.port, "-sTCP:LISTEN"], { encoding: "utf8" });
    } catch {
      return; // lsof unavailable (CI container) — the HTTP assertions still stand
    }
    assert.doesNotMatch(out, /\*:\d+ \(LISTEN\)/, `server is bound to all interfaces:\n${out}`);
    assert.match(out, /127\.0\.0\.1:|localhost:/, `expected a loopback bind:\n${out}`);
  });
});
