// Template: pitch/grid-13 — a market validation: a huge statement over one stacked bar showing
// how the market splits.
// Source Figma frame 110:37226.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-13", slide: 287, figmaNode: "110:37226",
  family: "pitch", role: "chart", shape: "single", theme: "light", chrome: false,
  use: "A very large statement over one long stacked bar of three shares, with a legend and a line of fine print.",
  media: [], capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 1, stats: 3, icons: 0 },
  description: "pitch/grid-13 — 100px statement, one stacked share bar with legend.",
  intent: {
    bestFor: ["how a market splits: by segment, region or maturity, behind one big claim"],
    holds: "an eyebrow, a statement of up to about 55 characters, 2–3 segments of a label and a share, and fine print of up to about 400 characters",
    itemChars: 55,
    avoid: ["more than three segments", "long statements (100px)"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string — the statement",
    segments: "array of 2–3 { label, share } — share is a number; they are drawn in proportion",
    note: "string — fine print under the bar",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market", title: "A total market validation of 12.4 billion users.",
    segments: [{ label: "Lorem ipsum", share: 66.5 }, { label: "Lorem ipsum", share: 16.75 }, { label: "Lorem ipsum", share: 16.75 }],
    note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "27" },
    footer: PT_FOOTER,
  },
  render(s) {
    const cols = ["var(--fill-25,rgba(1,7,22,.25))", "var(--fg-60,rgba(1,7,22,.6))", "var(--fg-100,#010716)"];
    const segs = (s.segments || []).slice(0, 3);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${ptHead({ caption: s.caption, title: s.title }, { size: "h1", maxWidth: 1300 })}
        <div class="v2f-pt-stack reveal">
          <div class="v2f-pt-slegend">${segs.map((g, i) => `<div><i style="background:${cols[i]}"></i>${esc(g.label ?? "")}</div>`).join("")}</div>
          <div class="v2f-pt-pill">${segs.map((g, i) => `<span style="flex:${Math.max(1, Number(g.share) || 1)} 1 0;background:${cols[i]}"></span>`).join("")}</div>
          ${s.note ? `<p class="v2f-pt-fine">${esc(s.note)}</p>` : ""}
        </div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
