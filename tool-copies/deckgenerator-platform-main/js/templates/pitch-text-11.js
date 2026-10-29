// Template: pitch/text-11 — a head-to-head: a heading and note at the left, two tall cards at the
// right, the traditional offering in grey and yours in black.
// Source Figma frame 110:37262.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/text-11", slide: 290, figmaNode: "110:37262",
  family: "pitch", role: "diagram", shape: "split", theme: "light", chrome: false,
  use: "A heading and a note beside two tall cards comparing the traditional offering with yours.",
  media: [], capacity: { items: 2, min: 2, max: 2 },
  slots: { images: 0, titles: 3, subtitles: 2, body: 3, stats: 0, icons: 0 },
  description: "pitch/text-11 — heading + note, two comparison cards (grey, black).",
  intent: {
    bestFor: ["a head-to-head against the traditional way of solving the problem"],
    holds: "an eyebrow, a title, a note of up to about 300 characters, and two cards of a name, a subtitle, a sentence of up to about 130 characters and up to three bullets",
    itemChars: 130,
    avoid: ["comparing more than two things (use pitch/grid-14)", "long cards"],
    feel: "visual",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string",
    cards: "array of 2 { title, subtitle, body, bullets: string[] } — the first is the traditional offering, the second yours",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Market", title: "Competitors", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ipsum purus, feugiat vel dolor sed, malesuada lobortis urna. Proin a lectus ut nibh euismod egestas. Aenean non tincidunt ex, a dapibus sem. Curabitur efficitur accumsan mollis. Donec in auctor ligula, vitae commodo turpis.",
    cards: [
      { title: "Traditional offering", subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", bullets: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"] },
      { title: "Your offering", subtitle: "Subtitle", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", bullets: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "30" },
    footer: PT_FOOTER,
  },
  render(s) {
    const card = (c = {}, tone) => `
      <div class="v2f-pt-vs ${tone}">
        <div class="h"><p class="a">${esc(c.title ?? "")}</p><p class="a s">${esc(c.subtitle ?? "")}</p></div>
        <p class="b">${esc(c.body ?? "")}${(c.bullets || []).length ? "\n\n" + c.bullets.map((b) => "> " + esc(b)).join("\n") : ""}</p>
      </div>`;
    const cs = s.cards || [];
    const left = ptCol(s.meta, `
      ${ptHead({ caption: s.caption, title: s.title }, { size: "h2" })}
      ${s.body ? `<p class="v2f-pt-body" style="margin-top:auto;">${esc(s.body)}</p>` : ""}`, { width: 589, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}<div style="flex:1 1 0;min-width:0;display:flex;gap:24px;">${card(cs[0], "light")}${card(cs[1], "dark")}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
