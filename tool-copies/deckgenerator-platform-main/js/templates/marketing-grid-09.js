// Template: marketing/grid-09 — a tall photo at the left and a persona at the right: a header, then tinted cards for description, needs, values, pain points, motivations, and cards of chips (each category on its own line).
// Source Figma frame 110:30704.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, mkChipGroups, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/grid-09", slide: 326, figmaNode: "110:30704",
  family: "marketing", role: "detail", shape: "split", theme: "light", chrome: false,
  use: "An audience persona: photo, description, needs, values and chip groups",
  media: ["photo"], capacity: { items: 9, min: 9, max: 9 },
  slots: { images: 1, titles: 10, subtitles: 1, body: 6, stats: 0, icons: 0 },
  description: "marketing/grid-09 — a tall photo at the left and a persona at the right: a header, then tinted cards for description, needs, values, pain points, motivations, and cards of chips (each category on its own line).",
  intent: {
    bestFor: ["profiling one audience segment in detail: who they are, what they need and value, what holds them back"],
    holds: "a title and subtitle, a photo, a description, needs and values, bullet lists for pain points and motivations, and chips for interests, media and spending habits",
    itemChars: 40,
    avoid: ["more than one persona per slide", "long chip labels"],
    feel: "dense",
    needs: ["a photo"],
  },
  schema: {
    title: "string", subtitle: "string", image: "string — photo path", description: "string", needs: "string", values: "string", painPoints: "string[] (3)", motivations: "string[] (3)", interests: "array of {label, chips}", media: "array of {label, chips}", spending: "array of {label, chips}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Typical Gen X", subtitle: "Audience", image: mkPhoto(6),
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat",
    needs: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    values: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    painPoints: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"], motivations: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"],
    interests: [{ label: "Interests", chips: ["Fashion", "Football", "Food", "Wellness"] }],
    media: [{ label: "Media", chips: ["Badge", "Badge", "Badge"] }],
    spending: [{ label: "Spending Habits", chips: ["Badge", "Badge", "Badge"] }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "19" },
    footer: MK_FOOTER,
  },
  render(s) {
    const tb = (t, b) => `<div class="v2f-mk-pcard"><p class="h">${esc(t)}</p><p class="b">${esc(b ?? "")}</p></div>`;
    const bl = (t, a = []) => `<div class="v2f-mk-pcard"><p class="h">${esc(t)}</p><ul>${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
    const ch = (g, tone) => `<div class="v2f-mk-pcard">${mkChipGroups(g, tone)}</div>`;
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="v2f-cs-cols reveal" style="gap:32px;">
          ${mkImg(s.image, { style: "flex:0 0 597px;" })}
          <div class="v2f-mk-persona">
            <div class="ph"><p class="t">${esc(s.title ?? "")}</p><p class="s">${esc(s.subtitle ?? "")}</p></div>
            <div class="rw"><div style="flex:2.05;display:flex;">${tb("Description", s.description)}</div><div style="flex:1;display:flex;">${ch(s.interests, "dark")}</div></div>
            <div class="rw">${tb("Needs", s.needs)}${tb("Values", s.values)}${ch(s.media, "grey")}</div>
            <div class="rw">${bl("Pain Points", s.painPoints)}${bl("Motivations", s.motivations)}${ch(s.spending, "grey")}</div>
          </div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
