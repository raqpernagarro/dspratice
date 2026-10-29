# DS-Ngr CLI

`ds-ngr` sets up and builds apps on DS-Ngr from your terminal. Use it to start a new app with your theme, add ready-made pages, look up how a component works, and connect your AI assistant to the design system.

Use the CLI when you're building the real app in your own codebase. On the docs site, **Prototype → Build with the CLI** builds the `create` command for you.

## Before you start

- **Node.js 20 or later.** Check with `node --version`.
- **A terminal** open in the folder where your app should go.

Nothing else needs installing: `npx` downloads the CLI from this site each time you start an app.

## Start a new app

**1. Create the app.** Run:

```bash
npx <docs site>/cli/ds-ngr-cli.tgz create my-app
```

It asks which page to start from (blank, dashboard, data page or form page), then writes the app into a new `my-app` folder.

**2. Run it.**

```bash
cd my-app
npm install
npm run dev
```

Open the address it prints, usually http://localhost:5173.

### Use your own theme

Pick your brand colour, font, shape and density on the [Brands](/brands) page. Its **Starter pack** card has a **Copy CLI command** button: the command already has your theme and starting page filled in. Paste it into your terminal.

To add a theme yourself, use the share link from Brands (**Copy share link**):

```bash
npx <docs site>/cli/ds-ngr-cli.tgz create my-app --page dashboard --theme "<share link>"
```

| Option | What it does |
|---|---|
| `--page` | Starting page: `blank`, `dashboard`, `data-page` or `form-page`. Skips the question |
| `--theme` | Your theme from Brands: paste its share link |
| `--brands all` | For a multi-brand theme, include every brand, not just the active one |

### What you get

A React + Vite app with DS-Ngr installed and your theme applied. It also includes `AGENTS.md` and `CLAUDE.md`, so AI coding assistants (Claude Code, Cursor, Copilot) follow the design system rules from the first prompt. The app's own `README.md` explains every file.

## Commands inside your app

The CLI comes installed in every app it creates. Run these from the app folder; no web address needed.

### Look up a component

```bash
npx ds-ngr docs DataTable
```

Prints what you need to use the component: its props and allowed values, variants, sizes, and the usage rules (when to use it, what to avoid). Run `npx ds-ngr docs` on its own to list every component.

Names aren't case-sensitive, so `npx ds-ngr docs datatable` works too. Add `--json` to get the same details as JSON, for scripts or AI assistants.

### Add a page

```bash
npx ds-ngr add
```

Lists the ready-made pages: dashboard, data page, kanban board, detail drawer, form page, settings, sign-in and AI chat. Then add one:

```bash
npx ds-ngr add data-page
```

This creates `src/pages/DataPage.tsx` and prints the line to import it. Each page is complete, with its own app frame. To show it, render it in `src/App.tsx` instead of `<Home />`.

The pages come with sample data. Replace it with your own, then delete the `// @ts-nocheck` line at the top of the file. That line only switches off type checking for the sample data.

| Option | What it does |
|---|---|
| `--name` | The file and component name, for example `--name Projects` |
| `--out` | The folder to write into (default `src/pages`) |
| `--force` | Overwrite a file that already exists |

### Connect your AI assistant

```bash
npx ds-ngr mcp --write
```

Connects Claude Code to the DS-Ngr MCP server for this project, so your assistant can look up components and draw prototypes on this site. Restart Claude Code afterwards.

For Cursor or VS Code, add `--client cursor` or `--client vscode`. Without `--write`, the command prints the setup so you can add it by hand. More on what the connection does: [Connect your AI via MCP](/prototype/mcp).

### Update the design system rules

```bash
npx ds-ngr agents
```

Refreshes the DS-Ngr rules in `AGENTS.md` to match the installed version of DS-Ngr. It only replaces the part between the `ds-ngr:start` and `ds-ngr:end` markers; your own project rules are kept. (`npm run ds:agents` does the same.)

## Add the CLI to an existing app

If your app wasn't created by the CLI but already uses DS-Ngr, install the CLI as a dev dependency:

```bash
npm install --save-dev <docs site>/cli/ds-ngr-cli.tgz
```

Then all the commands above work in that app.

## Look up a component without an app

Outside a DS-Ngr app, `docs` asks this site instead:

```bash
npx <docs site>/cli/ds-ngr-cli.tgz docs Tag
```

## Help

Run `npx ds-ngr --help` for the command list, or `npx ds-ngr <command> --help` for a command's options.

| Message | What to do |
|---|---|
| `ds-ngr is not installed here` | Run the command inside your app folder, after `npm install` |
| `already exists and isn't empty` | Pick another app name, or remove that folder |
| `No DS-Ngr site configured` | Add `--site <docs site>` to the command |
| `The site couldn't build the starter` | Try again in a minute. If it keeps failing, use **Download starter (.zip)** on Brands instead |
