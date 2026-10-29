// Template: main/grid-11 — heading + two intro columns above three overlapping mint
// domes (half-circles anchored to the baseline), each carrying a topic label.
// Source Figma frame 342:40281.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

// Two overlapping domes (cx = horizontal centre px), with three topic labels:
// one under each dome and one at the overlap.
const DOMES = [{ cx: 560 }, { cx: 1280 }];
const LABELS = [
  { cx: 560, topic: "Topic" },
  { cx: 920, topic: "Topic" },
  { cx: 1280, topic: "Topic" },
];

export default {
  name: "main/grid-11", slide: -19, figmaNode: "342:40281",
  family: "main", role: "content", shape: "diagram", theme: "light", chrome: false,
  use: "A heading + two intro columns above three overlapping mint domes, each labelled with a topic.",
  media: [], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 1, body: 2, stats: 0, icons: 0 },
  description: "main/grid-11 — heading + 2 intro columns, 3 overlapping mint domes below.",
  schema: {
    title: "string — heading", subtitle: "string — muted 2nd line",
    body: "array of 2 intro paragraph strings (right columns)",
    domes: "array of 2 { cx }", labels: "array of 3 { cx, topic }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Title", subtitle: "Subtitle",
    body: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    ],
    domes: DOMES, labels: LABELS,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const domes = s.domes || DOMES;
    const labels = s.labels || LABELS;
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-g11 reveal">
          <div class="head">
            <div class="ttl">
              ${s.title ? `<p class="t">${esc(s.title)}</p>` : ""}
              ${s.subtitle ? `<p class="s">${esc(s.subtitle)}</p>` : ""}
            </div>
            <div class="cols">${body}</div>
          </div>
          <div class="domes">
            ${domes.map((d) => `<span class="dome" style="left:${d.cx}px;"></span>`).join("")}
            ${labels.map((l) => `<span class="lb" style="left:${l.cx}px;">${esc(l.topic)}</span>`).join("")}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
