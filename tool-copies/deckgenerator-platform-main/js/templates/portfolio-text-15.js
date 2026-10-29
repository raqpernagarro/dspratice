// Template: portfolio/text-15 — a "Notations" heading + a supporting photo on
// the left, a large testimonial quote on the right. Source Figma frame 109:10704.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/text-15",
  slide: 110,
  figmaNode: "109:10704",
  family: "portfolio", role: "quote", shape: "split", theme: "light", chrome: false,
  use: "A heading + supporting photo on the left, a large testimonial quote on the right.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "portfolio/text-15 — heading + photo left, large quote right.",
  schema: {
    title: "string", image: "string — photo path", quote: "string", attribution: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Notations",
    image: "assets/photography/20200717-090532_Nagarro_4256.jpg",
    quote: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    attribution: "Lorem ipsum",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "205" },
  },
  render(s) {
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c between">
          <p class="v2f-pf-lead">${esc(s.title ?? "")}</p>
          <div class="v2f-imgbox" style="flex:0 0 380px;align-self:flex-start;width:100%">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
        </div>
        <div class="c">
          <div class="v2f-pf-testi">
            <p class="q">“${esc(s.quote ?? "")}”</p>
            ${s.attribution ? `<p class="by">– ${esc(s.attribution)}</p>` : ""}
          </div>
        </div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
