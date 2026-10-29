// =============================================================================
// Built-in Nagarro logo artwork for the brand-guidelines logo slides (Figma
// "Logo Nagarro" component: Format = Horizontal / Vertical / Scribble, Color =
// Mint / Neutral). A logo field on those slides takes either an image URL (a
// client's own artwork) or one of these keywords:
//
//   nagarro:horizontal   mint symbol + wordmark          (Format=Horizontal, Color=Mint)
//   nagarro:vertical     the stacked lock-up             (Format=Vertical,   Color=Mint)
//   nagarro:neutral      symbol and wordmark in one ink  (Format=Horizontal, Color=Neutral)
//   nagarro:mark         the symbol alone                (Format=Scribble,   Color=Mint)
//
// The keyword versions are inline SVG: the wordmark (and the neutral symbol)
// is currentColor, so it follows the tile it sits on and the slide theme. The
// viewBoxes keep the component's clear space, so a logo box sized like the
// Figma instance places the artwork exactly where Figma does.
// =============================================================================
import { esc } from "./components.js";
import { NAGARRO_LOGO } from "./logo.js";
import { NAGARRO_LOGO_VERTICAL } from "./logo-vertical.js";

const MINT = "#47D7AC";
const paths = (svg) => svg.match(/<path[\s\S]*?\/>/g) || [];
const H = paths(NAGARRO_LOGO);
const V = paths(NAGARRO_LOGO_VERTICAL);
const ink = (p) => p.replace(/fill="#47D7AC"/i, 'fill="currentColor"');
const svg = (box, body) => `<svg class="v2f-nl" viewBox="${box}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Nagarro">${body}</svg>`;

// Horizontal art is 191.678 × 47.89; the component frame (760 × 240 at 3.745×)
// adds 5.69 / 8.04 of clear space round it — the same offsets the header logo uses.
const H_BOX = "-5.69 -8.04 202.93 64.08";
const ART = {
  horizontal: () => svg(H_BOX, H.join("")),
  neutral: () => svg(H_BOX, H.map(ink).join("")),
  vertical: () => svg("0 0 267 201", V.join("")),
  // The symbol alone: the first path of the horizontal art (0..58.8 × 0..47.9),
  // padded to the Scribble component's 177 × 162 frame.
  mark: () => svg("-2 -5 62.8 57.9", H[0].replace(/fill="[^"]*"/, `fill="${MINT}"`)),
};

/** True when `v` names built-in artwork rather than an image URL. */
export const isBrandLogo = (v) => typeof v === "string" && v.startsWith("nagarro:") && !!ART[v.slice(8)];

/** The artwork for a logo field: inline SVG for a keyword, an <img> for a URL, nothing when empty. */
export const brandLogoArt = (v, { cls = "" } = {}) => {
  if (!v) return "";
  if (isBrandLogo(v)) return ART[v.slice(8)]().replace('class="v2f-nl"', `class="v2f-nl ${cls}"`);
  return `<img class="${cls}" src="${esc(v)}" alt="">`;
};
