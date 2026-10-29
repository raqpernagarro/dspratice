// Template: planning/grid-16 — "Leadership team": three featured leaders beside a
// grid of team members. Source Figma frame 105:3585.
import { frame } from "../frame.js";
import { plSplitHead, plLeadership, plAvatar } from "../planning-blocks.js";

export default {
  name: "planning/grid-16", slide: 173, figmaNode: "105:3585",
  family: "planning", role: "team", shape: "roster", theme: "light", chrome: false,
  use: "A leadership roster: a few featured leaders with larger portraits beside a grid of the wider team.",
  media: ["photo"], capacity: { items: 15, min: 6, max: 15 },
  slots: { images: 15, titles: 0, body: 0, stats: 0, icons: 0 },
  description: "planning/grid-16 — featured leaders + a team photo grid.",
  intent: { bestFor: ["leadership plus the wider presenting team"], holds: "a few leaders and up to 15 team members", itemChars: 40, avoid: ["a client's roles or job titles", "risks, owners or workstreams", "interview or research participants", "quotes from people outside the team — the photos show Nagarro people and would be read as them"], feel: "visual", needs: ["portrait photos of the team"] },
  schema: {
    caption: "string",
    leaders: "array of { image, name, role }", team: "array of { image, name, role }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Leadership team",
    leaders: [
      { image: plAvatar(0), name: "Jane Doe", role: "Founder & CEO" },
      { image: plAvatar(1), name: "Jane Doe", role: "President & CIO" },
      { image: plAvatar(2), name: "Jane Doe", role: "COO" },
    ],
    team: Array(12).fill(0).map((_, i) => ({ image: plAvatar(i + 3), name: "Lorem Ipsum", role: "Lorem Ipsum" })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "76" },
  },
  render(s) {
    return frame(
      plSplitHead({ caption: s.caption }) + plLeadership({ leaders: s.leaders || [], team: s.team || [] }),
      { meta: s.meta, footer: s.footer });
  },
};
