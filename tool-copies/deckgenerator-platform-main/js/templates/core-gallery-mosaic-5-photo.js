// Template: core/gallery-mosaic-5-photo — header + a 5-image mosaic: a 2×2 grid
// of tiles on the left and one tall tile on the right. Light theme.
// Source Figma frame 109:5047. Uses the shared v2 frame (js/frame.js + .v2f-* CSS).
import { esc } from "../components.js";
import { frame, pageHeader } from "../frame.js";

const tile = (src) => `<div class="v2f-tile">${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/gallery-mosaic-5-photo",
  slide: 5,
  figmaNode: "109:5047",
  family: "core",
  role: "gallery",
  shape: "mosaic",
  count: 5,
  theme: "light",
  chrome: false,
  use: "A photo mosaic of five images — a 2×2 grid on the left plus one tall image on the right — under a section header. Visual, image-led.",
  media: ["photo"],
  capacity: { items: 5, min: 5, max: 5 },
  slots: { images: 5, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/gallery-mosaic-5-photo — header + intro, then a 5-photo mosaic (2×2 left, one tall right).",
  schema: {
    caption: "string", title: "string", subtitle: "string", intro: "string",
    images: "array of 5 photo paths (first 4 = left 2×2, 5th = tall right tile)",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Caption", title: "Title of section", subtitle: "Subtitle",
    intro: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "93" },
    images: [
      "assets/photography/20200717-084726_Nagarro_295.jpg",
      "assets/photography/20200717-085451_Nagarro_4227.jpg",
      "assets/photography/20200717-085631_Nagarro_327.jpg",
      "assets/photography/20200717-103815_Nagarro_958.jpg",
      "assets/photography/20200717-120518_Nagarro_4470_edit.jpg",
    ],
  },
  render(s) {
    const im = s.images || [];
    const middle =
      pageHeader({ caption: s.caption, title: s.title, subtitle: s.subtitle, intro: s.intro }, { halves: true }) +
      `<div class="v2f-mosaic reveal">
         <div class="v2f-mosaic-left">
           <div class="v2f-mosaic-row">${tile(im[0])}${tile(im[1])}</div>
           <div class="v2f-mosaic-row">${tile(im[2])}${tile(im[3])}</div>
         </div>
         ${tile(im[4])}
       </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
