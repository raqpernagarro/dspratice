// Template: portfolio/text-02 — a bio column (heading + short "currently / grew
// up / studied" entries + personality traits) beside a full-height photo on the
// right. Source Figma frame 109:10175.
import { esc } from "../components.js";
import { frame } from "../frame.js";

export default {
  name: "portfolio/text-02",
  slide: 73,
  figmaNode: "109:10175",
  family: "portfolio", role: "text", shape: "split", theme: "light", chrome: false,
  use: "A bio column (heading + short entries + traits) beside a full-height photo.",
  media: ["photo"],
  capacity: { items: 8, min: 2, max: 10 },
  slots: { images: 1, titles: 1, subtitles: 0, body: 1, stats: 0, icons: 0 },
  description: "portfolio/text-02 — bio text column + right photo.",
  schema: {
    title: "string", lines: "array of strings (bio entries / traits)",
    image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Who we are",
    lines: [
      "Currently Lorem ipsum at Lorem ipsum (2021 – present)",
      "Currently Lorem ipsum at Lorem ipsum (2018 – 2021)",
      "Currently Lorem ipsum at Lorem ipsum (2011 – 2016)",
      "Grew up in Lorem ipsum",
      "Studied Lorem ipsum at Lorem ipsum from 2017–2018",
      "Personality trait", "Personality trait", "Personality trait",
    ],
    image: "assets/photography/20200717-093647_Nagarro_551.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "168" },
  },
  render(s) {
    const lines = (s.lines || []).map((l) => `<p>${esc(l)}</p>`).join("");
    const middle = `
      <div class="v2f-pf-cols reveal">
        <div class="c between">
          <p class="v2f-pf-lead">${esc(s.title ?? "")}</p>
          <div class="v2f-pf-blk">${lines}</div>
        </div>
        <div class="photo">${s.image ? `<img src="${esc(s.image)}" alt="">` : ""}</div>
      </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
