// Template: pitch/grid-11 — pricing tiers: a headline over three tinted cards, each a plan
// name and price with its inclusions.
// Source Figma frame 110:37197.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-11", slide: 285, figmaNode: "110:37197",
  family: "pitch", role: "cards", shape: "row", theme: "light", chrome: false,
  use: "A headline over three tinted pricing cards: plan, price and what is included.",
  media: [], capacity: { items: 3, min: 2, max: 3 },
  slots: { images: 0, titles: 1, subtitles: 0, body: 3, stats: 3, icons: 0 },
  description: "pitch/grid-11 — headline + three pricing tiers.",
  intent: {
    bestFor: ["pricing tiers: how the company makes money and what each plan costs"],
    holds: "an eyebrow, a headline of up to about 110 characters, and 2–3 plans of a name (up to 14 characters), a price (up to 14 characters) and up to three inclusions of up to about 24 characters",
    itemChars: 24,
    avoid: ["more than three plans", "inclusions that need sentences", "figures for anything other than price"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string",
    plans: "array of 2–3 { name, price, items: string[] }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "Business", title: "Explain how your company makes money and its sustainability. What pricing tiers will you offer?",
    plans: [
      { name: "Base", price: "€25 / Month", items: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"] },
      { name: "Business", price: "€50 / Month", items: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"] },
      { name: "Enterprise", price: "€110 / Month", items: ["Lorem ipsum", "Lorem ipsum", "Lorem ipsum"] },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "25" },
    footer: PT_FOOTER,
  },
  render(s) {
    const tones = ["t20", "t50", "t75"];
    const plans = (s.plans || []).slice(0, 3).map((p, i) => `
      <div class="v2f-pt-price ${tones[i]}">
        <div><p class="n">${esc(p.name ?? "")}</p><p class="p${i ? " dim" : ""}">${esc(p.price ?? "")}</p></div>
        <div>${(p.items || []).slice(0, 3).map((it) => `<p class="d">&gt; ${esc(it)}</p>`).join("")}</div>
      </div>`).join("");
    return `
      <div class="v2f-root v2f-g32">
        ${topBar(s.meta)}
        ${ptHead({ caption: s.caption, title: s.title }, { size: "h2", maxWidth: 1600 })}
        <div class="v2f-pt-prices reveal">${plans}</div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
