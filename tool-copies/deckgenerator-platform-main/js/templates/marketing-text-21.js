// Template: marketing/text-21 — an eyebrow, a headline and a muted explanation at the left; at the right a tinted panel titled for the growth with four large platform icons, each with an up arrow and a percentage.
// Source Figma frame 110:31689.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { mkFooter, mkCol, mkHead, mkImg, mkPhoto, mkIcon, mkCard, mkPageHead, mkSmallHead, mkTextBlock, mkMetric, MK_FOOTER, MK_LOREM, MK_SHORT } from "../marketing-blocks.js";

export default {
  name: "marketing/text-21", slide: 360, figmaNode: "110:31689",
  family: "marketing", role: "results", shape: "grid", theme: "light", chrome: false,
  use: "A headline beside platform growth figures: four social icons with an up arrow and a percentage",
  media: [], capacity: { items: 4, min: 4, max: 4 },
  slots: { images: 0, titles: 3, subtitles: 0, body: 1, stats: 4, icons: 4 },
  description: "marketing/text-21 — an eyebrow, a headline and a muted explanation at the left; at the right a tinted panel titled for the growth with four large platform icons, each with an up arrow and a percentage.",
  intent: {
    bestFor: ["growth by social platform (TikTok, Instagram, LinkedIn, YouTube) at a glance"],
    holds: "an eyebrow, a headline of up to about 40 characters, a one-line explanation, a panel title of up to about 24 characters and four platforms with a percentage of up to about 5 characters",
    itemChars: 40,
    avoid: ["platforms other than TikTok, Instagram, LinkedIn and YouTube", "more or fewer than four platforms"],
    feel: "data",
    needs: [],
  },
  schema: {
    caption: "string", title: "string", body: "string", panelTitle: "string", platforms: "array of 4 {platform: tiktok | linkedin | instagram | youtube, value}",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    caption: "KPI / Goals", title: "Growth overview", body: "Write a short description explaining why this growth matters for the project or brand.",
    panelTitle: "Growth by platform",
    platforms: [{ platform: "tiktok", value: "12%" }, { platform: "linkedin", value: "25%" }, { platform: "instagram", value: "30%" }, { platform: "youtube", value: "43%" }],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "53" },
    footer: MK_FOOTER,
  },
  render(s) {
    const p = (s.platforms || []).slice(0, 4);
    const item = (x = {}) => `<div class="pl"><img class="ic" src="assets/marketing/social/${esc(x.platform ?? "tiktok")}.svg" alt=""><div class="vv"><img class="up" src="assets/marketing/social/up.svg" alt=""><p>${esc(x.value ?? "")}</p></div></div>`;
    const left = mkCol(s.meta, `<div class="v2f-mk-ph bottom" style="flex:1 1 0;"><div class="hd">${s.caption ? `<p class="v2f-cs-cap">${esc(s.caption)}</p>` : ""}<p class="v2f-cs-h2">${esc(s.title ?? "")}</p></div><p class="par md2">${esc(s.body ?? "")}</p></div>`, { width: 636 });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:32px;">${left}
          <div class="v2f-mk-gp"><p class="pt">${esc(s.panelTitle ?? "")}</p><div class="pg"><div class="pc">${item(p[0])}${item(p[1])}</div><div class="pc">${item(p[2])}${item(p[3])}</div></div></div>
        </div>
        ${mkFooter(s.footer)}
      </div>`;
  },
};
