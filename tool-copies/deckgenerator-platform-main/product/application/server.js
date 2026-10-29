#!/usr/bin/env node
// =============================================================================
// Backend API server — Milestone M3, Application Layer (Phase 2.5 §02).
// Authentication mounted at Milestone M4.
//
// Owns the HTTP server, routing, and Gateway orchestration — AND the static
// files. It used to serve only /api/*, with python serve.py hosting the pages
// on a second port; that was two ports and an origin to get right before
// anything rendered, and the main reason a copy handed to someone else did not
// simply run. One server, one origin, one command now.
//
// Run: npm start
// =============================================================================
import express from "express";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { presentationsRouter } from "./routes/presentations.js";
import { authRouter } from "./routes/auth.js";
import { templatesRouter } from "./routes/templates.js";
import { exportsRouter, getLatestExport } from "./routes/exports.js";
import { generationsRouter } from "./routes/generations.js";
import { briefsRouter } from "./routes/briefs.js";
import { editorAiRouter } from "./routes/editor-ai.js";
import { referencesRouter } from "./routes/references.js";
import { startRecoverySweep } from "./gateway/export-gateway.js";
import { getDeckDefinition } from "./gateway/engine-gateway.js";
import { sessionMiddleware } from "./middleware/session.js";
import { requireAuth } from "./middleware/authorization.js";
import { execSync } from "node:child_process";

/** Read once, at boot — that is the whole point: it must not follow the repo. */
const BOOT_TIME = new Date().toISOString();
const BOOT_COMMIT = (() => {
  try { return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(); }
  catch { return null; } // not a checkout (a packaged copy) — nothing to compare
})();
import { config, warnIfInsecure } from "../infrastructure/config.js";
import { ensureFirstRunWorkspace } from "./first-run.js";
import { releaseStrandedApprovals } from "../domain/generation-service.js";
import { ensureUserData, backupUserData, UPLOADS_DIR, USER_DATA_ROOT } from "../infrastructure/user-data.js";

// Before anything touches disk: create the user-data directories and, on the
// first launch after they moved out of the app folder, copy existing work
// across. Synchronous and at module scope deliberately — every repository
// resolves its paths at import time, so this cannot wait for listen().
const userData = ensureUserData();

const app = express();
// Pasted reference text is capped at 60,000 characters AFTER it arrives (and
// truncated, not refused), so its route takes a larger body than the 100kb
// default every other JSON route keeps.
const json = express.json();
const referenceTextJson = express.json({ limit: "2mb" });
app.use((req, res, next) => (req.path === "/api/references/text" ? referenceTextJson : json)(req, res, next));

// Malformed-JSON guard (Technical Blueprint Rule 25: "a raw, unclassified
// exception never crosses the Application Layer boundary"). Without this,
// express.json()'s own SyntaxError reaches Express's default error handler,
// which returns an HTML page containing the full stack trace and absolute
// server file paths. body-parser tags this specific failure with
// `type: "entity.parse.failed"` (see node_modules/body-parser/lib/read.js)
// — the same targeted check Express's own error-handling guide documents —
// so only a genuine malformed-body request is caught here; anything else is
// forwarded to `next(err)` unchanged, matching every other error's normal
// path. Uses the identical `{ error: message }` envelope every route file's
// own local `sendError` already sends (Decision D of M3), so a client sees
// the same shape it already handles.
app.use((err, _req, res, next) => {
  if (err?.type !== "entity.parse.failed") return next(err);
  res.status(400).json({ error: "Request body must be valid JSON." });
});

// Same targeted-check pattern as the guard above, for the raw()-bodied
// upload routes (import, media). body-parser tags an over-limit body with
// `type: "entity.too.large"` — without this it falls through to the
// generic 500 handler below, which is misleading for a request the client
// could fix simply by picking a smaller file.
app.use((err, _req, res, next) => {
  if (err?.type !== "entity.too.large") return next(err);
  res.status(413).json({ error: "File is too large." });
});

// Decision I: once the session travels as a cookie, CORS must name an
// explicit origin — "*" is invalid alongside Allow-Credentials, and the
// browser will refuse the request outright. The frontend Engine Gateway is
// served by serve.py on a different port, so it is a genuine cross-origin
// caller. Hand-written, no new dependency (Decision A of M3).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.set("Vary", "Origin");

  // This server now hosts the UI as well, so the ordinary case is a SAME-origin
  // request — and "same origin" is whatever host the page was actually served
  // from, which varies (the launcher picks a free port). Comparing only against
  // the configured ALLOWED_ORIGIN rejected every write from the app itself with
  // "Origin not allowed." the moment it ran on any port but 4599.
  //
  // Deriving it from the request rather than from config is not a loosening:
  // an attacker's page carries ITS own origin in the header, never ours, so a
  // cross-site write still fails. It is the same check, just correctly aware
  // that the app and the API are one server.
  const selfOrigin = `${req.protocol}://${req.headers.host}`;
  const isAllowed = !!origin && (origin === selfOrigin || origin === config.allowedOrigin);

  // Only echo the origin when it is genuinely allowed — a fixed reflected
  // value would grant credentialed access to any caller.
  if (isAllowed) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "600");
    // M6 decision D: the list endpoint's total count (M3) is otherwise
    // invisible to the cross-origin fetch() the UI must make.
    res.set("Access-Control-Expose-Headers", "X-Total-Count");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  // Cross-site write protection: state-changing requests from a browser
  // context must carry an allowed Origin (non-browser callers send none).
  if (origin && !isAllowed && req.method !== "GET") {
    return res.status(403).json({ error: "Origin not allowed." });
  }
  next();
});

// Resolves req.context from the session cookie for every request. Additive:
// it rejects nothing on its own — each route decides via requireAuth().
app.use(sessionMiddleware());

app.use("/api/auth", authRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/presentations", presentationsRouter);
app.use("/api/presentations", editorAiRouter);
app.get("/api/presentations/:id/deck", requireAuth(), getDeckDefinition);
app.use("/api/exports", exportsRouter);
app.get("/api/presentations/:id/exports/latest", requireAuth(), getLatestExport);
app.use("/api/generations", generationsRouter);
app.use("/api/briefs", briefsRouter);
app.use("/api/references", referencesRouter);

/* ---- Static hosting --------------------------------------------------------
 * The app used to need TWO servers: python serve.py for the files and this
 * one for the API, wired together by an ALLOWED_ORIGIN. That is three things
 * to get right (two ports and an origin) before anything renders, and it is
 * the main reason a copy handed to someone else did not just run. Serving the
 * files from here as well makes the whole product a single `npm start` on a
 * single origin — which also removes CORS from the picture entirely, because
 * the page and the API are now the same origin.
 *
 * Mounted AFTER /api so a route can never be shadowed by a file, and BEFORE
 * the 404 handler so unmatched paths still fall through to it.
 *
 * no-store because this doubles as the development server: without it the
 * browser caches ES modules and CSS, and edits appear not to take effect
 * (the exact trap serve.py was written to avoid). */
// Uploaded images live outside the app folder now, but stored slide content
// still references them as "assets/uploads/<id>.jpg". Mounting the user
// uploads directory at that exact path — ahead of the repo tree below — keeps
// every existing reference valid while the files themselves sit somewhere an
// app update cannot delete.
app.use("/assets/uploads", express.static(UPLOADS_DIR, {
  etag: false,
  lastModified: false,
  setHeaders(res) { res.set("Cache-Control", "no-store"); },
}));

const noStore = {
  etag: false,
  lastModified: false,
  setHeaders(res) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  },
};

/* The product's own pages are served AT THE ROOT, ahead of the repo tree.
 *
 * They used to be reachable only at /product/ui/editor.html — an internal
 * directory layout leaking into every URL a person sees, copies or bookmarks,
 * and /editor.html (the obvious guess, and what the pages' own relative links
 * imply) returned 404. Now /, /editor.html, /templates.html and the rest are
 * the real addresses.
 *
 * This is safe because the two trees do not overlap: product/ui holds only its
 * own pages, app.css, lib/ and editor-ai/, while css/, js/, assets/ and fonts/
 * exist solely at the repo root, so engine requests fall straight through to
 * the mount below. index.html is the one shared name, and the product winning
 * it is the point — the root copy is a redirect to exactly this page.
 *
 * The repo mount still serves /product/ui/* too, so old links keep working. */
const UI_ROOT = fileURLToPath(new URL("../ui/", import.meta.url));
app.use(express.static(UI_ROOT, { index: "index.html", ...noStore }));

/* Everything else is served from an EXPLICIT ALLOW-LIST, never from the repo
 * root.
 *
 * This used to be `express.static(repoRoot)`, which published the whole
 * checkout: a request for /product/infrastructure/identity/store/credentials.json
 * returned the account's salt and password hash, /product/data/sessions.json
 * returned live session tokens, and /.git/* was complete enough to reconstruct
 * the source history. No session was needed for any of it, and because the
 * server binds to loopback only as of this change, the reach was every host on
 * the network. product/.gitignore says the credentials file "must never be
 * committed under any circumstances" — serving it over HTTP defeated that
 * entirely.
 *
 * An allow-list rather than a deny-list, deliberately: a new secret added to
 * the repo tomorrow is unreachable by default, whereas a deny-list only
 * protects the paths someone remembered to name. */
const STATIC_ROOT = fileURLToPath(new URL("../../", import.meta.url));

// The engine tree the slide templates need. `assets/uploads` is already mounted
// above, so user uploads keep resolving from the user-data directory.
for (const dir of ["css", "js", "assets", "fonts"]) {
  app.use(`/${dir}`, express.static(join(STATIC_ROOT, dir), noStore));
}

/* ---- what code is actually running ------------------------------------------
 * Ten decks were generated against this server to test the engine, and every
 * conclusion drawn from them was wrong: the process had been up since before
 * six waves of fixes, so it was still composing with the old domain modules.
 * Static assets are served no-store and were fresh, which made the staleness
 * invisible — the slides looked current because their CSS was.
 *
 * Node loads a module once per process. Any change under product/domain needs a
 * restart, and nothing said so. This endpoint reports the commit the process
 * booted from, so a tool can refuse to run against a server older than the code
 * it is meant to be testing. */
app.get("/api/meta", (_req, res) => {
  res.json({ commit: BOOT_COMMIT, startedAt: BOOT_TIME });
});

// The viewer gateway the product embeds as an iframe (render.html?id=&slide=).
// Served as a single named file — the repo root itself is never a static mount.
app.get("/render.html", (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.sendFile(join(STATIC_ROOT, "render.html"));
});

// The exporter's capture surface. Playwright drives this over HTTP, so it has
// to be reachable — but only these two files, not the rest of product/.
app.use("/product/export-runtime", express.static(
  fileURLToPath(new URL("../export-runtime/", import.meta.url)),
  { index: false, ...noStore }
));

// Legacy path for the product's own pages, kept so older links and bookmarks
// still resolve now that the real URLs are at the root.
app.use("/product/ui", express.static(UI_ROOT, { index: "index.html", ...noStore }));

// Terminal handlers — Express 4 does not catch rejected promises from async
// route handlers on its own; without these a thrown error hangs the request.
app.use((req, res) => {
  // A missing API route is a JSON 404; a missing file is an HTML one. Sending
  // JSON for a mistyped page URL would render as raw text in the browser.
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found." });
  res.status(404).type("html").send('<p>Not found. <a href="/">Go to the studio</a></p>');
});
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("Unhandled route error:", err);
  if (!res.headersSent) res.status(500).json({ error: "Something went wrong on the server." });
});

/* Loopback ONLY.
 *
 * `app.listen(port)` alone binds 0.0.0.0, which put this on every network
 * interface. That is the wrong default for a local-first desktop tool in two
 * ways: it published the static tree to the whole network (see the allow-list
 * above), and local auto-login resolves any sessionless request to the first
 * workspace's first member — an admin — so a peer got write access to the API
 * as well. Binding here means both of those stop at this machine.
 *
 * NPS_HOST exists for the deliberate case (a colleague demoing to a room from
 * their own laptop). It is opt-in, and warnIfInsecure() calls out the risk. */
const HOST = process.env.NPS_HOST || "127.0.0.1";

/* This process holds real state in memory: the export queue and its
 * cancellation set, the login throttle counters, the CLI concurrency slots. A
 * rejection outside an Express handler — a background task, a failed rename in
 * a recovery sweep — would tear all of that down with no explanation, and on a
 * desktop tool the window simply disappears.
 *
 * An unhandled REJECTION is logged and survived: it is almost always one
 * request's problem, and killing everyone else's work over it is worse than
 * carrying on. An uncaught EXCEPTION means the process is in an unknown state,
 * so it is logged and then allowed to exit — but visibly, with a line saying
 * what happened, instead of vanishing. */
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection (the studio is still running):", reason);
});
process.on("uncaughtException", (err) => {
  console.error("\nThe studio hit an unrecoverable error and has to stop:");
  console.error(err?.stack || err);
  process.exit(1);
});

app.listen(config.port, HOST, async () => {
  console.log(`\nNagarro Presentation Studio`);
  console.log(`  http://localhost:${config.port}`);
  console.log(`  Your work: ${USER_DATA_ROOT}`);
  if (userData.reclaimed.length) {
    console.log(`  Brought your ${userData.reclaimed.join(", ")} back into the app folder.`);
  }
  // A fresh install has no workspace, so local auto-login would resolve to
  // nobody and every request 401 — see product/application/first-run.js.
  try {
    const created = await ensureFirstRunWorkspace();
    if (created) console.log(`  First run: created workspace "${created.workspace}"`);
  } catch (err) {
    console.error("  First-run setup failed:", err.message);
  }
  // One snapshot a day of the only thing here that cannot be regenerated.
  const backup = backupUserData();
  if (backup.created) console.log(`  Backed up ${backup.files} data file(s) for today.`);

  // A crash between claiming an approval and finishing it leaves the record
  // reading "approving" with nobody left to move it. Nothing else clears those.
  try {
    const released = await releaseStrandedApprovals();
    if (released) console.log(`  Released ${released} approval(s) or draft(s) interrupted by a previous stop.`);
  } catch (err) {
    console.error("  Could not release interrupted approvals:", err.message);
  }

  warnIfInsecure();
  // WP8: activates the crash-recovery sweep built and approved in the WP4
  // corrections (Technical Blueprint §09 Recovery: "a crashed worker's
  // in-flight Job is requeued via a heartbeat/timeout sweep") — the sweep
  // logic itself is untouched; this is its only call site anywhere in the
  // codebase. Default interval/timeout (60s / 5min), unchanged.
  startRecoverySweep();
});
