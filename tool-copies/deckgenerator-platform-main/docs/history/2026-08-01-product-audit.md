# Product Audit — 2026-08-01

Full audit of the Product Layer (screens + API) done hands-on in the browser plus two
deep code sweeps (backend, frontend). Organized by severity. Each item: description,
why it matters, proposed fix, complexity (S/M/L), user impact (1–5).

## Critical

| # | Area | Issue | Why | Fix | Cx | Impact |
|---|------|-------|-----|-----|----|--------|
| C1 | editor.js 936/966 | Redo of add/duplicate rebinds `.undo` on the WRONG history entry (pushed after await) | Undo→Redo→Undo deletes an unrelated slide — data loss | push entry before awaiting / return new id and rebind in `redo()` | S | 5 |
| C2 | editor.js 258 | undo/redo have no concurrency guard; holding ⌘Z overlaps slide ops | out-of-order adoptSlides corrupts deck state | `historyBusy` flag serializing undo/redo | S | 5 |
| C3 | presentation-card.js 428, editor.js 1843, workspace.js 723 | focus traps include `:disabled` buttons → focus escapes delete-confirm modals | destructive modals leak keyboard focus; a11y + safety | shared `trapFocus` with `:not(:disabled)` | S | 4 |
| C4 | middleware/session.js 33 | AUTO_LOGIN_LOCAL_USER=true hardcoded: every request runs as admin, no boot warning | total auth bypass with real data; worse than AUTH_BYPASS | gate behind env `AUTO_LOGIN=1`, warn on boot | S | 5 |
| C5 | server.js 53 | CORS always reflects configured origin w/ credentials, no request-origin check; no CSRF defense | any allowed-origin page drives the API | echo origin only when it matches allowlist | S | 4 |
| C6 | presentation-repository.js 234 | PATCH mass-assignment: `Object.assign(record, changes)` lets callers set `ownerId` etc. | privilege escalation, data corruption | whitelist mutable fields | S | 4 |

## High

| # | Area | Issue | Fix | Cx | Impact |
|---|------|-------|-----|----|--------|
| H1 | server.js | No async error handler / 404 handler — rejected promises hang requests | asyncHandler wrapper + final error middleware | S | 4 |
| H2 | export-gateway.js 145 | Cancelling a queued job leaves it in queue → invalid transition, job vanishes | remove from queue in cancel(); check cancelRequested at top of processJob | S | 4 |
| H3 | export-gateway.js 179 | Recovery sweep requeues jobs nothing picks up → permanent 409 on new exports | mark interrupted jobs Failed (retryable) | S | 4 |
| H4 | session-store.js / identity | `writeFile(..., "utf8", {mode})` ignores mode → secrets world-readable; no locking, non-atomic writes, parse-error → data wipe | fix writeFile args; atomic tmp+rename | S | 4 |
| H5 | session.js (ui lib) | non-401 boot failure leaves every screen on a skeleton forever | error banner + retry on all boots | M | 4 |
| H6 | editor.js 1806 | Space swallowed globally — focused buttons can't be activated by keyboard | bail when target is button/link | S | 3 |
| H7 | presentations.js 169 | Library cards built serially — N round-trips before first paint | build cards sync, thumbnails resolve per-card | S | 4 |
| H8 | templates.js 87 | 103 stages built synchronously at boot | lazy build via IntersectionObserver | M | 3 |
| H9 | editor.js 1008 | delete-slide undo/redo pair not id-stable → redo deletes wrong slide after reorder | capture restored id | S | 4 |
| H10 | editor.js 559 | debounced commit keyed by field only — pending timer can write slide A's text into slide B | include slide id in signature; capture slide at schedule time | S | 4 |
| H11 | workspace.js 882 | export success toast only when tab hidden | always toast | S | 3 |
| H12 | workspace.js 403 / app-shell | Escape closes workspace while dismissing search overlay / menus | overlay stack check | S | 3 |
| H13 | detail viewer (workspace.js) | "Engine Gateway — live" debug banner exposes template name + UUID over the slide | remove/relegate to tooltip | S | 3 |
| H14 | editor.js submit | AI composer: Enter doesn't send (newline instead); concurrent sends not prevented | Enter=send, Shift+Enter=newline; in-flight guard | S | 4 |
| H15 | generation-service.js 125 | approve not atomic → orphan presentations | CAS transition first | S | 3 |
| H16 | claude-cli-provider | unbounded subprocess spawning per request | semaphore (max 2) + prompt length cap | S | 3 |

## Medium (selected)

- M1 editor.js 1412: acceptAllProposals — batch into one PATCH + one history entry; stale slide ref.
- M2 editor.js 1039: `setBusy` boolean shared by AI + slide ops → counter.
- M3 export-jobs.js: full list rebuild every 1.5s poll; migrate off retired nav.js to app shell.
- M4 palette: duplicate "Search Templates"/"Swap template"; "Export" goes to workspace not export.
- M5 editor.js 1800: Backspace with no selection opens delete-slide modal.
- M6 templates.js 293: lightbox errors render behind overlay; favorites star is a dead control; empty state always says "search".
- M7 api.js: no request timeout; API_BASE hardcoded.
- M8 Escape-during-edit can push two history entries (editor.js 585).
- M9 routes: inconsistent error shapes; message-regex classification; pagination NaN.
- M10 present.js exits via detail.html redirect stub.
- M11 repository read cache unbounded/stale; read-modify-write outside lock for slide ops.
- M12 pptx import: no decompressed-size caps (zip bomb).
- M13 scrypt default params; no login rate limit.
- M14 aria: live region rebuilt wholesale; invalid listbox roles in rail; aria-hidden hover controls.

## Low / cleanup

- 6 copies of escapeHtml, 4 trapFocus, 4 formatDate, 3 toast, 3 cssEscape → lib/dom.js.
- Dead code: mock-ai-provider.js unused, hasCredential, insertVersion, stopRecoverySweep, void hasFilter, exportHistory, favorites.
- CSS duplicate selectors (app.css 1186/1243, 2413/2690); focus outlines removed without replacement.
- workspace.js unescaped `${job.format}` interpolations (consistency).
- Recents/"Done" links go to index.html?id= (works, but detail.html is a redirect stub — unify).

## Roadmap

- **Phase A — shared frontend lib**: lib/dom.js (escapeHtml, trapFocus, toast, formatDate, formatSize, cssEscape) and adopt everywhere → fixes C3 + dedup.
- **Phase B — editor correctness**: C1, C2, H9, H10, H14, M2, M5, M8, H6, M4.
- **Phase C — backend security/robustness**: C4, C5, C6, H1, H4, H15, H16, M9(partial).
- **Phase D — export pipeline**: H2, H3, cancelRequested leak.
- **Phase E — performance**: H7, H8, resize rAF coalescing, M3 incremental rows.
- **Phase F — UX polish**: H5, H11, H12, H13, M6, M10.

---

## Status — end of 2026-08-01 session

**Done (all Criticals + major Highs):** C1–C6, H1–H7, H9–H16, plus: shared lib/dom.js (dedup of escapeHtml/trapFocus/toast/formatDate/formatSize/cssEscape), templates gallery chunked preview build (replaced unreliable IntersectionObserver), export-jobs incremental rows, present.js direct exit, session boot error state, api.js timeout, per-presentation write lock in presentation-service, TTL+bounded repository cache, PPTX decompression caps, POST /slides content forwarding, generation approve atomicity, engine-gateway banner hidden on live success.

**Second pass (same day): all remaining items above were fixed** — export-jobs migrated to the app shell (nav.js deleted); unified error shapes via application/http-errors.js with machine-readable codes; acceptAll batched to one PATCH + one history entry; aria-live replaced with a short #ai-status line and the rail's invalid listbox roles replaced with aria-current; Escape-during-edit now leaves the undo stack untouched (server silently restored); scrypt N=2^17 + login rate limiting (dead member-management methods removed instead of patching their credential orphan); generation polling aborts on pagehide and tolerates 3 transient failures; API_BASE overridable via <meta name="api-base">; dead code removed (mock-ai-provider.js, hasCredential, insertVersion, workspace update/updateMember/removeMember, ASSIST_ACTION_NAMES); resize handlers rAF-coalesced/read-write batched; Firefox plaintext-paste fallback; app.css duplicate selectors merged and focus-visible outlines restored; PORT validated at boot.

**Still open (small, deliberate):** stopRecoverySweep kept (used internally by startRecoverySweep); structured-array sub-form editing (feature work, not a defect); timestamped backups of product/data (recommended safety feature).
