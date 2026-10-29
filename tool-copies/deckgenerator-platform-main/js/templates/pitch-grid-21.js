// Template: pitch/grid-21 — the founding team: five people in a row, a tall portrait each.
// Source Figma frame 110:37361.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-21", slide: 298, figmaNode: "110:37361",
  family: "pitch", role: "team", shape: "row", theme: "light", chrome: false,
  use: "A heading over five portraits in a row, each with a name and a role.",
  media: ["photo"], capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 5, titles: 6, subtitles: 5, body: 0, stats: 0, icons: 0 },
  description: "pitch/grid-21 — heading + five tall portraits with name and role.",
  intent: {
    bestFor: ["introducing the founders or leadership with a large portrait each"],
    holds: "an eyebrow, a title, and exactly 5 people of a name (up to 22 characters), a role (up to 28 characters) and a portrait",
    itemChars: 28,
    avoid: ["more or fewer than 5 people", "people without photos"],
    feel: "visual",
    needs: ["a portrait per person"],
  },
  schema: {
    caption: "string", title: "string", people: "array of 5 { name, role, image }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Next step", title: "Founding team",
    people: Array.from({ length: 5 }, (_, i) => ({ name: "Name", role: "Role/Position", image: ptAvatar(i) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "38" },
    footer: PT_FOOTER,
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}
        <div class="v2f-pt-people reveal">${(s.people || []).slice(0, 5).map(ptPerson).join("")}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
