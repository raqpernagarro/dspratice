// Template: pitch/grid-28 — the disclaimer: a narrow label column and one tinted card of fine-print
// sections.
// Source Figma frame 110:37445.
import { esc } from "../components.js";
import { topBar } from "../frame.js";
import { ptFooter, ptCol, ptHead, ptPhoto, ptAvatar, ptPerson, PT_FOOTER } from "../pitch-blocks.js";

export default {
  name: "pitch/grid-28", slide: 307, figmaNode: "110:37445",
  family: "pitch", role: "content", shape: "split", theme: "light", chrome: false,
  use: "A narrow label column with the company and date, beside one card of up to seven fine-print sections.",
  media: [], capacity: { items: 7, min: 3, max: 7 },
  slots: { images: 0, titles: 8, subtitles: 0, body: 7, stats: 0, icons: 0 },
  description: "pitch/grid-28 — narrow label + card of fine-print sections.",
  intent: {
    bestFor: ["the legal disclaimer at the end of an investor pitch"],
    holds: "a label, the company and date, and 3–7 sections of a heading and up to about 400 characters of fine print",
    itemChars: 400,
    avoid: ["anything the audience is meant to read", "long text beyond about 2,000 characters in total"],
    feel: "dense",
    needs: [],
  },
  schema: {
    title: "string — e.g. Disclaimer", company: "string", date: "string",
    sections: "array of 3–7 { title, body }",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Disclaimer", company: "© Company", date: "Date",
    sections: [{"title": "Safe Harbor Statement", "body": "This presentation includes forward-looking statements that are made pursuant to the safe harbor provisions of the Private Securities Litigation Reform Act of 1995. Forward-looking statements can often be identified by the use of terminology such as “anticipates,” “expects,” “intends,” “plans,” “believes,” and similar expressions. These statements reflect current expectations about future events and operating performance and speak only as of the date of this presentation."}, {"title": "Non-GAAP Financial Measures", "body": "In this presentation, we may discuss non-GAAP financial measures. These measures are not prepared in accordance with Generally Accepted Accounting Principles (GAAP) and may differ from non-GAAP financial measures used by other companies."}, {"title": "Industry and Market Data", "body": "This presentation contains estimates and other statistical data made by independent parties and by us relating to market size and growth, as well as other industry data. While we believe these sources are reliable, we have not independently verified the accuracy or completeness of the information."}, {"title": "Third-Party Information", "body": "Throughout this presentation, we may reference various third-party websites, data, or other information. The inclusion of any third-party information does not imply an endorsement by us of any products, services, or information provided by these third parties."}, {"title": "Trademarks", "body": "All trademarks, service marks, and trade names appearing in this presentation are the property of their respective owners."}, {"title": "Responsibility for Own Assessment", "body": "By attending or receiving this presentation, you acknowledge that you are solely responsible for your own assessment of the market and our position in it."}, {"title": "Contact Information", "body": "For additional information, please refer to our annual report, SEC filings, or contact our investor relations team at [email address] or [phone number]."}],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "47" },
    footer: PT_FOOTER,
  },
  render(s) {
    const secs = (s.sections || []).slice(0, 7).map((x) => `<div><h5>${esc(x.title ?? "")}</h5><p>${esc(x.body ?? "")}</p></div>`).join("");
    const left = ptCol(s.meta, `
      <p class="v2f-cs-h4 v2f-cs-muted" style="margin:0;">${esc(s.title ?? "")}</p>
      <div class="v2f-cs-lines lg" style="margin-top:auto;">${s.company ? `<p>${esc(s.company)}</p>` : ""}${s.date ? `<p>${esc(s.date)}</p>` : ""}</div>`, { width: 400, logoOnly: true });
    return `
      <div class="v2f-root v2f-g32">
        <div class="v2f-cs-cols reveal" style="gap:24px;">${left}<div class="v2f-pt-disc">${secs}</div></div>
        ${ptFooter(s.footer)}
      </div>`;
  },
};
