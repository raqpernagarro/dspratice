# Nagarro Presentation Studio

Build on-brand Nagarro decks — generate them with AI, edit them on a real
canvas, and export editable PowerPoint and PDF. Everything runs on your own
laptop; nothing is uploaded anywhere.

---

## Getting started

**1. Install Node.js** (once, if you don't have it)
Download the **LTS** version from [nodejs.org](https://nodejs.org) and install it.

**2. Double-click `Start Studio`**
The first run installs what it needs and takes a minute or two. After that it
starts in a couple of seconds. Your browser opens automatically.

Leave the Terminal window open while you work — closing it stops the studio.

That's it. There is nothing to configure.

### To use the AI features

Generating and editing with AI needs the **Claude CLI** on your machine:

1. Install it from [claude.com/claude-code](https://claude.com/claude-code)
2. Open Terminal, run `claude`, and sign in once

Everything else — templates, manual editing, presenting, export — works
without it.

---

## Updating

Double-click **`Update Studio`**. It pulls the latest version and updates
dependencies.

Your presentations are not touched by an update. They live inside this folder,
and updating only ever changes the app's own files:

    product/data/                            your presentations
    product/infrastructure/identity/store/   sign-in details
    assets/uploads/                          images you added to slides

**Important:** because your work lives in this folder, do not replace the whole
folder with a fresh copy — that would take your presentations with it. Use
`Update Studio`, which updates the app in place and leaves your work alone.
If you ever do need a clean copy, back up the three paths above first.

If you have edited files inside the folder yourself, the updater stops and
tells you rather than overwriting your changes.

---

## What you get

| | |
|---|---|
| **Create** | Describe a deck and let AI draft it, import a `.pptx`, or start from a template |
| **Edit** | Click any text on the slide to change it; ask the AI panel for changes and accept or reject each one |
| **Templates** | The full library of approved Nagarro master slides — the brand system, already built |
| **Present** | Full-screen presenter view |
| **Export** | Editable `.pptx` and pixel-accurate `.pdf` |

---

## Troubleshooting

**"Node.js is not installed"**
Install the LTS build from [nodejs.org](https://nodejs.org), then try again.

**The browser opens but nothing loads**
Give it a few seconds on the first run — it may still be installing. If it
persists, check the Terminal window for a message.

**"The Claude CLI isn't installed"**
Expected if you skipped that step. See *To use the AI features* above.

**Port already in use**
It picks a free port automatically. If the studio is already open in another
tab, the new window may be on a different port — use the address printed in
the Terminal window.

---

## For maintainers

Slide-authoring rules, the template library, and the brand system are
documented in [`CLAUDE.md`](CLAUDE.md) and [`Design.md`](Design.md).

```bash
npm start                  # run the studio (UI + API on one port)
npm test                   # the test suite
npm run auth:create-user   # add a real password account
```

Exporting happens in the app — the Export button in the editor. There is no
command-line exporter.

Other entry points, once the studio is running:

| URL | |
|---|---|
| `/` | the studio |
| `/presentations.html` | every presentation in the workspace |
| `/templates.html` | browse the full brand master-slide library, rendered live |
| `/present.html?id=<id>` | full-screen presenter view |

The studio listens on `127.0.0.1` only — it is not reachable from other
machines on your network, by design. `NPS_HOST` overrides that if you
deliberately want to demo from your own laptop.
