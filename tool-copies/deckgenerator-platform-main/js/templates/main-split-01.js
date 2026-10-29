// Template: main/split-01 — a bold heading (centred) with a grey caption anchored to
// the bottom on the left, and a full-height photo on the right. Source Figma frame
// 342:37478.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { plScene } from "../planning-blocks.js";

export default {
  name: "main/split-01", slide: -56, figmaNode: "342:37478",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A bold heading with a grey supporting caption on the left, alongside a full-height photo on the right.",
  media: ["photo"], capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "main/split-01 — heading + caption left, full-height photo right.",
  schema: {
    title: "string — heading", caption: "string — grey caption", image: "photo URL",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "A global team united by a singular mission: transforming complex human problems into elegant solutions.",
    caption: "We work as an extension of your team, embedding designers who are carefully matched to your goals and ways of working, so they can contribute from day one.",
    image: plScene(1),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-split1 reveal">
          <div class="v2f-mn-split1-left">
            <div class="v2f-mn-split1-headwrap"><p class="v2f-mn-h">${esc(s.title ?? "")}</p></div>
            ${s.caption ? `<p class="v2f-mn-split1-sub">${esc(s.caption)}</p>` : ""}
          </div>
          <div class="v2f-mn-split1-photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
