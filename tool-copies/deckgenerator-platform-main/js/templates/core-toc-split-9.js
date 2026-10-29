// Template: core/toc-split-9 — split agenda: left heading column (logo, title,
// lead paragraph) and a right tinted box listing up to 9 items with page numbers.
// Source Figma frame 109:4911. Uses the shared v2 footer (js/frame.js + .v2f-* CSS).
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const row = (it = {}) => `
  <div class="v2f-toc-item">
    <span class="lbl">${esc(it.label ?? "")}</span>
    <span class="pg">${esc(it.page ?? "")}</span>
  </div>`;

export default {
  name: "core/toc-split-9",
  slide: 2,
  figmaNode: "109:4911",
  family: "core",
  role: "toc",
  shape: "split",
  count: 9,
  theme: "light",
  chrome: false,
  use: "Table of contents / agenda: a heading and intro on the left, a numbered list of up to nine sections with page numbers on the right.",
  media: [],
  capacity: { items: 9, min: 4, max: 9 },
  slots: { images: 0, titles: 1, body: 1, list: 9, stats: 0, icons: 0 },
  description: "core/toc-split-9 — split agenda, heading + lead on the left, up to 9 numbered items on the right.",
  schema: {
    subtitle: "string — small label above the heading",
    title: "string — left heading (e.g. Table of Contents)",
    lead: "string — supporting paragraph under the heading",
    boxLabel: "string — label above the list (e.g. Content)",
    items: "array of up to 9 { label, page }",
    footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Table of Contents",
    lead: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    boxLabel: "Content",
    items: [
      { label: "Lorem ipsum", page: "7" }, { label: "Lorem ipsum", page: "8" },
      { label: "Lorem ipsum", page: "9" }, { label: "Lorem ipsum", page: "10" },
      { label: "Lorem ipsum", page: "11" }, { label: "Lorem ipsum", page: "12" },
      { label: "Lorem ipsum", page: "13" }, { label: "Lorem ipsum", page: "14" },
      { label: "Lorem ipsum", page: "15" },
    ],
  },
  render(s) {
    const items = (s.items || []).slice(0, 9).map(row).join("");
    return `
      <div class="v2f-root v2f-toc">
        <div class="v2f-toc-cols reveal">
          <div class="v2f-toc-left">
            ${topBar(s.meta, { logoOnly: true })}
            <div class="v2f-toc-text">
              <div>
                ${s.subtitle ? `<p class="v2f-toc-lead">${esc(s.subtitle)}</p>` : ""}
                ${s.title ? `<p class="v2f-toc-title">${esc(s.title)}</p>` : ""}
              </div>
              ${s.lead ? `<p class="v2f-toc-lead">${esc(s.lead)}</p>` : ""}
            </div>
          </div>
          <div class="v2f-toc-box">
            ${s.boxLabel ? `<p class="v2f-toc-boxlabel">${esc(s.boxLabel)}</p>` : ""}
            <div class="v2f-toc-list">${items}</div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
