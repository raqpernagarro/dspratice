// Template: pitch/grid-19 — the founding team: three people in a row, a tall portrait each.
// Source Figma frame 110:37346.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-19", slide: 296, figmaNode: "110:37346",
  family: "pitch", role: "team", shape: "row", theme: "light", chrome: false,
  use: "A heading over three portraits in a row, each with a name and a role.",
  media: ["photo"], capacity: { items: 3, min: 3, max: 3 },
  slots: { images: 3, titles: 4, subtitles: 3, body: 0, stats: 0, icons: 0 },
  description: "pitch/grid-19 — heading + three tall portraits with name and role.",
  intent: {
    bestFor: ["introducing the founders or leadership with a large portrait each"],
    holds: "an eyebrow, a title, and exactly 3 people of a name (up to 22 characters), a role (up to 28 characters) and a portrait",
    itemChars: 28,
    avoid: ["more or fewer than 3 people", "people without photos"],
    feel: "visual",
    needs: ["a portrait per person"],
  },
  schema: {
    caption: "string", title: "string", people: "array of 3 { name, role, image }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Next step", title: "Founding team",
    people: Array.from({ length: 3 }, (_, i) => ({ name: "Name", role: "Role/Position", image: ptAvatar(i) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "36" },
    footer: PT_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}
        <div class="v2f-pt-people reveal">${(s.people || []).slice(0, 3).map(ptPerson).join("")}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
