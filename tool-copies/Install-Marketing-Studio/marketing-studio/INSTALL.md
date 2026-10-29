# Installing Marketing Studio

For a Mac with Apple Silicon (M1 or later). It takes about 30 minutes, most of it waiting for the first build. You run every command in the Terminal app, from the `marketing-studio` folder unless a step says otherwise.

What you get:

- **Your brand workspace** in `brands/me/`: plain Markdown files with your voice, pillars and rules, and every idea and draft. These files are the source of truth.
- **The marketeer plugin** for Claude Code: skills that find ideas, write drafts for LinkedIn, Instagram, X, Viva Engage and Substack, score them and edit them.
- **A local TryPost** at http://localhost:8000: a calendar and board where you see, edit and approve the drafts. It never posts anything. You post by hand and mark the post as published.

## 1. Install the tools (once)

If you do not have Homebrew yet, install it first by following https://brew.sh. Then install Docker (through Colima, which is free) and Claude Code:

```bash
brew install colima docker docker-compose
```

```bash
mkdir -p ~/.docker && echo '{ "cliPluginsExtraDirs": ["/opt/homebrew/lib/docker/cli-plugins"] }' > ~/.docker/config.json
```

```bash
colima start --cpu 4 --memory 6
```

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Open a new Terminal window, run `claude` once and sign in with your Claude account when it asks. Then type `/exit`.

Check that everything answers:

```bash
docker compose version && claude --version && python3 --version
```

If `python3` asks you to install the command line developer tools, accept and run the check again.

## 2. Put the folder in place

Unzip `marketing-studio.zip` somewhere inside your home folder, for example `~/Claude/marketing-studio`, and go into it. It must stay inside your home folder: Colima only shares that folder with Docker, and outside it the Viva Engage and Substack logos come up blank.

```bash
cd ~/Claude/marketing-studio
```

## 3. Start TryPost

```bash
sh trypost/setup.sh
```

This writes `trypost/.env` with fresh secrets for your machine, builds the app and starts it. The first build takes 5 to 15 minutes. It ends with "TryPost is up at http://localhost:8000".

## 4. Create your account and channels

1. Create your login. TryPost has no sign-up page when it runs on your own Mac, so this script asks for your name, an email and a password. The account only exists on your Mac; any email works, nothing is sent.

   ```bash
   sh trypost/create-user.sh
   ```

   Then sign in at http://localhost:8000.
2. Create the placeholder channels the drafts sit on (LinkedIn, Instagram, X, Viva Engage, Substack):

   ```bash
   sh trypost/make-channels.sh
   ```

   It prints `created manual-linkedin` and so on. Their grey "disconnected" state is expected: they are never connected to the real networks.
3. In TryPost, open **Settings, Workspace, API keys** (http://localhost:8000/settings/workspace/api-keys), choose **Generate API Key**, copy it with the copy button, and paste it after `TRYPOST_API_KEY=` in `trypost/.env` (open it with `open -e trypost/.env`).
4. Check that the files and TryPost talk to each other:

   ```bash
   python3 scripts/trypost_sync.py sync --dry-run
   ```

## 5. Turn on the AI inside TryPost (optional)

TryPost's own AI buttons (the writing assistant, alt text) go through Claude Code on your Mac, with your own Claude account. Install the small bridge so it starts at every login:

```bash
sh trypost/claude-bridge/install-launch-agent.sh
```

It ends by printing `{"ok": true}`.

## 6. Fill in your brand

Everything the skills write comes from `brands/me/`. Before drafting, replace the text in square brackets in:

- `brand-profile.md`: who you are, your audiences, your pillars, your proof points.
- `voice.md`: how you write. Paste lines from your best posts.
- `swipe/`: five or more of your own published posts, one per file (see `swipe/README.md`).
- `sources.md`: the feeds and keywords the topic scout reads.
- `content-rules.md`, `kit.md` and `nagarro-overlay.md` when you need them.

## 7. Start writing

Open Claude Code in the folder:

```bash
claude
```

Run `/plugin` and check that `marketeer` is listed. If it is not, quit and run `claude plugin marketplace add .` once, then open `claude` again. Then try:

- `/marketeer:ideation` with a topic, to get an idea with angles and hooks;
- `/marketeer:write-social-post` to draft it for LinkedIn, Instagram and X;
- `/marketeer:score`, `/marketeer:brand-review` and `/marketeer:edit` to improve a draft;
- `python3 scripts/trypost_sync.py sync` to see the drafts in TryPost.

`README.md` describes every skill, the weekly plan and the approval flow.

## Every day

After a restart, start Docker first; TryPost then comes back on its own:

```bash
colima start
```

To stop TryPost:

```bash
docker compose -f trypost/compose.local.yaml down
```

## Good to know

- The system never publishes. Nothing connects to LinkedIn, Instagram, X, Viva Engage or Substack unless you connect an account yourself in TryPost (see `trypost/README.md`).
- Never share `trypost/.env`: it holds your secrets and your API key.
- Dates default to the Europe/Lisbon time zone (`timezone` in each piece).
- The rules the checker enforces (British English, no dashes, banned words) are in `evals/lib/checks.py`; `brands/me/content-rules.md` describes them.
- To check the install: `python3 -m unittest discover tests` and `python3 evals/run.py` should both pass.
