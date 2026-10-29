// Template: pitch/text-13 — a bigger team: ten people in two rows of five.
// Source Figma frame 110:37370.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-13", slide: 299, figmaNode: "110:37370",
  family: "pitch", role: "team", shape: "grid", theme: "light", chrome: false,
  use: "A heading over ten people in two rows of five, each with a photo, name and role.",
  media: ["photo"], capacity: { items: 10, min: 6, max: 10 },
  slots: { images: 10, titles: 11, subtitles: 10, body: 0, stats: 0, icons: 0 },
  description: "pitch/text-13 — heading + ten people, two rows of five.",
  intent: {
    bestFor: ["the wider team: up to ten people at a glance"],
    holds: "an eyebrow, a title, and 6–10 people of a name (up to 22 characters), a role (up to 28 characters) and a portrait",
    itemChars: 28,
    avoid: ["fewer than six people (use pitch/grid-19..21)", "more than ten people"],
    feel: "dense",
    needs: ["a portrait per person"],
  },
  schema: {
    caption: "string", title: "string", people: "array of 6–10 { name, role, image }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Next step", title: "Bigger team",
    people: Array.from({ length: 10 }, (_, i) => ({ name: "Name", role: "Role/Position", image: ptAvatar(i) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "39" },
    footer: PT_FOOTER,
  },
  render(s) {
    const ps = (s.people || []).slice(0, 10);
    const row = (a) => `<div class="row">${a.map(ptPerson).join("")}</div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}
        <div class="v2f-pt-people rows reveal">${row(ps.slice(0, 5))}${ps.length > 5 ? row(ps.slice(5)) : ""}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
