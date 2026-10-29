// Template: planning/grid-07 — "Milestones": a bold head over a photo timeline with
// cards above and below an axis. Source Figma frame 105:2782.
import { frame } from "../frame.js";
import { plBoldHead, plMilestones, plScene } from "../planning-blocks.js";

export default {
  name: "planning/grid-07", slide: 163, figmaNode: "105:2782",
  family: "planning", role: "timeline", shape: "milestones", theme: "light", chrome: false,
  use: "A milestone timeline with photos: key moments placed above and below a central axis, each with an image, title and note.",
  media: ["photo"], capacity: { items: 5, min: 3, max: 6 },
  slots: { images: 5, titles: 1, body: 0, stats: 0, icons: 0 },
  description: "planning/grid-07 — bold head + a photo milestone timeline (2 above / 3 below).",
  schema: {
    caption: "string", title: "string",
    above: "array of { image, title, body, active }", below: "array of { image, title, body, active }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Milestones",
    above: [{ image: plScene(0), title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." }, { image: plScene(1), title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." }],
    below: [{ image: plScene(2), title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." }, { image: plScene(3), title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." }, { image: plScene(4), title: "Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "66" },
  },
  render(s) {
    return frame(plBoldHead({ caption: s.caption, title: s.title }) +
      plMilestones({ above: s.above || [], below: s.below || [], tick: { above: "left", below: "left" }, roomy: true }),
      { meta: s.meta, footer: s.footer });
  },
};
