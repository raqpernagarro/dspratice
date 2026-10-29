# Product Layer

Implements the Product Layer defined in Phase 1–5.1. Runs entirely on this
machine — no external service required.

```
product/
├── application/       Application Layer — HTTP server, routing, middleware, Gateway orchestration
│   ├── server.js
│   ├── middleware/    session.js, authorization.js
│   ├── routes/        presentations.js, auth.js
│   └── gateway/       engine-gateway.js
├── domain/            Domain Layer — Services
│   ├── presentation-service.js
│   └── authentication-service.js
├── infrastructure/    Infrastructure Layer — adapters to the outside world
│   ├── config.js
│   ├── identity/      local identity provider + bootstrap CLI
│   └── session/       session store
├── storage/           Storage Layer — Repositories
│   ├── presentation-repository.js
│   └── workspace-repository.js
├── ui/                UI Layer — the product's own screens
│   ├── login.html     Authentication
│   ├── index.html     Home
│   ├── presentations.html  Presentation Library (Milestone M6)
│   ├── detail.html    Presentation Detail (Milestone M7)
│   ├── templates.html Templates Gallery (Milestone M8)
│   ├── editor.html    Editor — manual editing (Milestone M9)
│   ├── app.css        product chrome (tokens only)
│   └── lib/           api.js · session.js · nav.js
└── data/              runtime JSON (git-ignored)
```

## Using the product

Served by the existing `serve.py` — no separate UI server, and `serve.py`
itself is unmodified.

```
http://localhost:4599/product/ui/index.html
```

Both servers must be running: `npm run api` (4600) and
`python3 serve.py 4599`. Visiting Home while signed out redirects to
`login.html` and returns you to the page you asked for after signing in.

Home creates a presentation from a title and a template choice (Milestone
M5, manual creation). Prompt- and upload-driven AI creation arrive in
Milestones M12–M13; the create panel is the explicit fallback path Phase 3
§03 Journey 2 describes.

`presentations.html` is the **Presentation Library** (Milestone M6) — browse,
search, sort, and manage every presentation in the workspace:

- **Status** is limited to a Ready/Archived toggle. Every other Phase 2 §03
  lifecycle value (Generating, Generated, Edited, Exported, Failed, ...) is
  unreachable until the generation pipeline (M8–M13) exists, so no chip is
  shown for them — the same reasoning that keeps the nav bar to Home and
  Presentations only.
- **Rename is deliberately absent.** Phase 3 assigns it to Presentation
  Detail (M7); the underlying `PATCH` has worked since M3.
- **Delete** uses the component catalog's two-step "type to confirm"
  Confirmation Modal — the presentation's exact title must be typed before
  the destructive button enables.
- **No audit log is written on delete.** History (Phase 2 §04) is a full,
  unbuilt subsystem with no milestone scheduling it before M14; Journey 13's
  "History logs it first" is deferred along with the rest of that subsystem.

`detail.html` is **Presentation Detail** (Milestone M7) — a single
presentation's workspace, opened from Home's "Open" link or a Library card.

- **The Viewer is embedded via an `<iframe src="/render.html?id=&slide=">`.**
  `render.html`, `js/render-gateway.js`, `deck.html`, and `js/engine.js` are
  never touched — Phase 4's own M7 File Impact note says the Gateway is
  "consumed, never modified," and Phase 1 §01 authorizes exactly this
  pattern ("via a link or an embedded frame — never by reimplementing it").
  Prev/Next are new, Detail-owned controls that only ever change the
  iframe's own `?slide=` parameter.
- **Rename is an inline edit on the title** (save on blur/Enter, revert on
  Escape or an empty value) — deferred here from Library (M6's decision B),
  using the same `PATCH` that has worked since M3.
- **Not found** (unknown id, wrong workspace, or a missing `?id=`) shows a
  plain message with a Library link, before any iframe is ever rendered —
  never a broken embed.
- **Delete** redirects to the Presentation Library afterward — Detail's own
  Exit point (Phase 3 §02) — using the identical two-step "type to confirm"
  modal Library uses, deliberately duplicated rather than shared (no new
  abstraction introduced for it).
- **Known limitation:** the Viewer frame's loading skeleton hides on the
  iframe's own `load` event, which fires once the Gateway's HTML document
  has loaded — slightly before its internal async deck fetch resolves. This
  is the best signal available without touching `render-gateway.js`, which
  decision A forbids.

`templates.html` is the **Templates Gallery** (Milestone M8) — a read-only,
live-rendered mirror of the Template Registry. Every preview is a genuine
`buildStage()` render of the template's own example content, built exactly
as `js/decks/main-template.js` builds it — never a screenshot or a cache.

- **Category** is a small (~16-bucket), computed, Product-Layer-only
  grouping derived from each template's own `archetype`/`name` — no Template
  Repository, no persisted metadata, nothing written back to the engine
  (approved decision B). It's a browsing convenience, not authoritative
  taxonomy.
- **Promote is not implemented.** Phase 2.5 gates it behind a
  "design-operator" role that was never defined anywhere in the built Role
  system, and Phase 4's M8 acceptance criteria doesn't require it — an
  acknowledged, standing specification gap (approved decision A), not
  something invented around.
- **The detail view is an in-page Dialog** (approved decision C) — ordinary
  dismissal (Escape, click-outside, close button), unlike Library/Detail's
  two-step "type to confirm" Delete modal.
- **Known, pre-existing defect fixed here:** ~48 of 103 templates
  (`js/templates/*.js`, immutable) hardcode `src="assets/..."` — relative to
  whatever page calls `buildStage()`. Every existing consumer
  (`deck.html`/`render.html`/`index.html`) lives at the repo root, where
  that resolves correctly; `product/ui/*.html` lives one directory down, so
  the identical path 404s there. Found during M8 testing — the first
  screen to render the *entire* template library at once — but the same
  defect equally affects Home/Library's own thumbnails whenever they
  happen to render one of those 48 templates; it was simply never
  triggered by their prior test data. Fixed narrowly, only in
  `templates.js`, by rewriting each rendered stage's own relative `<img>`
  paths to root-absolute after `buildStage()` returns — no immutable file
  touched, no change to any other screen.

`editor.html` is the **Editor** (Milestone M9) — manual editing of a slide's
own content, opened only from Detail's "Edit" action (never a nav-bar
destination); "Done" always returns to Detail.

- **Edit is available for both `Ready` and `Generated` status** (approved
  decision A) — Phase 3 §04 gates it to `Generated`-only, but `Ready` is the
  only status this system can currently produce, and a strict reading would
  make the Editor permanently unreachable before M12/13's AI pipeline
  exists. Hidden entirely with zero slides, matching Phase 3 §04's empty
  state.
- **No asset replacement, no regenerate button** (decision B) — both belong
  to subsystems (M11, M12/13) that don't exist yet; Phase 4's own M9
  acceptance criteria never requires either.
- **Template swap is this milestone's trigger for the manual-override
  conflict mechanism** (decision C) — `presentation-repository.js`'s
  `update()` (built at M2, unused until now) throws
  `ManualOverrideConflictError` when a patch would silently overwrite a
  field the user has already hand-edited. The same mechanism will apply
  unchanged to AI regeneration once M12/13 exist.
- **No Version is ever created here** (decision D) — Versions are a whole
  unbuilt subsystem with no milestone scheduling it before M9's own
  acceptance criteria requires it.
- **The live preview and thumbnail rail call `buildStage()` directly**
  (decision E) — the same technique Home/Library/Templates already use —
  never an iframe; a full Engine Gateway reload on every keystroke would be
  far too heavy for continuously-updating text edits.
- **The template-swap picker is Editor-owned** (decision F), styled from
  the same tokens/classes Templates (M8) established, deliberately
  duplicated rather than factored into a shared component.
- **Swap merges matching field names, discloses unmapped fields before
  confirmation, and never silently discards data** (decision G). Fields
  with no equivalent in the new template are shown to the user, then
  dropped; new schema fields with no old equivalent default to the target
  template's own `example` content — the same seeding Home (M5) uses for a
  brand-new slide. The client computes a local preview of this merge from
  already-loaded schema/content (no round-trip); the server independently
  and authoritatively recomputes the same merge for the actual write.
- **Undo/redo is a client-side history stack** (decision H) that replays
  ordinary `PATCH` calls in either direction — no server-side undo state.
- **The manual-override hint shows once per field**, the first time it
  becomes overridden (decision I), then auto-hides after ~5 seconds.
- **Two debounce tiers per field**: ~200ms for the live preview
  (`buildStage()`-direct, no network call) and ~1000ms — or immediate on
  blur — for the actual autosave `PATCH` commit, per Phase 3 §07's "short
  debounce" (preview) vs. "on blur or a pause in typing" (autosave)
  distinction.
- **Schema fields aren't all plain strings.** A template's `schema`
  (`js/templates/_CONTRACT.md`) describes `string`, `string[]` (a list of
  paragraphs), and `array of {...}` (structured objects — stats, positioned
  timeline bars, ...) fields. The Editor detects the field's kind from its
  own schema description: `string[]` renders as one-line-per-item; `array
  of {...}` renders read-only with a JSON preview ("not editable yet") —
  building a full nested sub-form editor for structured arrays was judged
  disproportionate new scope for this milestone's acceptance criteria, so
  it is disclosed rather than silently corrupted.
- **Known limitation:** structured object-array fields (e.g. `stats`,
  positioned `items`) are read-only in this milestone; editing them needs a
  dedicated nested sub-form, out of scope here.

## First run

Create the first workspace and an admin user (Milestone M4). There is no
registration endpoint by design — users are created only here.

```bash
npm run auth:create-user
```

You will be prompted for an email, workspace name, and password. The
password is never taken as a command-line argument.

## Run the API

```bash
npm run api
```

Starts the Backend API on **http://localhost:4600**. The existing static
engine (`serve.py`, port 4599) is separate and unaffected — the API server
only answers `/api/*`; it does not serve `deck.html`, `index.html`, or any
other engine page.

### Configuration

| Variable | Required | Purpose |
|---|---|---|
| `SESSION_SECRET` | Yes in production | Signs session token hashes. In development an ephemeral per-boot secret is generated, so sessions do not survive a restart. |
| `PORT` | No (4600) | API port |
| `ALLOWED_ORIGIN` | No (`http://localhost:4599`) | CORS origin permitted to send credentials |
| `AUTH_BYPASS` | No | Local development only — see below |

**`AUTH_BYPASS=1`** disables authentication and runs every request as a
synthetic admin. It is honored **only** when `NODE_ENV` is not
`production`, prints a prominent warning on every boot, and exists solely
as Phase 4 §08's local-development affordance and M4's rollback path.

## Endpoints

### Authentication (Phase 2.5 §05)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | public | `{ email, password }` → sets session cookie, returns user + workspace |
| POST | `/api/auth/logout` | required | → 204, clears cookie |
| GET | `/api/auth/session` | required | → current user + workspace |

### Templates (Phase 2.5 §05)

| Method | Path | Permission |
|---|---|---|
| GET | `/api/templates` | workspace member — accepts `?category=` and `?search=` (Milestone M8) |
| GET | `/api/templates/:name` | workspace member — detail/preview for the Gallery's drill-in overlay |

`POST /api/templates/:name/promote` is not built — see Templates Gallery
above (approved decision A: no "design-operator" role exists in the built
system, and Phase 4's M8 acceptance criteria never requires it).

### Presentations (Phase 2.5 §05)

All require a valid session. Permission tiers are those Phase 2.5 §05
specifies; ownership is derived from `ownerId`.

| Method | Path | Permission |
|---|---|---|
| GET | `/api/presentations` | workspace member |
| POST | `/api/presentations` | workspace member |
| GET | `/api/presentations/:id` | workspace member |
| PATCH | `/api/presentations/:id` | owner or editor |
| DELETE | `/api/presentations/:id` | owner or admin |
| POST | `/api/presentations/:id/duplicate` | workspace member |
| POST | `/api/presentations/:id/archive` | owner or admin |
| GET | `/api/presentations/:id/deck` | workspace member — the Engine Gateway contract |
| PATCH | `/api/presentations/:id/slides/:slideId` | owner or editor — Editor field edits (Milestone M9) |
| POST | `/api/presentations/:id/slides/:slideId/template` | owner or editor — Editor template swap (Milestone M9) |

Every presentation is scoped to the session's workspace. A record in
another workspace is reported as **404**, not 403, so its existence is not
disclosed across a tenant boundary.

`GET /api/presentations` sets `X-Total-Count` (M3) and, since M6, exposes it
via `Access-Control-Expose-Headers` — the header the Library screen's
required total-count display reads. `Ready → Archived` was added to the
Presentation Repository's valid transitions at M6: Phase 2's own lifecycle
diagram only draws `Generated`/`Exported → Archived`, written before manual
creation (M5) existed. Every presentation this system can currently produce
starts in `Ready`, so the diagram's gap would otherwise block archiving
entirely.

`PATCH /api/presentations/:id` now rejects an empty `title` (400) at M7 —
`insert()` always required a non-empty title, but `update()` never mirrored
that check, invisible until Detail's rename feature became the first real
caller to ever PATCH a title at all.

`PATCH /api/presentations/:id/slides/:slideId` (M9) writes `content` and/or
`manualOverrides` for one slide. It always passes `{ allowOverride: true }`
to the repository — a direct field edit is the user's own explicit intent,
never a silent overwrite, so it is never the conflict trigger itself
(template swap is — see below). Unknown slide → 404.

`POST /api/presentations/:id/slides/:slideId/template` (M9) swaps a slide's
`templateReference` and merges `content` onto the target template's schema
(see Editor section above). Returns `{ slide, unmappedFields }` on success.
Unknown template → 400. If any carried-over field is `manualOverrides`-true
and the caller didn't pass `allowOverride: true`, responds **409** with a
`ManualOverrideConflictError` message — the repository's M2-built, M9-first
-triggered protection — and writes nothing.

## Viewing a presentation through the Engine Gateway

Run both servers, sign in (which sets the session cookie), then open:

```
http://localhost:4599/render.html?id=<presentationId>
```

`render.html?slide=0` / `?slide=1` — Milestone M1's hand-built fixture —
continue to work unchanged, with **no API server and no session required**.
That path is a permanent regression test and is never altered.
