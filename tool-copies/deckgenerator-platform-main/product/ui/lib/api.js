// =============================================================================
// API client — Milestone M5, UI Layer.
//
// Phase 2.5 §03: the UI Layer calls the Application Layer and nothing else.
// Every network call the product UI makes goes through this module, so that
// rule is checkable in one place.
//
// credentials: "include" on every request — the session is an HTTP-only
// cookie (M4, Decision A) and the UI is served cross-origin from the API
// (4599 vs 4600), so the cookie is only sent when explicitly requested.
// =============================================================================
// Same origin by default: the server now hosts the UI as well as /api, so a
// relative base is correct however it was started — any port, any hostname,
// no configuration. This used to hard-code http://localhost:4600, which meant
// a copy started on a different port silently failed every request with
// "Can't reach the server".
//
// Still overridable via <meta name="api-base" content="..."> for the split
// setup where the files are served by something else (serve.py) and the API
// lives on its own port.
const API_BASE = document.querySelector('meta[name="api-base"]')?.content ?? "";

export class ApiError extends Error {
  /* `body` carries the rest of the error payload. Routes send more than a
   * message when it is actionable — a 409 on approve returns the id of the
   * presentation that already exists, which is the difference between the
   * caller opening that deck and dead-ending on the conflict. */
  constructor(status, message, body = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    if (body && typeof body === "object") {
      if (body.code) this.code = body.code;
      if (body.presentationId) this.presentationId = body.presentationId;
    }
  }
}

// Long enough for the slowest legitimate call (AI assist spawns a local
// model run); a hung request must never leave buttons disabled forever.
const REQUEST_TIMEOUT_MS = 150_000;

async function rawRequest(method, path, body, signal) {
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      // An externally supplied signal (e.g. a Cancel button) is combined with
      // the request timeout so either one aborts the fetch; AbortSignal.any
      // is available in every browser this app targets.
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]) : AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // A caller-initiated cancel (Cancel button) must surface as an
    // AbortError, not be flattened into the generic network ApiError — the
    // caller distinguishes "cancelled" from "failed".
    if (err?.name === "AbortError" && signal?.aborted) throw err;
    // Phase 3 §11, Network category.
    throw new ApiError(0, err?.name === "TimeoutError"
      ? "The server is taking too long to respond. Try again."
      : "Connection lost. Check that the API is running.");
  }

  if (res.status === 204) return { payload: null, res };

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* an empty or non-JSON body is handled by the status check below */
  }

  if (!res.ok) {
    throw new ApiError(res.status, payload?.error || "Something went wrong.", payload);
  }
  return { payload, res };
}

async function request(method, path, body, signal) {
  const { payload } = await rawRequest(method, path, body, signal);
  return payload;
}

/** `new URLSearchParams({ x: undefined })` stringifies to the literal text
 * "undefined", not an omitted key — every caller that passes an optional
 * filter (search, status, ...) needs those keys dropped, not stringified. */
function toQueryString(params) {
  const defined = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  );
  return new URLSearchParams(defined).toString();
}

export const api = {
  login: (email, password) => request("POST", "/api/auth/login", { email, password }),
  logout: () => request("POST", "/api/auth/logout"),
  session: () => request("GET", "/api/auth/session"),

  /** `params` defaults to none — Home's existing `api.listTemplates()` call
   * (no filters) keeps working unchanged. Milestone M8 adds category/search. */
  listTemplates: (params = {}) => {
    const query = toQueryString(params);
    return request("GET", `/api/templates${query ? `?${query}` : ""}`);
  },
  getTemplate: (name) => request("GET", `/api/templates/${encodeURIComponent(name)}`),

  listPresentations: (params = {}) => {
    const query = toQueryString(params);
    return request("GET", `/api/presentations${query ? `?${query}` : ""}`);
  },
  /** Milestone M6 decision D: reads X-Total-Count alongside the list body —
   * Library's own required "total count" display needs the real total,
   * not just the current page's length. */
  listPresentationsWithTotal: async (params = {}) => {
    const query = toQueryString(params);
    const { payload, res } = await rawRequest("GET", `/api/presentations${query ? `?${query}` : ""}`);
    const total = Number(res.headers.get("X-Total-Count"));
    return { items: payload, total: Number.isFinite(total) ? total : payload.length };
  },
  createPresentation: (payload) => request("POST", "/api/presentations", payload),
  getDeck: (id) => request("GET", `/api/presentations/${encodeURIComponent(id)}/deck`),

  /** MVP Sprint 1 — PPTX Upload/Import. Not a request() call: the body is
   * the raw file bytes, not JSON, so this bypasses the JSON envelope
   * rawRequest()/request() assume, while still using the same ApiError
   * shape every other wrapper throws. */
  importPresentation: async (file, { imageSource = "source" } = {}) => {
    let res;
    try {
      res = await fetch(
        `${API_BASE}/api/presentations/import?filename=${encodeURIComponent(file.name)}&images=${imageSource}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/octet-stream" },
          body: file,
        }
      );
    } catch {
      throw new ApiError(0, "Connection lost. Check that the API is running.");
    }
    let payload = null;
    try { payload = await res.json(); } catch { /* handled by the status check below */ }
    if (!res.ok) throw new ApiError(res.status, payload?.error || "Could not import this presentation.");
    return payload;
  },

  /** Editor "Replace image" — upload from disk. Same non-JSON shape as
   * importPresentation: the body is the raw file bytes, Content-Type is the
   * file's own MIME type (what the browser already read off the file),
   * and the response is just the repo-relative path the popover's existing
   * Apply flow then writes onto the slide. */
  uploadImage: async (presentationId, file) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/presentations/${encodeURIComponent(presentationId)}/media`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
    } catch {
      throw new ApiError(0, "Connection lost. Check that the API is running.");
    }
    let payload = null;
    try { payload = await res.json(); } catch { /* handled by the status check below */ }
    if (!res.ok) throw new ApiError(res.status, payload?.error || "Could not upload the image.");
    return payload;
  },

  // Milestone M6 — the backend endpoints already existed (M3/M4); only the
  // UI-side wrappers were missing.
  duplicatePresentation: (id) => request("POST", `/api/presentations/${encodeURIComponent(id)}/duplicate`),
  archivePresentation: (id, archived) =>
    request("POST", `/api/presentations/${encodeURIComponent(id)}/archive`, { archived }),
  deletePresentation: (id) => request("DELETE", `/api/presentations/${encodeURIComponent(id)}`),

  // Milestone M7 — Presentation Detail. Both endpoints already existed
  // (M3); only the UI-side wrappers were missing.
  getPresentation: (id) => request("GET", `/api/presentations/${encodeURIComponent(id)}`),
  updatePresentation: (id, changes) => request("PATCH", `/api/presentations/${encodeURIComponent(id)}`, changes),

  // Milestone M9 — Editor.
  updateSlide: (id, slideId, patch) =>
    request("PATCH", `/api/presentations/${encodeURIComponent(id)}/slides/${encodeURIComponent(slideId)}`, patch),

  // Editor MVP — slide structure. The routes are new; these follow the same
  // thin-wrapper pattern as every other method in this file.
  addSlide: (id, { templateName, position, relativeToSlideId } = {}) =>
    request("POST", `/api/presentations/${encodeURIComponent(id)}/slides`, {
      templateName,
      position,
      relativeToSlideId,
    }),
  duplicateSlide: (id, slideId) =>
    request("POST", `/api/presentations/${encodeURIComponent(id)}/slides/${encodeURIComponent(slideId)}/duplicate`),
  deleteSlide: (id, slideId) =>
    request("DELETE", `/api/presentations/${encodeURIComponent(id)}/slides/${encodeURIComponent(slideId)}`),
  reorderSlides: (id, slideIds) =>
    request("PATCH", `/api/presentations/${encodeURIComponent(id)}/slides-order`, { slideIds }),
  swapSlideTemplate: (id, slideId, { templateName, allowOverride }) =>
    request(
      "POST",
      `/api/presentations/${encodeURIComponent(id)}/slides/${encodeURIComponent(slideId)}/template`,
      { templateName, allowOverride }
    ),

  // M15 Phase 3 — Editor AI Assist. The route already exists; this is the
  // UI-side wrapper, matching the established pattern (M6/M7 added wrappers
  // for endpoints M3/M4 had already built).
  /** Plans a change that may restructure the slide (layout swap / new slide),
   *  not just its wording. */
  reviewPresentation: (id) =>
    request("POST", `/api/presentations/${encodeURIComponent(id)}/review`),

  planSlideChange: (id, slideId, { instruction, signal }) =>
    request(
      "POST",
      `/api/presentations/${encodeURIComponent(id)}/slides/${encodeURIComponent(slideId)}/plan`,
      { instruction },
      signal
    ),

  assistEditorSlide: (id, slideId, { action, content, instructions, history, signal }) =>
    request(
      "POST",
      `/api/presentations/${encodeURIComponent(id)}/slides/${encodeURIComponent(slideId)}/ai`,
      { action, content, instructions, history },
      signal
    ),

  // Editor V2 — "Generate slide with AI" (Claude picks the template) and
  // Claude-suggested template-swap field mapping. Same Claude CLI path as
  // every other AI action, just two more endpoints on it.
  generateSlideWithAi: (id, { intent, position, relativeToSlideId }) =>
    request("POST", `/api/presentations/${encodeURIComponent(id)}/slides/generate`, {
      intent, position, relativeToSlideId,
    }),
  suggestFieldMapping: (id, slideId, newTemplateName) =>
    request(
      "POST",
      `/api/presentations/${encodeURIComponent(id)}/slides/${encodeURIComponent(slideId)}/map-template`,
      { newTemplateName }
    ),

  // Milestone M10 (WP6) — Export. Every route already exists (WP5); only
  // these UI-side wrappers are new, matching the established pattern (M6/M7
  // added wrappers for endpoints M3/M4 had already built).
  requestExport: (presentationId, format) => request("POST", "/api/exports", { presentationId, format }),
  getExportJob: (jobId) => request("GET", `/api/exports/${encodeURIComponent(jobId)}`),
  cancelExport: (jobId) => request("POST", `/api/exports/${encodeURIComponent(jobId)}/cancel`),
  getLatestExport: (presentationId, format) =>
    request("GET", `/api/presentations/${encodeURIComponent(presentationId)}/exports/latest?format=${encodeURIComponent(format)}`),

  /** WP6 finding resolution — download support. Not a `request()` call:
   * this is a direct browser navigation target (an <a href>), never a
   * fetch — the session cookie is SameSite=Lax, so a top-level GET
   * navigation to the cross-origin API still carries it, exactly as UX
   * Spec §08 requires ("a direct browser download — no intermediate
   * 'your file is ready' page"). Returns the URL string only; API_BASE
   * stays encapsulated here rather than leaking into detail.js. */
  getExportDownloadUrl: (exportId) => `${API_BASE}/api/exports/${encodeURIComponent(exportId)}/download`,

  /** WP9 (backend only — no UI consumes this yet). Mirrors
   * listPresentationsWithTotal's exact X-Total-Count pattern; the backing
   * route already exists (WP9 backend). */
  listExports: async (params = {}) => {
    const query = toQueryString(params);
    const { payload, res } = await rawRequest("GET", `/api/exports${query ? `?${query}` : ""}`);
    const total = Number(res.headers.get("X-Total-Count"));
    return { items: payload, total: Number.isFinite(total) ? total : payload.length };
  },

  // M15 Phase 4 — Home's AI generation flow. The routes already exist
  // (Phase 1-2 + Phase 4 Slice 0); these are the first UI-side wrappers.
  /** `fields` (coach v2): { coaching, answers, wantsHook, slideCount,
   *  referenceIds, background } — all optional. With `background: true` the
   *  server answers 202 with a `pending` record and drafts in the background. */
  requestGeneration: (prompt, fields = {}) => {
    const body = { prompt };
    for (const [key, value] of Object.entries(fields || {})) if (value !== undefined) body[key] = value;
    return request("POST", "/api/generations", body);
  },
  // Prompt coach (v2). The server answers every model failure with the fixed
  // questions, so this only throws when the server itself cannot be reached.
  coachBrief: (prompt, { hasReferences = false } = {}, signal) =>
    request("POST", "/api/briefs/coach", { prompt, hasReferences }, signal),

  // References (source material attached inside the coach form). A file goes
  // up as raw bytes with its name in the query — the same single-file shape
  // as importPresentation — and is read on the server.
  uploadReference: async (file, signal) => {
    let res;
    try {
      res = await fetch(`${API_BASE}/api/references?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
        signal,
      });
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      throw new ApiError(0, "Connection lost. Check that the API is running.");
    }
    let payload = null;
    try { payload = await res.json(); } catch { /* handled by the status check below */ }
    if (!res.ok) throw new ApiError(res.status, payload?.error || "Could not read this file.", payload);
    return payload;
  },
  addTextReference: (text, name) => request("POST", "/api/references/text", name ? { name, text } : { text }),
  setReferenceUseOnSlides: (id, useOnSlides) =>
    request("PATCH", `/api/references/${encodeURIComponent(id)}`, { useOnSlides }),
  deleteReference: (id) => request("DELETE", `/api/references/${encodeURIComponent(id)}`),
  getGeneration: (id) => request("GET", `/api/generations/${encodeURIComponent(id)}`),
  updateOutline: (id, proposedMapping) =>
    request("PATCH", `/api/generations/${encodeURIComponent(id)}`, { proposedMapping }),
  approveGeneration: (id) => request("POST", `/api/generations/${encodeURIComponent(id)}/approve`),
};
