// Template: social/grid-11 — a title over a monthly content calendar: four rows of eight dated cells, each holding the image planned for that day.
// Source Figma frame 110:22548.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/grid-11", slide: 376, figmaNode: "110:22548",
  family: "social", role: "timeline", shape: "calendar", theme: "light", chrome: false,
  use: "Monthly content calendar: an image per day",
  media: [], capacity: { items: 31, min: 28, max: 31 },
  slots: { images: 31, titles: 1, subtitles: 0, body: 0, stats: 0, icons: 0 },
  description: "social/grid-11 — a title over a monthly content calendar: four rows of eight dated cells, each holding the image planned for that day.",
  intent: {
    bestFor: ["a month of planned posts shown by their images"],
    holds: "a title and 28 to 31 days, each with an optional image",
    avoid: ["text per day (use social/grid-10)"],
    feel: "visual",
    needs: ["images per day"],
  },
  schema: {
    title: "string", days: "number of days, 28 to 31 (default 31)", images: "array of up to 31 urls, one per day; leave gaps empty",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Monthly Calendar", days: 31, images: [],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "17" },
    footer: SO_FOOTER,
  },
  render(s) {
    const n = Math.min(31, Math.max(28, Number(s.days) || 31));
    const im = s.images || [];
    const cells = Array.from({ length: 32 }, (_, i) => (i < n ? soDate(i + 1, im[i]) : '<div class="v2f-so-date ghost"></div>'));
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${soHead({ title: s.title })}</div>
        <div class="v2f-so-month reveal">${[0, 1, 2, 3].map((r) => `<div class="row">${cells.slice(r * 8, r * 8 + 8).join("")}</div>`).join("")}</div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
