// Template: main/data-04 — an ascending column chart: pageHeader on the left, three
// bottom-anchored blocks stepping up to the right, each with a big figure above it and a
// topic + description inside. Source Figma frame 342:40071.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

// h = block height as % of the plot area; the big figure sits above each block.
const COLS = [
  { h: 30, bg: "var(--fill-petrol,#06041f)", fg: "var(--fg-on-solid,#fff)", stat: "64,2%",
    topic: "Topic Name", desc: "Description goes here" },
  { h: 72, bg: "var(--fill-mid,#8893a5)", fg: "#fff", stat: "64,2%",
    topic: "Topic Name", desc: "Description goes here" },
  { h: 92, bg: "var(--fill-grey,#c4c9d2)", fg: "var(--fg-100,#010716)", stat: "64,2%",
    topic: "Topic Name", desc: "Description goes here" },
];

export default {
  name: "main/data-04", slide: -24, figmaNode: "342:40071",
  family: "main", role: "chart", shape: "chart", theme: "light", chrome: false,
  use: "An ascending column chart — heading on the left, three stepped blocks with a big figure above and a topic + description inside each.",
  media: [], capacity: { items: 3, min: 2, max: 5 },
  slots: { images: 0, titles: 1, body: 1, stats: 3, icons: 0 },
  description: "main/data-04 — heading left, 3 ascending value blocks right.",
  intent: { bestFor: ["two to five ascending steps, each with a figure and a short topic"], holds: "2–5 stepped blocks, each a figure, topic and line", itemChars: 80, avoid: ["dates or milestones without figures", "falling values"], feel: "data", needs: ["a figure per step"] },
  schema: {
    caption: "string — eyebrow", title: "string — heading", intro: "string — intro paragraph",
    cols: "array of { h, bg, fg, stat, topic, desc }  (h = % of plot height)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title",
    intro: "We help our clients transform innovative ideas into inspiring brands, amazing products and cutting edge experiences that touch millions.",
    cols: COLS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const cols = s.cols || COLS;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-data4 reveal">
          <div class="side">
            ${pageHeader({ caption: s.caption, title: s.title ?? "", intro: s.intro })}
          </div>
          <div class="cols">
            ${cols.map((c) => `<div class="col">
              <span class="pct" style="color:${String(c.bg).includes("petrol") ? "var(--fg-100,#06041f)" : c.bg};">${esc(c.stat)}</span>
              <div class="blk" style="height:${c.h}%;background:${c.bg};color:${c.fg};">
                <span class="tp">${esc(c.topic)}</span>
                <span class="ds">${esc(c.desc)}</span>
              </div>
            </div>`).join("")}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
