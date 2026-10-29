// Template: planning/grid-15 — "Organisation": a bold head over an org chart with
// departments around a core team. Source Figma frame 105:3518.
import { frame } from "../frame.js";
import { plBoldHead, plOrgChart } from "../planning-blocks.js";

export default {
  name: "planning/grid-15", slide: 172, figmaNode: "105:3518",
  family: "planning", role: "diagram", shape: "orgchart", theme: "light", chrome: false,
  use: "An organisation chart: departments flanking a central core team of named people and working groups.",
  media: [], capacity: { items: 8, min: 4, max: 10 },
  slots: { images: 0, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "planning/grid-15 — bold head + an org chart (departments around a core team).",
  schema: {
    caption: "string", title: "string", subtitle: "string",
    left: "array of { dept, members:[{name,role}] }", leftHead: "side group header (e.g. Client X)",
    core: "{ title, left:[], functions:[], right:[] }",
    right: "array of { dept, members }", rightHead: "side group header", notes: "array of 3 strings",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Organisation", subtitle: "Subtitle",
    leftHead: "Client X", rightHead: "Client X",
    left: [
      { dept: "Department", members: [{ name: "Name", role: "Role" }, { name: "Name", role: "Role" }] },
      { dept: "Department", members: [{ name: "Name", role: "Role" }] },
      { dept: "Department", members: [{ name: "Name", role: "Role" }] },
      { dept: "Department", members: [{ name: "Name", role: "Role" }] },
    ],
    core: {
      title: "Core team",
      left: [{ name: "Name", role: "Role" }, { name: "Name", role: "Role" }, { name: "Name", role: "Role" }],
      functions: ["Steering", "Sync", "Delivery", "Validation"],
      right: [{ name: "Name", role: "Role" }, { name: "Name", role: "Role" }, { name: "Name", role: "Role" }],
    },
    right: [
      { dept: "Department", members: [{ name: "Name", role: "Role" }] },
      { dept: "Department", members: [{ name: "Name", role: "Role" }] },
      { dept: "Department", members: [{ name: "Name", role: "Role" }] },
      { dept: "Department", members: [{ name: "Name", role: "Role" }] },
    ],
    notes: ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "75" },
  },
  render(s) {
    return frame(
      plBoldHead({ caption: s.caption, title: s.title, subtitle: s.subtitle }) +
      plOrgChart({ left: s.left || [], leftHead: s.leftHead, core: s.core || {}, right: s.right || [], rightHead: s.rightHead, notes: s.notes || [] }),
      { meta: s.meta, footer: s.footer });
  },
};
