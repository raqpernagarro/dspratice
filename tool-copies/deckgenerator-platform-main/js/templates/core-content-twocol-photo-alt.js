// Template: core/content-twocol-photo-alt — mirror of content-twocol-photo:
// text column on the left, one large photo on the right. Source frame 109:5427.
import { esc } from "../components.js";
import { topBar, footerBar } from "../frame.js";

const side = (s = {}) => `
  <div class="v2f-twocol-side">
    ${topBar(s.meta)}
    <div class="v2f-split-copy">
      <div>
        ${s.subtitle ? `<p class="v2f-h6">${esc(s.subtitle)}</p>` : ""}
        ${s.title ? `<p class="v2f-h4">${esc(s.title)}</p>` : ""}
      </div>
      ${s.body ? `<p class="v2f-para">${esc(s.body)}</p>` : ""}
    </div>
  </div>`;

const img = (src) => `<div class="v2f-twocol-img">${src ? `<img src="${esc(src)}" alt="">` : ""}</div>`;

export default {
  name: "core/content-twocol-photo-alt",
  slide: 20,
  figmaNode: "109:5427",
  family: "core", role: "content", shape: "twocol", count: 1, theme: "light", chrome: false,
  use: "One large photo on the left and a wider text column on the right.",
  media: ["photo"],
  capacity: { items: 1, min: 1, max: 1 },
  slots: { images: 1, titles: 1, subtitles: 1, body: 1, stats: 0, icons: 0 },
  description: "core/content-twocol-photo-alt — large photo left, wide heading + body column right.",
  schema: {
    subtitle: "string", title: "string", body: "string", image: "string — photo path",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    subtitle: "Subtitle", title: "Title",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    image: "assets/photography/20200717-103815_Nagarro_958.jpg",
    meta: { studio: "Product Studio", name: "Presentation Name", page: "128" },
  },
  render(s) {
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-twocol reveal" style="gap:24px;--side:810px;">
          ${img(s.image)}
          ${side(s)}
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
