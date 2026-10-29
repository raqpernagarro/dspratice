// Template: main/split-07 — a proportional-bubble chart: pageHeader on the left with
// three overlapping circles (sized by value) on the right, each carrying a topic, a big
// figure and a description. Source Figma frame 342:40050.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

// d = diameter (px); left/top = position of the circle box within the chart area (px).
// Render order is back→front, so list the largest first.
const BUBBLES = [
  { d: 780, left: 1020, top: 0, bg: "var(--fill-petrol,#06041f)", fg: "var(--fg-on-solid,#fff)",
    topic: "Topic Name", stat: "64,2%", desc: "Description goes here" },
  { d: 430, left: 660, top: 322, bg: "var(--fill-mid,#8893a5)", fg: "#fff",
    topic: "Topic Name", stat: "64,2%", desc: "Description goes here" },
  { d: 290, left: 470, top: 494, bg: "var(--fill-grey,#c4c9d2)", fg: "var(--fg-100,#010716)",
    topic: "Topic Name", stat: "64,2%", desc: "Description goes here" },
];

export default {
  name: "main/split-07", slide: -25, figmaNode: "342:40050",
  family: "main", role: "chart", shape: "chart", theme: "light", chrome: false,
  use: "A proportional-bubble chart — heading on the left, three overlapping circles sized by value with a topic, figure and description each.",
  media: [], capacity: { items: 3, min: 2, max: 4 },
  slots: { images: 0, titles: 1, body: 1, stats: 3, icons: 0 },
  description: "main/split-07 — heading left, 3 overlapping proportional bubbles right.",
  intent: { bestFor: ["two to four amounts compared by size, each with a short explanation"], holds: "2–4 amounts on one scale, each a topic, figure and line", itemChars: 60, avoid: ["dates or milestones", "amounts on different units"], feel: "data", needs: ["a comparable figure per item"] },
  schema: {
    caption: "string — eyebrow", title: "string — heading", intro: "string — intro paragraph",
    bubbles: "array of { d, left, top, bg, fg, topic, stat, desc }  (largest first)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title",
    intro: "We help our clients transform innovative ideas into inspiring brands, amazing products and cutting edge experiences that touch millions.",
    bubbles: BUBBLES,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const bubbles = s.bubbles || BUBBLES;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-sp7 reveal">
          <div class="side">
            ${pageHeader({ caption: s.caption, title: s.title ?? "", intro: s.intro })}
          </div>
          <div class="bubbles">
            ${bubbles.map((b) => `<div class="bub" style="width:${b.d}px;height:${b.d}px;left:${b.left}px;top:${b.top}px;background:${b.bg};color:${b.fg};">
              <div class="in">
                <span class="tp">${esc(b.topic)}</span>
                <span class="st">${esc(b.stat)}</span>
                <span class="ds">${esc(b.desc)}</span>
              </div>
            </div>`).join("")}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
