# Nagarro DS Starter Pack

A design system you start client projects from. It has every [Base UI](https://base-ui.com/react/components) component, built in React and in Figma to the same level of detail, on one semantic token system.

Each component is described once, in a **spec**. Code, Figma, the theme configurator and the docs are all generated from that spec, so they don't drift apart.

> **Starting a client project?** Use **Use this template** on GitHub. You get a separate copy of this repo with a fresh history. Repository settings, rules and secrets don't copy over; set them up again in the new repo.

## What's inside

| | |
|---|---|
| **Components** | All Base UI components, from Button to Toast, as React wrappers with Storybook stories and docs. Code and Figma match: `npm run ds:parity` checks it. |
| **Tokens** | Semantic tokens (`color/*`, `size/*`, `space/*`, `shape/*`, `font/*`) with the same names in Figma and code. Light and Dark modes. |
| **Figma file** | Component sets bound to the tokens, with a documentation panel per component, grouped on category pages. |
| **DS Configurator** | Your design system's own site: home, docs, token reference and versions. **Edit system** tunes the theme (color, type, shape, density, depth, component overrides) with sliders or an agent, prototypes screens and edits the written guidance. Saving writes `ds.project.json`. |
| **Figma plugin** | Moves variables between Figma and the configurator. Works on any paid Figma plan, without the Enterprise REST API. |

## Quick start

You need **Node.js 22** and **npm**.

```bash
npm install
npm install --prefix variables-github-action
npm run storybook        # components and docs: http://localhost:6006
npm run editor:dev       # DS Configurator:     http://localhost:4175
npm run ds:reset         # Back to the starter system: deletes the saved system and its versions
```

`npm run help` lists every command, grouped, with a short description.

### Connecting the built-in agent

The configurator's agent styles a theme from a description, answers questions in the docs and builds screens. It runs on Claude, connected one of two ways (**Agent settings → How should the agent connect to Claude?**):

- **My Claude plan (this computer).** Included in your Claude plan (Pro, Max, Team or Enterprise), no API credits. Only works while `npm run editor:dev` runs on your computer. Install [Claude Code](https://claude.com/claude-code), run `claude` in a terminal and log in with your Claude account once; the settings then show **✓ Found, logged in**. This is the default when it's available.
- **API key.** Works anywhere, including the published site. Billed per use to the key's account. Create one in the [Claude Console](https://platform.claude.com/settings/keys); it's saved in your browser only.

The Ask panel shows which one is in use. Details: [docs §3.1d](docs/DESIGN_TOKENS_AND_FIGMA_SYNC.md#31d-the-agent-two-ways-to-connect-to-claude).

### Connecting to Figma (only for the sync commands)

Copy `variables-github-action/.env.example` to `variables-github-action/.env`, then fill in:

- `FILE_KEY`: the key from your Figma file's URL (`figma.com/design/<FILE_KEY>/…`)
- `PERSONAL_ACCESS_TOKEN`: a Figma personal access token

`.env` is never committed. Keep tokens out of every other file too.

For the Figma plugin, see [figma-plugin/README.md](figma-plugin/README.md).

## How the project is organized

```
stories/base-ui/
  components/<slug>/   one folder per component: React wrapper, spec, styles, generated token CSS
  spec/                spec types, the list of all specs, categories
  tokens/              semantic tokens pulled from Figma
semantic-editor/       the DS Configurator (Vite + React)
figma-plugin/          the DS Configurator Figma plugin
scripts/ds/            generators: token CSS, Figma build and bind snippets, parity check, Figma docs
variables-github-action/  Figma Variables REST sync
docs/                  the full reference and the token naming spec
```

## Working on it

- **Change a component:** edit its spec (`<slug>.spec.ts`), then run `npm run ds:generate`. Never edit generated files (`*.tokens.css`, `anatomy.generated.json`) by hand.
- **Add a component:** follow [docs §2a.3](docs/DESIGN_TOKENS_AND_FIGMA_SYNC.md#2a3-adding-a-component).
- **Name a new token:** follow the naming spec in [docs/Tokens-semantic-v2.xlsx](docs/Tokens-semantic-v2.xlsx).
- **Get changes in:** `main` is protected. Work on a branch, open a pull request, squash-merge.

## Pitch deck

A presentation about the starter pack, rebuilt from [pitch/](pitch/README.md) whenever a pull request labelled `pitch` is merged. The latest version is on the [Pitch deck (latest)](https://github.com/nagarro-dv/ds-starter-pack/releases/tag/pitch-latest) release.

## Documentation

[docs/DESIGN_TOKENS_AND_FIGMA_SYNC.md](docs/DESIGN_TOKENS_AND_FIGMA_SYNC.md) is the full reference: token model, component specs, configurator architecture, Figma sync and how to extend the system.

Building UI with an AI agent (Claude, Copilot, Cursor…)? Point it at [llms.txt](llms.txt): it links to the components, tokens and rules in [docs/ai/](docs/ai/), generated from the specs by `npm run ds:ai-docs`.

## License

Internal Nagarro project. All rights reserved.

Built on [Base UI](https://github.com/mui/base-ui) (MIT), [Phosphor Icons](https://phosphoricons.com) (MIT) and [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk) (SIL Open Font License).
