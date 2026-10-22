/* Nagarro Master Slides — slide checks (kit/checks.js)
 * Run every check on every slide before publishing a Claude Slides deck.
 *   NagarroChecks.source(html)        → issues found in the file text (markup, colours, text styles, spans)
 *   NagarroChecks.rendered(sectionEl) → issues found on the rendered slide (content area, overlaps, images, mint marks)
 *   NagarroChecks.frameSignature(sectionEl) → string; must be identical on every slide (page number ignored)
 * An empty array means the slide passes. Needs NagarroCompose (kit/compose.js) for the token and style tables.
 */
(function (root) {
  "use strict";
  const C = root.NagarroCompose;
  const VOID = new Set(["img", "br", "hr", "path", "circle", "rect", "line", "meta", "polygon", "polyline", "ellipse", "stop", "use", "input", "source", "col", "wbr"]);

  function wellFormed(html) {
    const stack = [], out = [], re = /<\/?([a-zA-Z][\w-]*)\b[^>]*?(\/?)>/g; let m;
    const s = html.replace(/<!--[\s\S]*?-->/g, "");
    while ((m = re.exec(s))) {
      const tag = m[1].toLowerCase(), closing = m[0][1] === "/", self = m[2] === "/";
      if (VOID.has(tag) || self) continue;
      if (!closing) stack.push(tag);
      else if (stack[stack.length - 1] === tag) stack.pop();
      else out.push(`markup: </${tag}> does not close <${stack[stack.length - 1] || "nothing"}>`);
    }
    if (stack.length) out.push(`markup: unclosed <${stack.join("> <")}>`);
    return out;
  }

  function source(html, { allowColours = [], allowSpans = false } = {}) {
    const issues = wellFormed(html);
    const theme = /^<section[^>]*background:#010716/.test(html.trim()) ? "dark" : "light";
    const allowed = new Set(Object.values(C.PAL[theme]).concat(["none", "transparent"], allowColours));
    const re = /(color|background|border(?:-[a-z]+)?|fill|stroke)\s*(?::|=")\s*([^;">]+)/g; let m;
    while ((m = re.exec(html))) {
      if (/radius|width|style|collapse/.test(m[1])) continue;
      const c = (m[2].match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|var\([^)]*\))/) || [])[1];
      if (c && !allowed.has(c)) issues.push(`colour: ${m[1]} ${c} is not a DS token for a ${theme} slide`);
    }
    const sty = Object.entries(C.STY).map(([n, [s, l, f, w, ls]]) => ({ n, s, l, ext: f.includes("Extended"), w, ls }));
    const tre = /<(h1|h2|h3|p|li|span)\s+style="([^"]*font-size[^"]*)"/g;
    while ((m = tre.exec(html))) {
      const st = m[2], g = (k) => (st.match(new RegExp(`(?:^|;)${k}:([^;]+)`)) || [])[1];
      const size = parseFloat(g("font-size")), lh = parseFloat(g("line-height")), wt = parseInt(g("font-weight") || "400"), ext = /Extended/.test(g("font-family") || ""), ls = parseFloat(g("letter-spacing") || "0");
      const ok = sty.some((t) => t.s === size && t.l === lh && t.ext === ext && t.w === wt && Math.abs(t.ls - ls) < 0.02);
      if (!ok) issues.push(`type: ${size}/${lh} ${ext ? "Extended" : "Equip"} ${wt} ${ls}px is not a DS text style`);
    }
    if (!allowSpans && /<(?:h1|h2|h3|p|li)\b[^>]*>[^<]*<span[^>]*style="[^"]*color/.test(html)) issues.push("colour: a word inside a text element has its own colour (one colour per text element)");
    return issues;
  }

  function rendered(sec) {
    const R = sec.getBoundingClientRect(), issues = [], texts = [];
    const FT = [40, 57, 60, 995, 1015, 1016];
    const isFrame = (r) => FT.some((t) => Math.abs(r.top - R.top - t) < 1.5) && (r.top - R.top < 125 || r.top - R.top >= 990);
    const bg = (el) => { for (let e = el.parentElement; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c !== "rgba(0, 0, 0, 0)") return c; } return ""; };
    const grey = (r) => [...sec.children].some((d) => { if (d.tagName !== "DIV") return false; const b = getComputedStyle(d).backgroundColor; if (!/rgba\((1, 7, 22|255, 255, 255), 0\.0[58]\)/.test(b)) return false;
      const q = d.getBoundingClientRect(); return r.left >= q.left && r.right <= q.right && r.top >= q.top && r.bottom <= q.bottom; });
    for (const e of sec.querySelectorAll("h1,h2,h3,p,li,img,div,svg")) {
      if (e.closest("svg") && e.tagName.toLowerCase() !== "svg") continue;
      const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || isFrame(r)) continue;
      const cs = getComputedStyle(e), t = (e.innerText || e.getAttribute("alt") || e.tagName).trim().slice(0, 40);
      const isText = ["H1", "H2", "H3", "P", "LI"].includes(e.tagName);
      const painted = e.tagName === "IMG" || e.tagName.toLowerCase() === "svg" || cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.borderTopWidth !== "0px";
      if (!isText && !painted) continue;
      if (r.top - R.top < 155.5) issues.push(`area: "${t}" starts at y=${Math.round(r.top - R.top)} (content starts at 156)`);
      if (r.bottom - R.top > 963.5) issues.push(`area: "${t}" ends at y=${Math.round(r.bottom - R.top)} (content ends at 963)`);
      if (r.left - R.left < 39.5 || r.right - R.left > 1880.5) issues.push(`area: "${t}" is outside x 40–1880`);
      if (isText && e.innerText.trim()) texts.push({ t, r });
      if (e.tagName === "IMG") {
        const fit = cs.objectFit, rad = parseFloat(cs.borderTopLeftRadius);
        if (fit === "fill") issues.push(`image: "${t}" has no object-fit (it stretches)`);
        if (!rad && fit !== "contain") issues.push(`image: "${t}" has no rounded corners`);
      }
      if (e.tagName === "DIV" && cs.backgroundColor === "rgb(71, 215, 172)" && r.width <= 12 && r.height <= 12 && grey(r)) issues.push("mint: a mint bullet sits on a grey panel (use fg-100)");
    }
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const A = texts[i].r, Bx = texts[j].r, ox = Math.min(A.right, Bx.right) - Math.max(A.left, Bx.left), oy = Math.min(A.bottom, Bx.bottom) - Math.max(A.top, Bx.top);
      if (ox > 2 && oy > 2) issues.push(`overlap: "${texts[i].t}" and "${texts[j].t}"`);
    }
    for (const p of sec.querySelectorAll("p,h1,h2,h3")) {
      const cs = getComputedStyle(p); if (cs.color !== "rgb(71, 215, 172)") continue;
      if (getComputedStyle(sec).backgroundColor === "rgb(255, 255, 255)" && parseFloat(cs.fontSize) < 48) issues.push(`mint: "${p.innerText.slice(0, 30)}" is mint text on a light slide`);
    }
    return issues;
  }

  function frameSignature(sec) {
    const R = sec.getBoundingClientRect();
    return [...sec.querySelectorAll("img,div,p")].map((e) => [e, e.getBoundingClientRect()]).filter(([, r]) => r.top - R.top < 125 || r.top - R.top >= 990)
      .filter(([e, r]) => !(e.tagName === "P" && r.left - R.left >= 1829)).map(([e, r]) => `${e.tagName}${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)}x${Math.round(r.height)}`).join("|");
  }

  root.NagarroChecks = { source, rendered, frameSignature, wellFormed };
})(typeof window !== "undefined" ? window : globalThis);
