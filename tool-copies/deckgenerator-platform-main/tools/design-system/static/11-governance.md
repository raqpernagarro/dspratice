# Governance

## Where the truth lives

- **Figma** ("Master Slides") is where master slides are designed.
- **The `Presentation_v1` repository** is where they are implemented: one module per template in `js/templates/`, styling in `css/primitives.css`, tokens in `css/tokens.css`. Figma → HTML is the canonical pipeline.
- **This design system** is a published snapshot of that repository (`{{SOURCE_REF}}`, {{SOURCE_DATE}}): the same templates, tokens, fonts and frame, bundled so anyone can read and use them without the repository. When the repository changes, rebuild it with `node tools/design-system/build.mjs` and republish; don't edit slide behaviour here.

## Master templates

The system supports several Master Templates, each a self-contained brand library with its own tokens. Today there is one: this v2 library. A deck is based on exactly one master. Never mix templates from different masters in one deck.

## Adding a slide

If no master slide fits the content:

1. Don't invent a free-form slide. First try to compose the content from existing templates (split it across two slides, or use a sibling with a different capacity).
2. If it still doesn't fit, propose a new **deck-specific** template: it follows the module contract (`js/templates/_CONTRACT.md`), uses the frame (`topBar`, `pageHeader`, `footerBar`), the tokens and the `.v2f-*` primitives, and sets `excludeFromMaster: true`.
3. A deck-specific template enters the master library only with **explicit approval**. After every deck generation, ask whether the new deck-specific slides should be promoted. Never promote silently.

## Changing tokens

Token values here mirror `css/tokens.css` and the dark-theme overrides in `css/deck.css`. Change them in the repository first, then re-sync. Each slide pins its own theme's colours, so an edit made only on this page does not reach the rendered slides.

## Known gaps

- The client logos, device frames and example artwork in `media/` are only those the template examples reference. The full client-logo set stays in the repository.
- Photos are re-encoded for screen (1440px long side).
- `Design.md` in the repository still lists v1 values (84px margin, 128px hero); this system follows the v2 tokens (40px margin, 100px `Heading1`) that the templates actually use.
