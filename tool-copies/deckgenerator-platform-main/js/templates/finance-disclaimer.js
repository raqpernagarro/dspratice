// Template: finance/disclaimer — a legal / fine-print page: a large muted heading
// on the left and a light panel of labelled fine-print sections on the right, with
// a company/date sign-off. Light theme. Source Figma frame 110:18196 (finance/grid-01).
import { esc } from "../components.js";
import { frame } from "../frame.js";
import { finDisclaimer } from "../finance-blocks.js";

export default {
  name: "finance/disclaimer",
  slide: 118,
  figmaNode: "110:18196",
  family: "finance",
  role: "content",
  shape: "fineprint",
  theme: "light",
  chrome: false,
  use: "A legal / disclaimer page: a big muted heading plus dense labelled fine-print (safe-harbor, non-GAAP, trademarks) in a panel.",
  media: [],
  capacity: { items: 8, min: 3, max: 10 },
  slots: { images: 0, titles: 1, body: 8, stats: 0, icons: 0 },
  description: "finance/disclaimer — big muted heading + a two-column fine-print panel + sign-off.",
  schema: {
    title: "string — the page heading (e.g. Disclaimer)",
    sections: "array of { label, body }",
    company: "string", date: "string",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "Disclaimer",
    company: "© Company", date: "Date",
    sections: [
      { label: "Safe Harbor Statement", body: "This presentation includes forward-looking statements that are made pursuant to the safe harbor provisions of the Private Securities Litigation Reform Act of 1995. Forward-looking statements can often be identified by the use of terminology such as “anticipates,” “expects,” “intends,” “plans,” “believes,” “seeks,” “estimates,” “could,” “would,” “will,” “may,” “project,” “forecast,” and similar expressions. These statements reflect current expectations about future events and operating performance and speak only as of the date of this presentation. They are subject to risks, uncertainties, and other factors that could cause actual results to differ materially from those expressed or implied by the forward-looking statements.\n\nWe caution you that these forward-looking statements are not guarantees of future performance or results and involve known and unknown risks, uncertainties, and other factors that are, in some cases, beyond our control. These factors may cause our actual results, performance, or achievements to differ materially from those expressed or implied by the forward-looking statements. Such risks and uncertainties include, but are not limited to, our ability to execute our strategic plans, the competitive environment in which we operate, fluctuations in customer demand, regulatory changes, and other risks described in our filings with the Securities and Exchange Commission (SEC), which are available on the SEC’s website (www.sec.gov) and on our investor relations website.\nWe undertake no obligation to publicly update or revise any forward-looking statements to reflect events or circumstances after the date of this presentation, except as required by law. All subsequent written and oral forward-looking statements attributable to us or persons acting on our behalf are expressly qualified in their entirety by the cautionary statements contained herein or in our other filings with the SEC." },
      { label: "Non-GAAP Financial Measures", body: "In this presentation, we may discuss non-GAAP financial measures. These measures are not prepared in accordance with Generally Accepted Accounting Principles (GAAP) and may differ from non-GAAP financial measures used by other companies. Non-GAAP financial measures should not be considered as a substitute for, or superior to, financial measures calculated in accordance with GAAP. We provide these measures to offer additional insights into our operating performance and to assist investors in comparing our results with those of other companies. A reconciliation of these non-GAAP financial measures to the most directly comparable GAAP measures is included in our SEC filings and on our investor relations website." },
      { label: "Industry and Market Data", body: "This presentation contains estimates and other statistical data made by independent parties and by us relating to market size and growth, as well as other industry data. This data involves a number of assumptions and limitations, and you are cautioned not to give undue weight to such estimates. While we believe these sources are reliable, we have not independently verified the accuracy or completeness of the information. Accordingly, we do not guarantee its accuracy or completeness." },
      { label: "Third-Party Information", body: "Throughout this presentation, we may reference various third-party websites, data, or other information. We have not independently verified the accuracy or completeness of such information and make no representations about its accuracy or completeness. The inclusion of any third-party information does not imply an endorsement by us of any products, services, or information provided by these third parties." },
      { label: "Trademarks", body: "All trademarks, service marks, and trade names appearing in this presentation are the property of their respective owners. The use of any such trademarks, service marks, or trade names does not imply any endorsement or recommendation by their respective owners of our products or services." },
      { label: "Responsibility for Own Assessment", body: "By attending or receiving this presentation, you acknowledge that you are solely responsible for your own assessment of the market and our position in it. You agree to conduct your own independent analysis and be solely responsible for forming your own views of the potential future performance of our business." },
      { label: "Contact Information", body: "For additional information, please refer to our annual report, SEC filings, or contact our investor relations team at [email address] or [phone number]." },
    ],
    meta: { studio: "Product Studio", name: "Presentation Name", page: "285" },
  },
  render(s) {
    const signoff = (s.company || s.date)
      ? `<div class="v2f-fin-signoff" style="margin-top:auto">
          ${s.company ? `<p>${esc(s.company)}</p>` : ""}
          ${s.date ? `<p>${esc(s.date)}</p>` : ""}
        </div>`
      : "";
    const middle = `<div class="v2f-fin-discl reveal">
      <div class="v2f-fin-discl-head">
        ${s.title ? `<p class="h">${esc(s.title)}</p>` : ""}
        ${signoff}
      </div>
      ${finDisclaimer(s.sections || [])}
    </div>`;
    return frame(middle, { meta: s.meta, footer: s.footer });
  },
};
