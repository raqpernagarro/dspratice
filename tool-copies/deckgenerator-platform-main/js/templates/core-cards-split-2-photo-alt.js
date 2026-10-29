// Template: core/cards-split-2-photo-alt — a narrow text column (with tag
// badges) beside two tall photo + text cards. Source Figma frame 109:5316.
import { footerBar } from "../frame.js";
import { coreSplitText, vCard, SAMPLE } from "../blocks.js";

export default {
  name: "core/cards-split-2-photo-alt",
  slide: 33,
  figmaNode: "109:5316",
  family: "core", role: "cards", shape: "split", count: 2, theme: "light", chrome: false,
  use: "A narrow text column with tag badges beside two tall photo cards, each with a title, subtitle and text.",
  media: ["photo"],
  capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 2, titles: 3, subtitles: 3, body: 3, stats: 0, icons: 0 },
  description: "core/cards-split-2-photo-alt — text column + badges, two tall photo/text cards.",
  schema: {
    subtitle: "string", title: "string", body: "string — one or two paragraphs",
    badges: "array of 0–4 short strings",
    cards: "array of 2 {image, title, subtitle, body}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    badges: ["Badge", "Badge", "Badge"],
    cards: SAMPLE.slice(2, 4).map((image) => ({ image, title: "Title", subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "113" },
  },
  render(s) {
    // Figma 109:5316: narrow text column (logo-only top bar, copy, badges),
    // then 2 photo-first cards of 676px.
    const im = s.images || [];
    const cards = (s.cards || []).slice(0, 2);
    while (cards.length < 2 && cards.length < im.length) cards.push({});
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-csplit reveal">
          ${coreSplitText({ meta: s.meta, logoOnly: true, subtitle: s.subtitle, title: s.title, body: s.body, small: true, badges: s.badges || [] }, 440)}
          ${cards.map((c, i) => `<div style="flex:1 1 0;min-width:0;display:flex;">${vCard({ image: im[i], ...c })}</div>`).join("")}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
