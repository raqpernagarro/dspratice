<!--
  The roadmap the pitch deck shows. Move a line between sections when its status changes:
  "Done" feeds the "What's built" slide, "In progress" and "Ideas" feed "What's next".
  One item per line: - **Title**: one sentence on what it is or why it matters.
-->

## Done
- **Every Base UI component**: built in React and in Figma to the same level of detail, from Button to Toast.
- **Spec-driven generation**: one spec per component produces Figma builds, token CSS, configurator entries and docs.
- **Semantic token system**: the same token names in Figma and code, with Light and Dark modes.
- **Figma–code parity check**: a script proves every Figma variant is bound to the tokens the spec expects.
- **DS Configurator**: tune color, type, shape, density and per-component overrides, with a live preview.
- **Figma plugin**: moves themes and overrides into Figma on any paid plan, without the Enterprise API.
- **Figma documentation**: a docs panel per component, generated from its spec, on category pages.
- **GitHub template**: a protected repository that client projects start from with one click.
- **Automated tests**: every story renders in a browser, and accessibility problems fail the tests.

## In progress
- **Pitch deck automation**: this deck rebuilds itself when a pull request labelled `pitch` is merged.

## Ideas
- **Checks on every pull request**: tests and the generated-files check run automatically before anything merges.
- **Code Connect**: Figma's Dev Mode shows the real React code for every component, generated from the specs.
- **Client-ready starter**: a clean golden Figma file, the icon library included, and a new-client checklist.
- **Contrast proof**: every text-on-background pairing tested in Light and Dark, per component.
- **Behavior tests**: scripts that click, type and press keys, for the key components.
- **Installable package**: client apps install the components instead of copying them.
- **Brand from a URL**: pull a client's colors from their site or logo and pre-fill the configurator.
- **Density and motion tokens**: compact and comfortable modes, plus duration and easing tokens.
- **Beyond Base UI**: Data Table, Date Picker, Badge, Card, Skeleton, Breadcrumb, Pagination, Empty State.
- **Patterns and templates**: login, settings, dashboard and form wizard, built only from the system.
- **AI-ready docs**: a guide generated from the specs that tells AI agents how to use the system.
- **Drift bot**: compares Figma with the specs on a schedule and reports changes in plain language.
- **Other frameworks**: generate Angular or Web Components from the same specs.
