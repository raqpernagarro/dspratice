# TryPost API spike (21 Oct 2026)

Run against the pinned image (`sha256:04c8e9ba…`) at `http://localhost:8000`, with an API key created at Settings → Workspace → API keys. Every request carries `Authorization: Bearer <key>` and `Accept: application/json`.

**Result: drafts on the three disconnected placeholder channels work through the REST API, dated drafts appear on the calendar, and nothing enters the queue.**

## Shapes that worked

**Channels.** `GET /api/social-accounts` → `{"data": [{id, platform, display_name, username, status, …}]}`. The three placeholders have `status: "disconnected"` and `username` `manual-linkedin`, `manual-instagram`, `manual-x`.

**Upload.** `POST /api/uploads` as `multipart/form-data` with one file field `media` → `201` with an unwrapped body `{upload_token, type, mime_type, size, original_filename, url, expires_at}`. The token is **single use**: once a post is created with it, a second use returns `422 "This upload expired. Add the file again."`.

**Create a draft.** `POST /api/posts` with JSON:

```json
{"status": "draft", "content": "…", "scheduled_at": "2026-10-23T08:30:00+01:00",
 "social_account_id": "<channel id>", "content_type": "linkedin_post",
 "meta": {"document_title": "…"}, "media": [{"upload_token": "…"}], "label_ids": []}
```

→ `201` with the PostResource **unwrapped** (top-level `id`, `status`, `content`, `scheduled_at`, `labels`, `media`, `platform`, `content_type`, `meta`, `updated_at`, …). Content types used: `linkedin_post`, `instagram_feed`, `x_post`. `scheduled_at` must be in the future (`after:now`), and it is echoed back in UTC as `"2026-10-23 07:30:00"` (space separated, no offset), so never compare it as a string.

**List.** `GET /api/posts?page=N` → wrapped: `{"data": [...], "links": {...}, "meta": {"current_page", "last_page", "per_page": 25, "total"}}`. Filters: `channels[]`, `labels[]`, `untagged`. No status filter.

**Update.** `PUT /api/posts/{id}` with `{"label_ids": []}` → `200`; with `{"content": "…"}` → `200`, body echoed. Response unwrapped.

**Notes.** `POST /api/posts/{id}/notes` with `{"body": "…"}` (max 2000) → `201` unwrapped `{id, post_id, body, author, created_at, updated_at}`.

**Delete.** `DELETE /api/posts/{id}` → `204`.

## Confirmed in the UI

- Calendar (week view) showed the three drafts at 8:30 on Fri 23 Oct, one per channel, with the LinkedIn one carrying the PDF.
- The Publish queue count stayed at 0; `GET /api/posts` listed only `draft` statuses.

## Consequences for the sync script

- Treat create and update responses as unwrapped objects; treat list responses as `data` pages.
- Upload media immediately before the create call that consumes it; never reuse a token.
- Send `scheduled_at` only for future dates; parse, never string-compare, what comes back.
- The spike drafts and the three undated manual test drafts from 20 Oct were deleted afterwards; the workspace holds no posts.
