// Template: main/split-08 — a three-lens Venn: pageHeader + prose on the left, three
// overlapping mint circles (each with a topic + description) meeting at a central topic on
// the right. Source Figma frame 342:40262.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";

// left/top = circle box position (px) within the (centred) 792×710 diagram group.
/* Figma 342:40262 (footer corrected to 44px, 2026-10-15): three 500px circles
   in an 832×808 group filling the content height; each label sits toward the
   circle's outer side, not its centre. */
const CIRCLES = [
  { left: 0, top: 0, topic: "Topic", desc: "Description" },
  { left: 332, top: 0, topic: "Topic", desc: "Description" },
  { left: 175, top: 305, topic: "Topic", desc: "Description" },
];
const LABELS = [[175, 219], [675, 219], [416, 557]];
const CENTRE = [416, 356];
const D = 500;

export default {
  name: "main/split-08", slide: -20, figmaNode: "342:40262",
  family: "main", role: "content", shape: "diagram", theme: "light", chrome: false,
  use: "A three-lens Venn — heading + prose on the left, three overlapping mint circles meeting at a central topic on the right.",
  media: [], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 0, titles: 1, body: 1, stats: 0, icons: 0 },
  description: "main/split-08 — heading + prose left, 3-circle mint Venn right.",
  schema: {
    caption: "string — eyebrow", title: "string — heading", subtitle: "string — muted 2nd line",
    body: "array of paragraph strings",
    circles: "array of 3 { left, top, topic, desc }", center: "string — centre label",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title", subtitle: "Subtitle",
    body: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum. Aliquam nonummy auctor massa. Pellentesque habitant morbi tristique senectus et netus et  malesuada fames ac turpis egestas. Nulla at risus. Quisque purus magna,  auctor et, sagittis ac, posuere eu, lectus. Nam mattis, felis ut  adipiscing.Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Etiam eget ligula eu lectus lobortis condimentum."],
    circles: CIRCLES, center: "Topic",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const circles = s.circles || CIRCLES;
    const body = (s.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
    const [cx, cy] = CENTRE;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-sp8 reveal">
          <div class="side">
            ${pageHeader({ caption: s.caption, title: s.title ?? "", subtitle: s.subtitle })}
            <div class="v2f-mn-prose">${body}</div>
          </div>
          <div class="venn">
            <div class="vgroup">
              ${circles.map((c) => `<span class="ci" style="left:${c.left}px;top:${c.top}px;width:${D}px;height:${D}px;"></span>`).join("")}
              ${circles.map((c, i) => `<div class="lb" style="left:${(LABELS[i] || [c.left + D / 2])[0]}px;top:${(LABELS[i] || [0, c.top + D / 2])[1]}px;">
                <p class="t">${esc(c.topic)}</p><p class="d">${esc(c.desc)}</p>
              </div>`).join("")}
              ${s.center ? `<p class="ctr" style="left:${cx}px;top:${cy}px;">${esc(s.center)}</p>` : ""}
            </div>
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
