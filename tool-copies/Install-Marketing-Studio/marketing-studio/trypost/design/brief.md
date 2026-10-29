# TryPost as the author's post workspace: brief (21 October 2026)

The author's words: "The goal of this tool would be just for me to create the posts and have a place to see them and manage them. The features I want is the create, publish but you shouldn't show failed or sent, it's just me that says that I have published or not because it will be manual. I don't need the insights and repurpose. The logo called Trypost.it I don't need that, we don't need logos. Apply the same UI we have on the events radar."

## Rulings (decided; do not reopen)

1. **Purpose.** A private workspace to create posts, see them on a calendar or list, and manage them. Nothing is ever sent to a network from TryPost. The author posts by hand and marks a post published himself.
2. **Navigation.** Keep: the New post button, Create (the ideas board), Publish (calendar and list), the Channels list, settings and the user menu. Remove from every navigation surface (sidebar, command palette, channel page tabs, mobile nav, empty states that link there): Insights (workspace and per channel) and Repurpose. The routes may stay registered; nothing links to them.
3. **No logos.** Remove the TryPost logo, mark and wordmark from the app shell (sidebar header, login and register pages, any header or footer that shows it, the favicon may stay). The app's name in the browser tab becomes "Marketing Studio" (APP_NAME in `.env`, used by the build too). Platform badges and channel avatars stay: they are channel icons, not the app's logo.
4. **Manual publishing.** A new backend flag `MANUAL_PUBLISHING` (env, default `true` in `config/trypost.php`):
   - `ProcessScheduledPosts` and any other path that sends a post to a network (publish now, retries, limit retries, the API's `status: publishing`, the MCP tools) does nothing when it is on: no post is ever published, scheduled publishing never fires, no network call is made. Prefer one guard at the lowest common point (the job that publishes, `PublishToSocialPlatform`, plus the command that claims due posts) and make the API refuse `scheduled` and `publishing` with a clear 422 message while the flag is on.
   - The composer's publish actions become: **Save** (a draft; the date and time the author picks are kept as the post's planned date, `scheduled_at`, and the post stays `draft`). "Publish now", "Schedule", "Add to queue" and any "Post now" style action are removed from the UI while the flag is on.
   - **Published is the author's mark.** A post is published when it carries the label `posted` (the label already exists; the sync in `scripts/trypost_sync.py` reads it and marks the file published). Add a clear action **Mark as published** / **Mark as not published** on a post: in the post's details or preview dialog, in the composer's menu, and on a calendar or list item's menu if one exists. It adds or removes the `posted` label through the existing post update path (create the label in the workspace if it is missing, colour from the existing label palette). No network call.
5. **No failed or sent.** Nowhere in the UI does a post show failed, error, retrying, publishing, sent or published-by-network: no red error chips, failure popovers, error messages, retry buttons, "View post" links to a network, or status filters for those states. A post shows one of three states, everywhere a status appears (calendar chips, list rows, timeline cards, details, filters, counts):
   - **Draft**: no planned date.
   - **Planned**: has a planned date (`scheduled_at`) and is not published.
   - **Published**: carries the `posted` label.
   The state is derived in one place in the frontend (a composable such as `useManualStatus(post)`), and every component uses it. Status filters offer only these three.
6. **Insights and Repurpose features stay in the code** but are unreachable from the UI; no data is deleted.

## The look: the Events Radar design system

The author's Events Radar page is the reference. Apply its system to TryPost's whole UI through the theme tokens first (`resources/css/app.css`, the shadcn-style variables), then the shell (sidebar and top bar), then the few components that need a shape change. Do not restyle component by component where a token can do it.

**Fonts.** Inter (400, 450, 500, 600, 700) for everything, Roboto Mono (400, 500) for numbers, dates, small uppercase labels and table headers. Google Fonts link: `https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700&family=Roboto+Mono:wght@400;500&display=swap`. Body 13px, line-height 1.5, `font-feature-settings: "cv11","ss01"`. Headings weight 450 (h1 20px, h2 15px, h3 13px weight 500). Replace TryPost's Outfit, Roboto Slab and JetBrains Mono.

**Light tokens** (the Nagarro brand kit):
```
--bg:#EFF1F4;            page background (Limestone Gray Lightest)
--surface:#FFFFFF;       cards, sidebar, top bar, dialogs
--sunk:#F6F7F9;          hover rows, inset areas
--ink:#06041F;           text (Petrol Blue)
--muted:#4E5E78;         secondary text
--faint:#8893A5;         tertiary text, placeholders
--line:#E0E3E8;          borders
--line-soft:#EFF1F4;     row separators
--accent:#205463;        links and accent text
--accent-mark:#2D807B;   small marks
--accent-strong:#47D7AC; Mint Green: active markers, focus ring
--accent-soft:#D1F5EA;   active nav background, selected
--primary:#06041F; --primary-ink:#FFFFFF;   primary buttons
--crit:#C8243A; --crit-dot:#F8485E; --crit-soft:#FDE2E6;
--warn:#9A5B12; --warn-dot:#F99068; --warn-soft:#FEF4D9;
--ok:#205463;   --ok-dot:#3AAB94;   --ok-soft:#D1F5EA;
--panel:#6240A8; --panel-soft:#EBE6F4;
--sponsor-soft:#FCE195; --attend:#13294B;
```
**Dark tokens:**
```
--bg:#131310; --surface:#171714; --sunk:#1E1E1B; --ink:#EFF1F4; --muted:#8893A5; --faint:#4E5E78;
--line:rgba(239,241,244,.10); --line-soft:rgba(239,241,244,.06);
--accent:#75E1C1; --accent-strong:#47D7AC; --accent-soft:rgba(71,215,172,.14); --accent-mark:#75E1C1;
--primary:#EFF1F4; --primary-ink:#131310;
--crit:#FFB3BD; --crit-dot:#F8485E; --crit-soft:rgba(248,72,94,.22);
--warn:#FCE195; --warn-dot:#F99068; --warn-soft:rgba(249,144,104,.20);
--ok:#A3EBD5; --ok-dot:#47D7AC; --ok-soft:rgba(71,215,172,.14);
```
Map them onto TryPost's variables (for example `--background` = bg, `--card` and `--popover` = surface, `--foreground` = ink, `--muted-foreground` = muted, `--border` and `--input` = line, `--primary` family = the petrol primary for primary buttons and the mint accent for selection, `--ring` = accent-strong, `--sidebar` = surface, `--sidebar-accent` = accent-soft, `--destructive` = crit). Remove TryPost's violet entirely: no purple anywhere (`--primary-strong` and `--primary-text` included).

**Shapes.** Cards and dialogs 12px radius, 1px `--line` border, no heavy shadows (at most `0 1px 2px rgba(6,4,31,.04)` on inputs). Buttons and inputs 8px radius, 32px high, 13px weight 500; primary button = petrol background, white text. Chips 6px radius, 12px weight 500, 20px line height, `--sunk` background with a `--line` border; status chips are borderless on their soft colour with a 6px dot.

**Shell.**
- The sidebar becomes an icon rail by default: 56px wide, `--surface` background, right border `--line`. Icons 16px stroke 1.6 in `--muted`; a 36px square hover area with 8px radius (`--sunk` on hover); the active item has `--accent-soft` background and a 3px Mint (`--accent-strong`) bar on its left edge; labels show as a dark tooltip on hover. The rail may still expand when the author toggles it, but it starts collapsed. Channels appear in the rail as their avatars.
- A 52px top bar on `--surface` with a bottom border, the page title on the left in 14px weight 600, actions on the right.
- Page content on `--bg` with 20px top and 24px side padding; white cards on it.
- Small section headings, table headers, column headers in the calendar, and form labels: Roboto Mono 11px, uppercase, letter-spacing .04em, `--muted`.

**States** (from rule 5):
- Draft: neutral chip (`--sunk`, `--line` border, `--muted` text).
- Planned: `--accent-soft` background, `--accent` text, `--accent-mark` dot.
- Published: `--ok-soft` background, `--ok` text, `--ok-dot` dot.

## Constraints

- All changes live in `trypost/upstream/` and are recorded as patch files in `trypost/patches/` (numbered after the existing `0001` and `0002`, one per concern: navigation and logo, manual publishing, theme), each applying cleanly on a fresh checkout of upstream commit `69c8de8` after the earlier patches. Never commit `upstream/` itself (it is git-ignored).
- The image builds with `docker compose -f trypost/compose.local.yaml build app` and runs with `docker compose -f trypost/compose.local.yaml up -d app`.
- British English and no em or en dashes in any text added to the UI or the docs.
- Nothing in TryPost's database is deleted.
