# TryPost on this Mac

Local, single-user TryPost used as the Marketing Studio workspace. Open it at http://localhost:8000. It only listens on 127.0.0.1.

## Start and stop

After a reboot, start the Colima VM first. The TryPost containers then restart on their own.

```bash
colima start
```

```bash
docker compose -f trypost/compose.local.yaml up -d
```

```bash
docker compose -f trypost/compose.local.yaml down
```

## Configuration

- Settings and secrets are in `trypost/.env` (gitignored, mode 600). The local test login is recorded there as comments.
- AI goes through the Claude Code CLI on this Mac, not an API key: see "AI through the Claude CLI" below. The API route is still there if you want it (`AI_TEXT_PROVIDER=anthropic`, a key in `ANTHROPIC_API_KEY`, then `up -d`).
- PostHog telemetry is off (`POSTHOG_ENABLED=false`).
- `MANUAL_PUBLISHING=true` keeps TryPost from ever sending a post (see "The author's workspace" below).

## The author's workspace

TryPost is changed into the author's private post workspace (brief: `design/brief.md`, 21 October 2026). The five rulings, in short:

1. **Purpose.** A place to create posts, see them on the calendar or the list, and manage them. Nothing is ever sent to a network from TryPost; the author posts by hand and marks the post published herself.
2. **Navigation.** The sidebar keeps New post, Create, Publish, the channels, settings and the user menu. Insights and Repurpose are gone from every menu, the command palette and the channel links; their pages and data stay in the code, unlinked.
3. **No logos.** No TryPost mark or wordmark anywhere in the app (sidebar, mobile bar, login and register, onboarding). The browser tab says "Marketing Studio" (`APP_NAME` in `.env`, also passed to the build). Channel avatars and platform badges stay.
4. **Manual publishing.** The composer has one **Save**: the post stays a draft, and a date picked in the date menu is kept as its planned date. Publish now, Schedule and Add to queue are gone.
5. **Three states, never failed or sent.** A post is **Draft** (no date), **Planned** (a date, not published) or **Published** (it carries the `posted` label). Chips, the Publish tabs, the calendar filter and the counts show only these. A post TryPost failed to send before the change shows as Draft or Planned and can be edited; its stored status is left as it is.

The look follows the Events Radar design system (Inter and Roboto Mono, the Nagarro light and dark tokens, the 56px icon rail and the 52px top bar), set mostly through the theme variables in `upstream/resources/css/app.css`.

### The flag

`MANUAL_PUBLISHING` in `.env` (default `true` in `upstream/config/trypost.php`, read as `config('trypost.manual_publishing')`). While it is on:

- the publish jobs (`PublishPost`, `PublishToSocialPlatform`) and `posts:process-scheduled` return before doing anything, so no post is published, no schedule fires, no limit retry is sent and no network is called;
- the API and the MCP tools refuse `status: scheduled` and `status: publishing` with a 422 that names manual publishing, and the MCP publish tool refuses outright; drafts, with or without `scheduled_at`, work as before, so the sync is unaffected;
- the UI shows the three states and the Mark as published action.

Changing it needs `docker compose -f compose.local.yaml up -d --force-recreate app`, no rebuild. The upstream tests run with it off (`phpunit.xml`); `tests/Feature/ManualPublishingTest.php` turns it on.

### Marking a post published

After posting by hand, open the post's menu (the three dots on a list card or in a calendar post's preview) or its details, and choose **Mark as published**; **Mark as not published** undoes it. In the composer the same toggle sits next to **Save** and is saved with the post. It adds or removes the workspace's `posted` label (created in colour `#C0E50A` if it is missing), the label the sync reads on `pull` to mark the file published. Nothing is sent anywhere.

## Manual channels (drafting without connected accounts)

In TryPost v2, every per-network post must belong to a channel. To draft without connecting real accounts, the workspace has placeholder channels named "LinkedIn", "Instagram", "Viva Engage" and "Substack" (usernames `manual-linkedin`, `manual-instagram`, `manual-facebook`, `manual-mastodon`; they were called "... (manual)" until 21 October 2026). X is the author's connected account; its placeholder, `manual-x`, is no longer in the workspace, so if the real X account were removed the sync would report X drafts as having no channel. TryPost has no Viva Engage or Substack platform, so those two borrow one: Viva Engage sits on a `facebook` channel and Substack on a `mastodon` one. The sync maps each surface to its platform through `SURFACE_PLATFORMS` in `scripts/lib/sync_plan.py` and finds the channel by its `manual-<platform>` username.

- They are stored with status `disconnected`. Background jobs only touch `connected` accounts, so they never call LinkedIn, Instagram, X, Facebook or Mastodon.
- The red dot on each one is expected.
- Use **Save** in the composer. There is no Publish button any more (see "The author's workspace").
- To post, copy the text from the draft into the network by hand.

To publish for real later, connect the actual account in TryPost (it needs that network's developer app keys in `.env`), then delete the placeholder channel.

## Connected accounts

The sync sends a surface's new drafts to a connected account of its own network when there is one (LinkedIn, Instagram, X; Instagram also through Facebook) and otherwise to its manual channel; Viva Engage and Substack only ever use their manual channels, because their platforms are borrowed (`pick_channels` in `scripts/lib/sync_plan.py`). Every post is still created as a draft and an update never sends a status, so the sync publishes nothing; TryPost's own publisher only takes posts whose status is `scheduled`, and with manual publishing on it takes none at all. The author posts by hand and marks the post published in TryPost.

An X thread goes to TryPost as its first post plus `meta.thread_replies`, the form TryPost publishes as a thread; the file keeps the posts split by lines of `---`, and the sync compares the two forms as one text.

When another network is connected, move its existing drafts from the placeholder to the new account in one go (here for X; change `manual-x` and `'x'`):

```bash
docker compose -f compose.local.yaml exec -T app php artisan tinker --execute="
\$from = App\Models\SocialAccount::where('username', 'manual-x')->firstOrFail();
\$to = App\Models\SocialAccount::where('platform', 'x')->where('status', 'connected')->where('username', 'not like', 'manual-%')->firstOrFail();
echo App\Models\Post::where('social_account_id', \$from->id)->where('status', App\Enums\Post\Status::Draft)->where('publish_status', App\Enums\Post\PublishStatus::Pending)->toBase()->update(array_merge(['social_account_id' => \$to->id, 'publication_updated_at' => now()], \$to->channelSnapshot())).' moved'.PHP_EOL;
"
```

The post ids stay the same, so the files need no change. The empty placeholder can stay; it takes drafts again if the real account is ever disconnected.

To connect a network, its developer app keys go into `.env` (for X: `X_CLIENT_ID`, `X_CLIENT_SECRET` from the app's OAuth 2.0 settings, and `X_CLIENT_REDIRECT=http://localhost:8000/accounts/x/callback`), then `up -d --force-recreate app`. Connect with **Connect a new account**, not the reconnect button on a placeholder: TryPost refuses a reconnect that returns a different identity ("That is a different account").

## Icons for the borrowed platforms

TryPost draws a channel's small badge, its logo in lists and its platform name from the platform value, so "Viva Engage" would show Facebook and "Substack" Mastodon. Our build changes that for those two platforms only (no real Facebook or Mastodon account is used here):

- The logos are the author's, in `icons/` (`viva-engage.png`, 512 by 512, and `substack.png`, 225 by 225, supplied on 21 October 2026; the `*-logo.png` files are the untouched originals). `compose.local.yaml` mounts them at `/var/www/html/public/images/accounts/viva-engage.png` and `substack.png`, new paths, so no browser cache of the old Facebook and Mastodon images can show through. TryPost's own `facebook.png` and `mastodon.png` are left as they ship.
- `patches/0002-borrowed-platform-logos-and-labels.patch` makes the app load those two paths for the `facebook` and `mastodon` platforms (the small circle badge on every channel avatar, the logos in the undated panel, repurpose and analytics) and name them "Viva Engage" and "Substack" in tooltips and labels.
- `patches/0001-borrowed-platform-badges.patch` does the same for the glyph icons in the sidebar and calendar chips, which otherwise draw the brand's own symbol.
- Each channel's large avatar (`social_accounts.avatar_url`) points at a copy of the same file under the storage volume (`storage/app/public/social-accounts/`). To refresh it after changing a logo: `docker compose -f compose.local.yaml cp icons/viva-engage.png app:/var/www/html/storage/app/public/social-accounts/viva-engage.png` (and the same for `substack.png`).

To change a logo, overwrite the file in `icons/` and run `docker compose -f compose.local.yaml up -d`; no rebuild is needed for a new picture, only for a new path.

## Our patches

In this copy, `upstream/` already carries every patch below, so the first build needs nothing applied. The notes on re-applying them are for a later upgrade.

The app no longer runs the published image. `compose.local.yaml` builds `trypost-local:patched` from the source checkout in `upstream/` (git-ignored, at upstream commit `69c8de8` as of 21 October 2026) with the patches under `patches/` applied to it. The Vite build arguments come from `.env` (`APP_NAME`, the `REVERB_*` values), because the WebSocket key is baked into the frontend.

- `patches/0001-borrowed-platform-badges.patch`: `resources/js/components/PlatformBrandIcon.vue` shows the mounted logo for the two borrowed platforms.
- `patches/0002-borrowed-platform-logos-and-labels.patch`: `resources/js/composables/usePlatformLogo.ts` maps `facebook` and `mastodon` to the Viva Engage and Substack logos and names.
- `patches/0003-navigation-without-insights-repurpose-and-logo.patch`: no Insights or Repurpose in the sidebar, the channel links, the command palette or the metrics band; no TryPost logo in the sidebar, the sign-in pages and the other layouts; the app name falls back to "Marketing Studio".
- `patches/0004-manual-publishing.patch`: the `MANUAL_PUBLISHING` flag and its guards (publish jobs, scheduled-posts command, API and MCP statuses), the three states (`app/Support/ManualPublishing.php` on the server, `resources/js/composables/useManualStatus.ts` in the UI), the Publish tabs and calendar filter, Mark as published, the composer's single Save, and the tests.
- `patches/0005-events-radar-theme.patch`: the Events Radar tokens and fonts, the icon rail, the top bar and the shapes of buttons, inputs, chips, dialogs and menus. It also carries the mobile bar's logo removal (`AppSidebarLayout.vue`) and the hidden weekly goal (`PublishHeader.vue`), because those files belong to the theme too.
- `patches/0006-no-connection-warnings.patch`: with manual publishing on, the rail, the channel avatars and the channel list show no red "connection lost" dots or warnings (the placeholders are disconnected by design).

After an upstream upgrade (a new checkout in `upstream/`), re-apply every patch, in order, and rebuild:

```bash
git -C upstream apply ../patches/0001-borrowed-platform-badges.patch ../patches/0002-borrowed-platform-logos-and-labels.patch ../patches/0003-navigation-without-insights-repurpose-and-logo.patch ../patches/0004-manual-publishing.patch ../patches/0005-events-radar-theme.patch ../patches/0006-no-connection-warnings.patch
```

```bash
docker compose -f compose.local.yaml build app && docker compose -f compose.local.yaml up -d
```

A build takes a while (composer, npm, Vite); `git -C upstream diff` shows what the checkout carries beyond upstream, and `git -C upstream diff > patches/<name>.patch` records a new patch.

## AI through the Claude CLI

TryPost's AI features (the composer assistant, alt text, idea generation) speak the OpenAI chat protocol to any URL, so `.env` points them at a small server on this Mac that answers through the Claude Code CLI with the author's own login:

- `AI_TEXT_PROVIDER=openai-compatible`, `OPENAI_COMPATIBLE_URL=http://host.docker.internal:8765/v1`, `OPENAI_COMPATIBLE_API_KEY=local-claude-cli`, `OPENAI_COMPATIBLE_TEXT_MODEL=sonnet`.
- The server is `claude-bridge/server.py` (standard library). Start it with `sh claude-bridge/run.sh`, or install it to start at login and stay up:

```bash
cp claude-bridge/com.marketing-studio.claude-bridge.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.marketing-studio.claude-bridge.plist
```

- The CLI must be logged in: run `claude` once in a terminal and sign in when it asks. Until then every AI call in TryPost fails with the CLI's own message ("OAuth session expired"), which `claude-bridge/bridge.log` records with a timestamp (never the prompt).
- The bridge listens on the Mac's loopback only; the container reaches it as `host.docker.internal`. The bearer key is a local shared secret, not an API key. Each AI call is one `claude -p` run on your subscription, so TryPost's AI counts against the same usage limits as a Claude Code session. An image sent for alt text is saved to a temp file for the CLI to read and deleted afterwards.
- `/health` on port 8765 answers `{"ok": true}` when the bridge is up.

## Adding a manual channel

On a fresh install, `sh trypost/make-channels.sh` creates all five placeholder channels at once (see `INSTALL.md`). The rest of this section is for adding another one later.

TryPost has no screen for a channel that is not connected, so a manual channel is a row copied from any `manual-*` row in its database (`manual-linkedin` when the channels were added). This is how the Viva Engage and Substack channels were added on 21 October 2026, with the source and the status now spelt out so the command needs no particular row. Run it from `trypost/` with the stack up:

```bash
docker compose -f compose.local.yaml exec -T app php artisan tinker --execute="
\$src = App\Models\SocialAccount::where('username', 'like', 'manual-%')->orderBy('created_at')->firstOrFail();
foreach ([['facebook', 'manual-facebook', 'Viva Engage'], ['mastodon', 'manual-mastodon', 'Substack']] as [\$platform, \$username, \$name]) {
    if (App\Models\SocialAccount::where('username', \$username)->exists()) { echo 'exists '.\$username.PHP_EOL; continue; }
    \$row = \$src->replicate();
    \$row->platform = \$platform;
    \$row->platform_user_id = \$username;
    \$row->username = \$username;
    \$row->display_name = \$name;
    \$row->status = 'disconnected';
    \$row->position = null;
    \$row->disconnected_at = now();
    \$row->save();
    echo 'created '.\$username.' '.\$row->id.PHP_EOL;
}
"
```

- `replicate()` copies every column of the oldest `manual-*` row (the same workspace, the encrypted `manual-placeholder` token, timezone `UTC`) and gives the copy a fresh id. The platform, the username (and `platform_user_id`, which matches it on every manual row) and the display name change, and the status is set to `disconnected` whatever the source row holds, so no background job ever calls the network; the position goes to the end of the list and `disconnected_at` to now, as the first three had. With no `manual-*` row at all the command stops at `firstOrFail()`.
- It skips a username that already exists, so running it twice changes nothing.
- The platform must be one of TryPost's own values (`App\Enums\SocialAccount\Platform`), and there can be only one manual channel per platform, because the sync keys them by platform.
- For another network, change the list in the `foreach`, then add the surface and its platform to `SURFACE_PLATFORMS`.

Check the result through the API (it should list the new channel with `status: disconnected`):

```bash
python3 -c "import sys; sys.path.insert(0, '.'); from pathlib import Path; from scripts.trypost_sync import _client_from_env; [print(a['platform'], a['username'], a['status']) for a in _client_from_env(Path('trypost/.env')).list_all('/api/social-accounts')]"
```

Run that one from the repository root. A push that finds no channel for a surface prints `failed <id>: no manual channel for surface <surface> (see trypost/README.md)` and carries on with the other pieces.

An essay's calendar draft edited in TryPost makes every push print `conflict <id>`: undo the edit, or delete the draft and run `python3 scripts/trypost_sync.py pull --relink`. That command relinks every missing piece in the workspace, not only that draft (an idea card deleted on purpose comes back on the next push instead of being archived), so run it only after a wipe, or once `python3 scripts/trypost_sync.py pull --dry-run` names no other missing piece.

## Upgrade

The app is built from `upstream/`, so TryPost only changes when you decide. To upgrade, take a new checkout into `upstream/`, re-apply the patches ("Our patches") and rebuild; the old steps for the published image follow for reference:

1. Stop the stack: `docker compose -f compose.local.yaml down`
2. Pull the new image: `docker pull ghcr.io/trypostit/trypost:latest`
3. Read its digest: `docker image inspect ghcr.io/trypostit/trypost:latest --format '{{index .RepoDigests 0}}'`
4. Put that value on the `image:` line in `compose.local.yaml` and update the date in the comment above it.
5. Start the stack again: `docker compose -f compose.local.yaml up -d`
6. Re-run the API spike from `docs/research/spike-trypost-api.md` to confirm drafts on the placeholder channels still work, then `python3 scripts/trypost_sync.py sync --dry-run`.

The source checkout in `upstream/` is only for reading the code. It is not used by the running stack and is not committed.
