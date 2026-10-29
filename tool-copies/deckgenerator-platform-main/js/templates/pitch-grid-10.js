// Template: pitch/grid-10 — a value-proposition Venn diagram: three overlapping circles with
// a label each, and the shared centre.
// Source Figma frame 110:37137.
import { esc } from "../components.js";
import { topBar, pageHeader } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptImg, ptPhoto, ptPhone, ptHand, ptFeature, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-10", slide: 281, figmaNode: "110:37137",
  family: "pitch", role: "diagram", shape: "diagram", theme: "light", chrome: false,
  use: "A heading beside a three-circle Venn diagram of what the customer needs, what you do well and what competitors do well.",
  media: [], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "pitch/grid-10 — heading + three-circle value-proposition Venn.",
  intent: {
    bestFor: ["the value proposition: where the customer's needs, your strengths and the competition's meet"],
    holds: "an eyebrow, a title of up to about 30 characters, and four labels of up to about 40 characters",
    itemChars: 40,
    avoid: ["any other diagram", "more than three sets"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    labels: "{ top, left, right, center } — the customer need, the competition, what you do well, the shared centre",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Business", title: "Value proposition",
    labels: { top: "What your customer needs and cares about", left: "Your competition’s strengths", right: "What you do well", center: "Unique value proposition" },
    meta: { studio: "Product Studio", name: "Presentation Name", page: "21" },
    footer: PT_FOOTER,
  },
  render(s) {
    const l = s.labels || {};
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal" style="gap:0;">
          <div style="flex:0 0 600px;">${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}</div>
          <div style="flex:1 1 0;min-width:0;display:flex;align-items:flex-start;">
            <div class="v2f-pt-venn" style="margin:0 0 0 138px;">
              <div class="c" style="left:320px;top:0;justify-content:center;align-items:flex-start;padding-top:64px;"><p style="width:271px;">${esc(l.top ?? "")}</p></div>
              <div class="c" style="left:138px;top:198px;justify-content:flex-start;align-items:flex-end;padding:0 0 64px 140px;box-sizing:border-box;"><p style="width:233px;">${esc(l.left ?? "")}</p></div>
              <div class="c" style="left:503px;top:198px;justify-content:flex-end;align-items:flex-end;padding:0 140px 64px 0;box-sizing:border-box;"><p style="width:120px;">${esc(l.right ?? "")}</p></div>
              <div class="mid"><img src="assets/pitch/venn-center.svg" alt=""><p>${esc(l.center ?? "")}</p></div>
            </div>
          </div>
        </div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
