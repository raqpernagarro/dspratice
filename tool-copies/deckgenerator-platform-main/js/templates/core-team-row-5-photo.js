// Template: core/team-row-5-photo — header + five portraits with name + role.
// Source Figma frame 109:5107.
import { frame, pageHeader } from "../frame.js";
import { cardGrid, SAMPLE } from "../blocks.js";

const people = (n) => SAMPLE.slice(0, n).map((image) => ({ image, title: "Name Surname", subtitle: "Role / position" }));

export default {
  name: "core/team-row-5-photo",
  slide: 58,
  figmaNode: "109:5107",
  family: "core", role: "team", shape: "row", count: 5, theme: "light", chrome: false,
  use: "Five portrait photos with a name and role beneath each. A team or leadership row.",
  media: ["photo"],
  capacity: { items: 5, min: 4, max: 5 },
  slots: { images: 5, titles: 5, subtitles: 5, body: 0, stats: 0, icons: 0 },
  description: "core/team-row-5-photo — header, then five portraits with name + role.",
  intent: { bestFor: ["introducing the presenting team, five people"], holds: "4–5 team members, each a name and role", itemChars: 40, avoid: ["a client's roles or job titles", "risks, owners or workstreams", "interview or research participants", "quotes from people outside the team — the photos show Nagarro people and would be read as them"], feel: "visual", needs: ["portrait photos of the team"] },
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    people: "array of 5 {image, title (name), subtitle (role)}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Our team", subtitle: "Leadership",
    people: people(5),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "99" },
  },
  render(s) {
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      cardGrid((s.people || []).slice(0, 5), 5);
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
