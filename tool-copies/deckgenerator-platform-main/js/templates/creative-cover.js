// Template: creative/cover — the opening cover of the Creative deck: a large bold
// statement title, vertically centred, on the standard light chrome. Source Figma
// frame 7:1227 (section "Creative", 14:1201).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

export default {
  name: "creative/cover", slide: 177, figmaNode: "7:1227",
  family: "creative", role: "cover", shape: "single", theme: "light", chrome: false,
  use: "The opening cover of the Creative deck — a large bold statement title.",
  media: [], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "creative/cover — big bold statement title, vertically centred.",
  schema: {
    title: "string — the bold statement title",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Mood boards and design layouts to present your creative concepts",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-cr-cover">
        ${topBar(s.meta)}
        <div class="v2f-cr-cover-mid reveal">
          <p class="v2f-cr-cover-title">${esc(s.title ?? "")}</p>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
