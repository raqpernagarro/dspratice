// Template: strategy/grid-07 — "Onion Diagram": bottom-nested labelled circles on
// the left beside a right text column. Light theme.
// Source Figma frame 109:8986 (Strategy).
import { footerBar } from "../frame.js";
import { stOnionOffset, stTextCol } from "../strategy-blocks.js";

export default {
  name: "strategy/grid-07",
  slide: 149,
  figmaNode: "109:8986",
  family: "strategy",
  role: "diagram",
  shape: "onion-split",
  theme: "light",
  chrome: false,
  use: "A layered onion model: nested circles sharing a base, each layer labelled with a title + line, explained by a right text column.",
  media: [],
  capacity: { items: 4, min: 3, max: 5 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "strategy/grid-07 — bottom-nested labelled onion layers + a right text column.",
  schema: {
    caption: "string — eyebrow", title: "string", subtitle: "string — muted 2nd line",
    layers: "array of { title, text } (outer → inner)",
    body: "array of paragraph strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Onion Diagram", subtitle: "Subtitle",
    layers: Array(4).fill(0).map(() => ({ title: "Title", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." })),
    body: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "153" },
  },
  render(s) {
    return `<div class="v2f-root">
      <div class="v2f-st-split reveal">
        ${stOnionOffset(s.layers || [])}
        ${stTextCol({ meta: s.meta, caption: s.caption, title: s.title, subtitle: s.subtitle, body: s.body, side: "right" })}
      </div>
      ${footerBar(s.footer)}
    </div>`;
  },
};
