// Template: main/split-02 — a grey heading (top) and a bold heading (bottom) on the
// left, with a three-photo mosaic (one tall + two stacked) on the right. Source Figma
// frame 342:37486.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";
import { plScene, plAvatar } from "../planning-blocks.js";

export default {
  name: "main/split-02", slide: -55, figmaNode: "342:37486",
  family: "main", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A grey lead heading and a bold closing heading on the left, with a three-photo mosaic on the right.",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 2, body: 0, stats: 0, icons: 0 },
  description: "main/split-02 — two-tier heading left, tall + stacked photo mosaic right.",
  schema: {
    lead: "string — grey lead heading", title: "string — bold closing heading",
    images: "array of three photo URLs",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    lead: "No single HQ.\nMany nations.\nLots of diversity.",
    title: "One manifesto.",
    images: [plScene(1), plAvatar(2), plScene(5)],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const im = s.images || [];
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-split2 reveal">
          <div class="v2f-mn-split2-left">
            <p class="v2f-mn-h muted" style="white-space:pre-line;">${esc(s.lead ?? "")}</p>
            <p class="v2f-mn-h">${esc(s.title ?? "")}</p>
          </div>
          <div class="v2f-mn-split2-photos">
            <div class="v2f-mn-split2-tall">${im[0] ? `<img src="${esc(im[0])}" alt="">` : ""}</div>
            <div class="v2f-mn-split2-stack">
              <div class="cell">${im[1] ? `<img src="${esc(im[1])}" alt="">` : ""}</div>
              <div class="cell">${im[2] ? `<img src="${esc(im[2])}" alt="">` : ""}</div>
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
