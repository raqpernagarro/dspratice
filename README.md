<p align="center">
  <img src="public/brand/nagarro-logo.svg" alt="Nagarro" height="48">
</p>

<p align="center">
  <img src="public/brand/3d/glass-a.jpg" alt="" width="30%">
  <img src="public/brand/3d/panel-teal.jpg" alt="" width="30%">
  <img src="public/brand/3d/twist-3.jpg" alt="" width="30%">
</p>

# Nagarro Design Workspace

One place to start any design-systems job at Nagarro: responding to an RFP, preparing a client demo, checking a design system's AI readiness, or shaping an engagement offer. The workspace is an internal tool for the Nagarro design systems practice, built in the Nagarro Design look.

## Goals

- **One starting point.** Sellers, managers and designers describe the job and get routed to the right journey, instead of hunting across decks, folders and Figma files.
- **Design systems as a sales asset.** Show what a design system does for a client (the challenge, the fix, the review in code and Figma, AI using the system) in a guided demo we can present in meetings.
- **Projects stay honest.** Each project has its own live preview of its system, its unfinished work and its next steps. Projects stay in the browser of the person who made them, because of NDAs.
- **Engagement you can see.** A calendar of planned and published content, drawn from the practice's marketing files.
- **Practice tools in one place.** The configurator, the DSN site and the prototyping tooling open from the journeys they belong to.

The workspace has five areas: **Home**, **Projects**, **Demos**, **Engagement** and **Settings**. Start with Home.

## Quick start

```bash
npm run setup
npm run dev
open http://localhost:4300
```

`npm run setup` checks Node, installs dependencies and creates `.env.local` from the example. Everything runs on your machine. Sample clients and their figures are fictional.

For every command, optional key and integration, see the [tool guide](docs/tool-guide.md). For how the client demo works, see [docs/client-demo.md](docs/client-demo.md).

## For Nuno and Rui: run it and try it

The repository holds everything the workspace needs, including the practice tools: DSN and the DS Starter Pack in `sources/`, Presentation Studio and the Marketing Studio installer in `tool-copies/`. They are snapshots of your repositories; yours stay the source of truth.

1. **Node 22 or newer** ([nodejs.org](https://nodejs.org)). The workspace runs on 20, but the DS Configurator needs 22.
2. Clone, then `npm run setup` and `npm run dev`. Open <http://localhost:4300>.
3. Start a tool when a journey asks for it, for example the DS Configurator:

   ```bash
   npm run tools -- start starter
   ```

   `starter`, `dsn` or `studio`; the first start installs that tool's dependencies. `npm run tools` shows where each one runs from and whether it is up.
4. Follow [docs/try-it.md](docs/try-it.md): fifteen minutes, and what kind of feedback helps.

Optional: an `ANTHROPIC_API_KEY` in `.env.local` for AI drafts (without it, drafts are template-based and say so); the Claude CLI, signed in, only for generating decks in Presentation Studio; Microsoft Edge only for `npm run e2e`; Docker only for Marketing Studio's TryPost board. The DS Prototyping Tooling (ASSA ABLOY) is client material and is not in the repository; its page in the workspace says so.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [LICENSES.md](LICENSES.md) before you change anything.
