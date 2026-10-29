// Template: social/grid-10 — a title over a weekly content calendar: seven day headings, and one row of topic cards per channel with the channel name running up the side.
// Source Figma frame 110:22509.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { soFooter, soCol, soImg, soPhoto, soPhone, soKind, soHead, soBigHead, soRule, soField, soScreen, soDay, soDate, SO_FOOTER, SO_LOREM, SO_SHORT, SO_KINDS } from "../social-blocks.js";

export default {
  name: "social/grid-10", slide: 375, figmaNode: "110:22509",
  family: "social", role: "timeline", shape: "calendar", theme: "light", chrome: false,
  use: "Weekly content calendar: a row of topics per channel",
  media: [], capacity: { items: 3, min: 1, max: 3 },
  slots: { images: 0, titles: 29, subtitles: 0, body: 21, stats: 0, icons: 0 },
  description: "social/grid-10 — a title over a weekly content calendar: seven day headings, and one row of topic cards per channel with the channel name running up the side.",
  intent: {
    bestFor: ["a week of planned posts across up to three channels"],
    holds: "a title, seven day names and one to three channels with seven topic cards each (a topic and a line of up to about 30 characters)",
    itemChars: 30,
    avoid: ["more than three channels", "long card text"],
    feel: "dense",
    needs: [],
  },
  schema: {
    title: "string", days: "array of 7 {label, on} — on darkens the day name", channels: "array of up to 3 {name, items: array of 7 {topic, text}}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Weekly Calendar",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((label, i) => ({ label, on: i % 2 === 1 })),
    channels: ["Instagram", "Facebook", "LinkedIn"].map((name) => ({ name, items: Array.from({ length: 7 }, () => ({ topic: "Topic", text: "Lorem ipsum dolor sit amet" })) })),
    meta: { studio: "Product Studio", name: "Presentation Name", page: "16" },
    footer: SO_FOOTER,
  },
  render(s) {
    const ch = (s.channels || []).slice(0, 3);
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        <div class="reveal">${soHead({ title: s.title })}</div>
        <div class="v2f-so-week reveal">
          <div class="days">${(s.days || []).slice(0, 7).map((d) => `<p class="${d.on ? "on" : ""}">${esc(d.label ?? "")}</p>`).join("")}</div>
          ${ch.map((c) => `<div class="row"><p class="ch"><span>${esc(c.name ?? "")}</span></p>${(c.items || []).slice(0, 7).map(soDay).join("")}</div>`).join("")}
        </div>
        ${soFooter(s.footer)}
      </div>`;
  },
};
