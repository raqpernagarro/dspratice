// Template: main/testimonials-01 — a client-testimonial wall: heading over two columns
// of quote cards (round avatar + quote + attribution). Source Figma frame 342:39643.
import { esc } from "../components.js";
import { topBar, footerBar, pageHeader } from "../frame.js";
import { plAvatar } from "../planning-blocks.js";

// Attribution convention: `name` (person) + `role` = "Role, Company".
// Rendered as name (emphasised) followed by a muted "Role, Company" line.
const QUOTES = [
  { q: "“…Nagarro stands for competence and technology, for open and transparent communication, and for the ambition to develop a long-term partnership…”", name: "Dr. Thomas Wittmann", role: "CEO, Lufthansa Systems" },
  { q: "“I wouldn’t recommend Nagarro to our competitors—but for any organization looking for an agile and experienced partner to navigate the complexities of digital transformation and innovation, I would recommend Nagarro 100%…”", name: "Andreas Demetriou", role: "CIO, Alphamega" },
  { q: "“…we are looking forward to continuing the development…I feel honored to be working in such a great team ”", name: "Gunther Machu", role: "Head of New Ventures Lab & Senior VP, Hoerbiger" },
  { q: "“We wanted our customers to self-service order information online. We have chosen Nagarro as an e-commerce partner around the world and had a wonderful experience working with them …”", name: "Jill Ullathorne", role: "Digital Director – Sales & Marketing, Croda" },
  { q: "“…Nagarro played a key role in onboarding our acquired entities across the globe to HID’s unified Oracle platform. Nagarro has been extremely agile and followed a customer-centric approach…”", name: "Elizabeth Bayer", role: "Sr. Director – Global Application, HID Global" },
  { q: "“…When Nagarro is given something, they own and run with it. When they deliver the solution, it’s not individual ownership but it’s the ownership from the company…”", name: "Fawad Ahmed", role: "Director Data Analytics, Hood Industries" },
  { q: "“We were looking for a technology partner to become an extension of our team. I would recommend Nagarro to any company looking for a true partner to help them evolve the digital platform…”", name: "Lea Volpe", role: "VP – Communications & Community Relations, Huber" },
  { q: "“…trusted relationship with Nagarro based on innovation, easy to work with, competency, problem-solving attitude and transparency…”", name: "Stéphane Mermilliod", role: "Vice President CPQ, Schneider Electric" },
];

const card = (t, i) => `
  <div class="v2f-mn-tq">
    <span class="av"><img src="${esc(t.avatar || plAvatar(i))}" alt=""></span>
    <div class="body">
      <p class="q">${esc(t.q)}</p>
      ${t.name || t.role ? `<p class="a">${t.name ? `<span class="nm">${esc(t.name)}</span>` : ""}${t.role ? `<span class="rl">${esc(t.role)}</span>` : ""}</p>` : ""}
    </div>
  </div>`;

export default {
  name: "main/testimonials-01", slide: -35, figmaNode: "342:39643",
  family: "main", role: "content", shape: "grid", theme: "light", chrome: false,
  use: "A client-testimonial wall — heading over two columns of quote cards (avatar + quote + attribution).",
  media: ["photo"], capacity: { items: 8, min: 4, max: 10 },
  slots: { images: 8, titles: 1, body: 8, stats: 0, icons: 0 },
  description: "main/testimonials-01 — heading + two columns of avatar/quote/attribution cards.",
  schema: {
    title: "string — heading",
    quotes: "array of { q, name, role, avatar? }  (role = 'Role, Company')",
    meta: "{ studio, name, page }", footer: "{ col1, col2, col3, copyright }",
  },
  example: {
    title: "What our clients say about us",
    quotes: QUOTES,
    meta: { studio: "Product Studio", name: "Presentation Name", page: "01" },
  },
  render(s) {
    const items = s.quotes || QUOTES;
    const half = Math.ceil(items.length / 2);
    const col = (arr, off) => `<div class="v2f-mn-tq-col">${arr.map((t, i) => card(t, i + off)).join("")}</div>`;
    return `
      <div class="v2f-root">
        ${topBar(s.meta)}
        <div class="v2f-mn-tq-wrap reveal">
          ${pageHeader({ title: s.title ?? "" })}
          <div class="v2f-mn-tq-cols">
            ${col(items.slice(0, half), 0)}
            ${col(items.slice(half), half)}
          </div>
        </div>
        ${footerBar(s.footer)}
      </div>`;
  },
};
