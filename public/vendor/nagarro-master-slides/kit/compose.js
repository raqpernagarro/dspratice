/* Nagarro Master Slides — compose kit (kit/compose.js)
 * Builds pinned Claude Slides <section> markup from DS tokens, text styles and the approved
 * composed layouts (see 16-composed-layouts.md). Runs in a browser page that has the Equip fonts
 * loaded (kit/compose-runner.html does this) so text can be measured; bundle.js is optional and
 * only needed for icons.
 *
 *   const K = NagarroCompose.init({ deck, client, studio, year, logos, clientLogo });
 *   const html = K.layouts.ideaPhoto({ id, page, title, intro, paras, image });
 *
 * Every layout returns { id, theme, html }. Pages are numbered by the caller (page: "07").
 */
(function (root) {
  "use strict";
  const X = "'Equip Extended', Arial, sans-serif", T = "'Equip', Arial, sans-serif";
  const B = "1, 7, 22", W1 = "255, 255, 255";
  const a = (rgb, v) => `rgba(${rgb}, ${v})`;

  /* DS Theme tokens (02-colour.md) at the values the HTML renders. The only colours a slide may use. */
  const PAL = {
    light: { bg: "#ffffff", f100: "#010716", f75: a(B, 0.75), f60: a(B, 0.6), f50: a(B, 0.58), f30: a(B, 0.3), f25: a(B, 0.45),
      f20: a(B, 0.2), f10: a(B, 0.1), f5: a(B, 0.05), muted: "#8893a5", accent: "#47d7ac", accentDark: "#205463",
      accentSurface: "#d1f5ea", border: a(B, 0.75), ink: "#010716" },
    dark: { bg: "#010716", f100: "#ffffff", f75: a(W1, 0.75), f60: a(W1, 0.6), f50: a(W1, 0.7), f30: a(W1, 0.3), f25: a(W1, 0.45),
      f20: a(W1, 0.2), f10: a(W1, 0.1), f5: a(W1, 0.08), muted: "#a0aab9", accent: "#47d7ac", accentDark: "#47d7ac",
      accentSurface: "#205463", border: a(W1, 0.75), ink: "#ffffff" },
  };
  const MINT = "#47d7ac";

  /* DS text styles (03-typography.md): [size, lineHeight, family, weight, tracking px]. */
  const STY = {
    TextXS: [12, 16, T, 400, 0], TextSM: [14, 20, T, 400, 0], TextMD: [16, 24, T, 400, 0], TextLG: [18, 28, T, 400, 0], TextXL: [20, 28, T, 400, 0],
    Heading6: [24, 32, X, 500, -0.48], Heading5: [28, 36, X, 500, -0.56], Heading4: [36, 44, X, 500, -0.72], Heading3: [48, 56, X, 500, -0.96],
    Heading2: [60, 68, X, 500, -1.2], Heading1: [100, 108, X, 500, -2], Title: [150, 150, X, 500, -3], Display: [250, 250, X, 500, 0],
  };

  /* Canvas and frame geometry (04-layout.md). */
  const G = { TOP: 156, BOT: 963, L: 40, R: 1880, W: 1840 };

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const r1 = (v) => Math.round(v * 10) / 10;

  let _m;
  function measure(html, style, width) {
    const [size, lh, fam, wt, ls] = STY[style];
    if (!_m) { _m = document.createElement("p"); _m.style.cssText = "position:absolute;left:-9999px;top:0;margin:0"; document.body.appendChild(_m); }
    _m.style.width = width + "px"; _m.style.fontFamily = fam; _m.style.fontSize = size + "px"; _m.style.lineHeight = lh + "px";
    _m.style.fontWeight = wt; _m.style.letterSpacing = ls ? ls + "px" : "normal"; _m.style.whiteSpace = "normal"; _m.innerHTML = html;
    return _m.getBoundingClientRect().height;
  }
  function textWidth(html, style) {
    measure(html, style, 99999); _m.style.width = "auto"; _m.style.whiteSpace = "nowrap"; _m.style.display = "inline-block";
    const w = _m.getBoundingClientRect().width; _m.style.display = ""; return w;
  }

  /* ---------- primitives ---------- */
  function ts(style, x, y, w, html, col, tag = "p", extra = "") {
    const [size, lh, fam, wt, ls] = STY[style];
    return `<${tag} style="position:absolute;left:${r1(x)}px;top:${r1(y)}px;width:${r1(w)}px;font-family:${fam};font-size:${size}px;line-height:${lh}px;font-weight:${wt};color:${col};${ls ? `letter-spacing:${ls}px;` : ""}${extra}">${html}</${tag}>`;
  }
  function box(x, y, w, h, bg, r, extra = "") {
    return `<div style="position:absolute;left:${r1(x)}px;top:${r1(y)}px;width:${r1(w)}px;height:${r1(h)}px;${bg ? `background:${bg};` : ""}${r ? `border-radius:${r}px;` : ""}${extra}"></div>`;
  }
  const rule = (x, y, w, col) => box(x, y, w, 1, col);
  function img(src, alt, x, y, w, h, { fit = "cover", r = 15, pos = "center", extra = "" } = {}) {
    return `<img src="${src}" alt="${esc(alt)}" style="position:absolute;left:${r1(x)}px;top:${r1(y)}px;width:${r1(w)}px;height:${r1(h)}px;object-fit:${fit};object-position:${pos};border-radius:${r}px;${extra}">`;
  }
  function icon(name, x, y, size, col) {
    if (!root.NagarroSlides || !root.NagarroSlides.icon) throw new Error("icons need components/bundle.js");
    const s = root.NagarroSlides.icon(name).replace(/currentColor/g, col).replace(/var\(--stroke-0,\s*#[0-9a-fA-F]+\)/g, col);
    return s.replace("<svg ", `<svg role="img" aria-label="${esc(name)} icon" width="${size}" height="${size}" style="position:absolute;left:${r1(x)}px;top:${r1(y)}px;width:${size}px;height:${size}px;" `);
  }
  function paras(p, x, y, w, list, style = "TextXL", col, gap = 16) {
    const out = [];
    for (const t of list) { out.push(ts(style, x, y, w, esc(t), col || p.f75)); y += measure(esc(t), style, w) + gap; }
    return { els: out, bottom: y - gap };
  }

  function init(cfg) {
    const C = Object.assign({ studio: "", year: "2026", client: "[Client]" }, cfg);
    if (!C.deck) throw new Error("init needs deck (the presentation name)");
    if (!C.logos || !C.logos.light || !C.logos.dark) throw new Error("init needs logos.light / logos.dark: the Header logos (Horizontal, Mint) as image urls");

    /* ---------- frame: Header (+ client logo) and Footer, identical on every slide ---------- */
    function frame(th, page, logoOnly) {
      const p = PAL[th], c = p.f50, fs = `font-family:${T};font-size:16px;font-weight:400;line-height:24px;`;
      const o = [`<img src="${C.logos[th]}" alt="Nagarro" style="position:absolute;left:40px;top:40px;width:203px;height:64px;object-fit:contain;">`];
      if (C.clientLogo) {
        const cw = C.clientLogo.width || 135;
        o.push(box(267, 57, 1, 30, p.ink),
          `<img src="${C.clientLogo[th]}" alt="${esc(C.client)}" style="position:absolute;left:292px;top:57px;width:${cw}px;height:30px;object-fit:contain;object-position:left center;">`);
      }
      o.push(box(40, 40, 1840, 84, null, null, `border-bottom:1px solid ${c};`));
      if (!logoOnly) {
        const items = [C.studio, C.deck].filter(Boolean);
        let x = 1815.8;
        o.push(box(1815.8, 60, 1, 24, null, null, `border-left:1px solid ${c};`),
          `<p style="position:absolute;left:1830px;top:60px;width:50px;${fs}color:${c};text-align:right;">${esc(page)}</p>`);
        for (let i = items.length - 1; i >= 0; i--) {
          const w = textWidth(esc(items[i]), "TextMD"); x = x - 25 - w;
          o.push(`<p style="position:absolute;left:${r1(x)}px;top:60px;width:${r1(w + 2)}px;${fs}color:${c};">${esc(items[i])}</p>`);
          if (i > 0) { x -= 25; o.push(box(r1(x), 60, 1, 24, null, null, `border-left:1px solid ${c};`)); }
        }
      }
      [C.deck, `Prepared for ${C.client}`].forEach((t, i) => {
        const fx = [40, 661.3][i];
        o.push(box(fx, 995, 597.3, 45, null, null, `border-top:1px solid ${c};`), `<p style="position:absolute;left:${fx}px;top:1015px;width:597.3px;${fs}color:${c};">${esc(t)}</p>`);
      });
      o.push(box(1282.7, 995, 597.3, 45, null, null, `border-top:1px solid ${c};`), `<p style="position:absolute;left:1680px;top:1015px;width:200px;${fs}color:${c};text-align:right;">© ${esc(C.year)}</p>`);
      return o.join("\n");
    }
    function section(id, th, body, { page, logoOnly = false, notes } = {}) {
      const p = PAL[th];
      let s = `<section id="${id}" data-transition="fade" style="background:${p.bg};color:${p.f100};font-family:${T};">\n${body.join("\n")}\n${frame(th, page || "", logoOnly)}\n`;
      if (notes) s += `<aside>${esc(notes)}</aside>\n`;
      return { id, theme: th, html: s + "</section>\n" };
    }
    /* PageHeader: [caption TextXL fg-50 @156, 6px] title Heading2 [6px intro Heading5 fg-50]. Returns content top (48px below). */
    function pageHead(p, { caption, title, intro, width = G.W }) {
      const els = []; let y = G.TOP;
      if (caption) { els.push(ts("TextXL", G.L, y, width, esc(caption), p.f50)); y += 28 + 6; }
      els.push(ts("Heading2", G.L, y, width, esc(title), p.f100, "h2")); y += measure(esc(title), "Heading2", width);
      if (intro) { els.push(ts("Heading5", G.L, y + 6, width, esc(intro), p.f50)); y += 6 + measure(esc(intro), "Heading5", width); }
      return { els, top: y + 48 };
    }
    function fail(id, msg) { throw new Error(`${id}: ${msg}`); }

    const layouts = {
      /* 1 Cover — dark, logo-only header. */
      cover({ id, page, caption, title, subtitle, notes }) {
        const p = PAL.dark, w = 1500, hs = subtitle ? measure(esc(subtitle), "Heading3", w) : 0, ht = measure(esc(title), "Heading1", w);
        const yS = G.BOT - hs, yT = (subtitle ? yS - 32 : G.BOT) - ht, yC = yT - 24 - 28;
        const b = []; if (caption) b.push(ts("TextXL", G.L, yC, w, esc(caption), p.f50));
        b.push(ts("Heading1", G.L, yT, w, esc(title), p.f100, "h1")); if (subtitle) b.push(ts("Heading3", G.L, yS, w, esc(subtitle), p.f50));
        return section(id, "dark", b, { page, logoOnly: true, notes });
      },
      /* 2 Chapter cover — dark, number + title at the top. */
      chapter({ id, page, number, title, notes }) {
        const p = PAL.dark;
        if (measure(esc(title), "Heading1", 1691.3) > 216) fail(id, "chapter title over two lines");
        return section(id, "dark", [ts("Heading1", G.L, G.TOP, 130.7, esc(number), p.f50), ts("Heading1", 188.7, G.TOP, 1691.3, esc(title), p.f100, "h1")], { page, notes });
      },
      /* 3 Topic cover — dark, mint label at top, title (+ subtitle) anchored to the bottom. */
      topicCover({ id, page, label, title, subtitle, notes }) {
        const p = PAL.dark, b = [ts("Heading6", G.L, G.TOP, G.W, esc(label), MINT)];
        const ht = measure(esc(title), "Heading1", G.W); const y = G.BOT - (subtitle ? 56 + 24 : 0) - ht;
        b.push(ts("Heading1", G.L, y, G.W, esc(title), p.f100, "h1")); if (subtitle) b.push(ts("Heading3", G.L, G.BOT - 56, G.W, esc(subtitle), p.f50));
        return section(id, "dark", b, { page, notes });
      },
      /* 4 Idea + photo — light. Image column 880 wide, filling to y=963; text column right. */
      ideaPhoto({ id, page, caption, title, intro, paras: ps, image, notes }) {
        const p = PAL.light, h = pageHead(p, { caption, title, intro }), b = h.els, y0 = h.top;
        const capH = image.caption ? 40 : 0, iw = 880, ih = G.BOT - y0 - capH;
        if (image.graphic) b.push(box(G.L, y0, iw, ih, p.f5, 15), img(image.src, image.alt, G.L + 32, y0 + 32, iw - 64, ih - 64, { fit: "contain", r: 0, extra: "mix-blend-mode:multiply;" }));
        else b.push(img(image.src, image.alt, G.L, y0, iw, ih, { pos: image.position || "center" }));
        if (image.caption) b.push(ts("TextMD", G.L, y0 + ih + 16, iw, esc(image.caption), p.f50));
        const tx = G.L + iw + 40, r = paras(p, tx, y0, G.R - tx, ps, "TextXL");
        if (r.bottom > G.BOT) fail(id, `text runs to ${r.bottom} (> 963): split the slide or trim`);
        return section(id, "light", b.concat(r.els), { page, notes });
      },
      /* 5 Numbered two-column text — dark or light, no picture. */
      twoColumnText({ id, page, theme = "dark", caption, title, intro, paras: ps, notes }) {
        const p = PAL[theme], h = pageHead(p, { caption, title, intro }), b = h.els, cw = (G.W - 40) / 2;
        let y = h.top, k = 0;
        for (let i = 0; i < ps.length; i += 2) {
          let hm = 0;
          ps.slice(i, i + 2).forEach((t, j) => {
            const x = G.L + j * (cw + 40); k++;
            b.push(rule(x, y, cw, p.f20), ts("Heading6", x, y + 16, cw, String(k).padStart(2, "0"), theme === "dark" ? MINT : p.f50), ts("TextXL", x, y + 64, cw, esc(t), p.f75));
            hm = Math.max(hm, 64 + measure(esc(t), "TextXL", cw));
          });
          y += hm + 40;
        }
        if (y - 40 > G.BOT) fail(id, "text overflows: split the slide");
        return section(id, theme, b, { page, notes });
      },
      /* 6 Icon cards — light. 3–5 in a row or 6 in 2×3; heading + body or bullets, anchored low. */
      iconCards({ id, page, theme = "light", caption, title, intro, items, notes }) {
        const p = PAL[theme], h = pageHead(p, { caption, title, intro }), b = h.els, y0 = h.top, n = items.length;
        if (n < 3 || n > 6) fail(id, "icon cards hold 3–6 items");
        const cols = n <= 5 ? n : 3, rows = Math.ceil(n / cols), gap = 24, cw = (G.W - gap * (cols - 1)) / cols, ch = (G.BOT - y0 - gap * (rows - 1)) / rows;
        const big = cols <= 4 || items.every((it) => !it.body && !it.bullets), hs = big ? "Heading5" : "Heading6";
        items.forEach((it, i) => {
          const x = G.L + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap), iw = cw - 64;
          b.push(box(x, y, cw, ch, p.f5, 15), icon(it.icon, x + 32, y + 32, 64, p.ink), ts("Heading6", x + cw - 112, y + 32, 80, String(i + 1).padStart(2, "0"), p.f50, "p", "text-align:right;"));
          const blocks = [["h", it.title]].concat(it.body ? [["b", it.body]] : (it.bullets || []).map((t) => ["l", t]));
          const hh = blocks.map(([k, t]) => k === "h" ? measure(esc(t), hs, iw) : measure(esc(t), "TextLG", k === "l" ? iw - 24 : iw));
          let yy = y + ch - 32 - (hh.reduce((s, v) => s + v, 0) + 12 * (hh.length - 1));
          if (yy < y + 32 + 64 + 24) fail(id, `card ${i + 1} text too long for the card`);
          blocks.forEach(([k, t], j) => {
            if (k === "h") b.push(ts(hs, x + 32, yy, iw, esc(t), p.f100, "h3"));
            else if (k === "b") b.push(ts("TextLG", x + 32, yy, iw, esc(t), p.f60));
            else b.push(box(x + 32, yy + 11, 8, 8, p.f100, 4), ts("TextLG", x + 56, yy, iw - 24, esc(t), p.f60)); /* never mint dots on grey */
            yy += hh[j] + 12;
          });
        });
        return section(id, theme, b, { page, notes });
      },
      /* 7 Year timeline — light. 6–10 year cards in two rows of up to 5. */
      yearTimeline({ id, page, caption, title, intro, years, notes }) {
        const p = PAL.light, h = pageHead(p, { caption, title, intro }), b = h.els, y0 = h.top, cols = 5, gap = 24;
        if (years.length > 10) fail(id, "timeline holds up to 10 years");
        const cw = (G.W - gap * 4) / cols, iw = cw - 48;
        const need = (ev) => 44 + 44 + 16 + ev.reduce((s, t) => s + 20 + measure(esc(t), "TextLG", iw), 0) + 16;
        const rowsN = years.length > cols ? 2 : 1, tot = G.BOT - y0 - gap * (rowsN - 1);
        const n1 = Math.max(...years.slice(0, cols).map((yv) => need(yv.events))), n2 = rowsN > 1 ? Math.max(...years.slice(cols).map((yv) => need(yv.events))) : 0;
        if (n1 + n2 > tot) fail(id, "too many events for the cards");
        const h1 = rowsN > 1 ? n1 + (tot - n1 - n2) / 2 : tot, RH = [h1, tot - h1];
        years.forEach((yv, i) => {
          const r = Math.floor(i / cols), x = G.L + (i % cols) * (cw + gap), y = y0 + (r ? RH[0] + gap : 0);
          b.push(box(x, y, cw, RH[r], p.f5, 15), box(x + 24, y + 24, 40, 4, MINT, 2), ts("Heading4", x + 24, y + 44, iw, esc(yv.year), p.f100, "h3"));
          let yy = y + 104;
          for (const t of yv.events) { b.push(rule(x + 24, yy, iw, p.f10), ts("TextLG", x + 24, yy + 10, iw, esc(t), p.f75)); yy += 20 + measure(esc(t), "TextLG", iw); }
        });
        return section(id, "light", b, { page, notes });
      },
      /* 8 Metric grid — light. 2×3 (or 1×3) cards: label, Heading3 value, short bullets. */
      metricGrid({ id, page, caption, title, intro, cards, notes }) {
        const p = PAL.light, h = pageHead(p, { caption, title, intro }), b = h.els, y0 = h.top;
        if (cards.length !== 3 && cards.length !== 6) fail(id, "metric grid holds 3 or 6 cards");
        const rows = cards.length / 3, cw = (G.W - 48) / 3, ch = (G.BOT - y0 - 24 * (rows - 1)) / rows, iw = cw - 64;
        cards.forEach((c, i) => {
          const x = G.L + (i % 3) * (cw + 24), y = y0 + Math.floor(i / 3) * (ch + 24);
          b.push(box(x, y, cw, ch, p.f5, 15), ts("TextXL", x + 32, y + 28, iw, esc(c.label), p.f50), ts("Heading3", x + 32, y + 64, iw, esc(c.value), p.f100, "h3"));
          let yy = y + 136;
          for (const t of c.bullets || []) { b.push(box(x + 32, yy + 11, 8, 8, p.f100, 4), ts("TextLG", x + 56, yy, iw - 24, esc(t), p.f75)); yy += measure(esc(t), "TextLG", iw - 24) + 8; }
          if (yy - 8 > y + ch - 24) fail(id, `card ${i + 1} overflows`);
        });
        return section(id, "light", b, { page, notes });
      },
      /* 9 Grouped lists + photo — light. 2–3 groups left; photo and one group right. */
      groupedLists({ id, page, caption, title, intro, groups, side, notes }) {
        const p = PAL.light, h = pageHead(p, { caption, title, intro }), b = h.els, y0 = h.top;
        const group = (x, y, w, g) => { b.push(rule(x, y, w, p.f10), ts("Heading5", x, y + 24, w, esc(g.title), p.f100, "h3")); let yy = y + 76;
          for (const t of g.items) { b.push(box(x, yy + 11, 8, 8, MINT, 4), ts("TextXL", x + 24, yy, w - 24, esc(t), p.f75)); yy += measure(esc(t), "TextXL", w - 24) + 8; } return yy - 8; };
        let y = y0; for (const g of groups) y = group(G.L, y, 860, g) + 40;
        if (y - 40 > G.BOT) fail(id, "left groups overflow");
        if (side) {
          const gh = side.group ? 76 + side.group.items.reduce((s, t) => s + measure(esc(t), "TextXL", 916) + 8, 0) : 0, ih = G.BOT - y0 - (gh ? gh + 32 : 0);
          b.push(img(side.image.src, side.image.alt, 940, y0, 940, ih, { pos: side.image.position || "center" }));
          if (side.group) group(940, y0 + ih + 32, 940, side.group);
        }
        return section(id, "light", b, { page, notes });
      },
      /* 10 Numbered summary list — light. 3–6 rows. */
      summaryList({ id, page, caption, title, rows, notes }) {
        const p = PAL.light, h = pageHead(p, { caption, title }), b = h.els, y0 = h.top, rh = (G.BOT - y0) / rows.length;
        if (rows.length > 6) fail(id, "summary list holds up to 6 rows");
        rows.forEach((r, i) => { const y = y0 + i * rh;
          b.push(rule(G.L, y, G.W, p.f10), ts("Heading3", G.L, y + 24, 120, String(i + 1).padStart(2, "0"), p.f25), ts("Heading4", 200, y + 30, 1000, esc(r.title), p.f100, "h3"), ts("Heading6", 1240, y + 36, 640, esc(r.detail || ""), p.f50)); });
        return section(id, "light", b, { page, notes });
      },
      /* 11 From-to table — light. 4–8 rows of problem → outcome. */
      fromTo({ id, page, caption, title, intro, fromLabel = "Pain", toLabel = "Gain", rows, notes }) {
        const p = PAL.light, h = pageHead(p, { caption, title, intro }), b = h.els, y0 = h.top, gx = 1240;
        if (rows.length < 3 || rows.length > 8) fail(id, "from-to table holds 3–8 rows");
        b.push(ts("TextXL", G.L, y0, 1100, esc(fromLabel), p.f50), ts("TextXL", gx, y0, 640, esc(toLabel), p.f50));
        const rh = (G.BOT - (y0 + 44)) / rows.length;
        rows.forEach(([f, t], i) => { const y = y0 + 44 + i * rh;
          b.push(rule(G.L, y, G.W, p.f10), icon("alert", G.L, y + 18, 40, p.f50), ts("TextXL", G.L + 64, y + 24, 1060, esc(f), p.f75),
            icon("forward", 1160, y + 18, 40, p.f50), icon("checkmark", gx, y + 18, 40, p.ink), ts("Heading6", gx + 64, y + 22, 576, esc(t), p.f100)); });
        return section(id, "light", b, { page, notes });
      },
      /* 12 Logo wall — light. Up to 48 cells (8×6); text cells may span 2. */
      logoWall({ id, page, caption, title, cells, notes }) {
        const p = PAL.light, h = pageHead(p, { caption, title }), b = h.els, y0 = h.top, cols = 8, rows = 6, gap = 16;
        const cw = (G.W - gap * 7) / cols, ch = (G.BOT - y0 - gap * 5) / rows; let slot = 0;
        for (const c of cells) {
          const span = c.span || 1; if (slot % cols + span > cols) slot += cols - slot % cols;
          const x = G.L + (slot % cols) * (cw + gap), y = y0 + Math.floor(slot / cols) * (ch + gap), ww = cw * span + gap * (span - 1);
          b.push(box(x, y, ww, ch, p.bg, 15, `border:1px solid ${p.f10};box-sizing:border-box;`));
          if (c.text) b.push(ts("Heading6", x + 20, y + 16, ww - 40, esc(c.text), p.f100), ts("TextMD", x + 20, y + 52, ww - 40, esc(c.detail || ""), p.f60));
          else b.push(img(c.src, c.alt, x + 20, y + 16, cw - 40, ch - 32, { fit: "contain", r: 0 }));
          slot += span;
        }
        if (slot > cols * rows) fail(id, "logo wall holds 48 cells");
        return section(id, "light", b, { page, notes });
      },
      /* 13 Statement — dark. Heading1 + Heading3 line. */
      statement({ id, page, title, subtitle, notes }) {
        const p = PAL.dark, ht = measure(esc(title), "Heading1", 1400), y = 436 - (ht - 108) / 2;
        return section(id, "dark", [ts("Heading1", G.L, y, 1400, esc(title), p.f100, "h1"), subtitle ? ts("Heading3", G.L, y + ht + 32, 1400, esc(subtitle), p.f50) : ""], { page, notes });
      },
      /* 14 Closing — dark. Two-line Heading1, Heading3 line, website in mint. */
      closing({ id, page, title, subtitle, website = "www.nagarro.com", notes }) {
        const p = PAL.dark, ht = measure(esc(title).replace(/\n/g, "<br>"), "Heading1", 1400);
        return section(id, "dark", [ts("Heading1", G.L, 300, 1400, esc(title).replace(/\n/g, "<br>"), p.f100, "h1"),
          subtitle ? ts("Heading3", G.L, 300 + ht + 32, 1400, esc(subtitle), p.f50) : "", ts("Heading5", G.L, G.BOT - 36, 800, esc(website), MINT)], { page, notes });
      },
      /* 15 Metric row — light. PageHeader (title left 1100, intro right) + 4 Heading1 metrics on the bottom edge. */
      metricRow({ id, page, caption, title, intro, metrics, notes }) {
        const p = PAL.light, h = pageHead(p, { caption, title, width: 1100 }), b = h.els;
        if (intro) b.push(ts("Heading5", 1260, G.TOP + (caption ? 34 : 0), 620, esc(intro), p.f50));
        const n = metrics.length, cw = (G.W - 24 * (n - 1)) / n, lab = Math.max(...metrics.map((m) => measure(esc(m.label), "TextXL", cw))), yr = G.BOT - (24 + 108 + 16 + lab);
        if (yr < h.top) fail(id, "metrics collide with the heading");
        metrics.forEach((m, i) => { const x = G.L + i * (cw + 24), last = i === n - 1;
          b.push(box(x, yr, cw, last ? 4 : 1, last ? MINT : p.f100), ts("Heading1", x, yr + 24, cw, esc(m.value), p.f100), ts("TextXL", x, yr + 148, cw, esc(m.label), p.f60)); });
        return section(id, "light", b, { page, notes });
      },
      /* 16 KPI panels — light. One mint hero panel + four fg-5 cards. */
      kpiPanels({ id, page, caption, title, hero, cards, notes }) {
        const p = PAL.light, h = pageHead(p, { caption, title, width: 1400 }), b = h.els, y0 = h.top, gh = G.BOT - y0;
        if (cards.length !== 4) fail(id, "KPI panels hold 1 hero + 4 cards");
        const c1 = (G.W - 48) * 1.4 / 3.4, c2 = (G.W - 48 - c1) / 2, big = textWidth(esc(hero.value), "Title") <= c1 - 80 ? "Title" : "Heading1";
        const hn = measure(esc(hero.note || ""), "TextXL", c1 - 80);
        b.push(box(G.L, y0, c1, gh, MINT, 15), ts("TextXL", G.L + 40, y0 + 40, c1 - 80, esc(hero.label), p.f100),
          ts(big, G.L + 40, G.BOT - 40 - hn - 16 - STY[big][1], c1 - 80, esc(hero.value), p.f100), ts("TextXL", G.L + 40, G.BOT - 40 - hn, c1 - 80, esc(hero.note || ""), p.f100));
        const ch = (gh - 24) / 2;
        cards.forEach((c, i) => { const x = G.L + c1 + 24 + Math.floor(i / 2) * (c2 + 24), y = y0 + (i % 2) * (ch + 24), iw = c2 - 80;
          b.push(box(x, y, c2, ch, p.f5, 15), ts("TextXL", x + 40, y + 40, iw, esc(c.label), p.f60), ts("Heading2", x + 40, y + ch - 148, iw, esc(c.value), p.f100), ts("TextLG", x + 40, y + ch - 68, iw, esc(c.note || ""), p.f60)); });
        return section(id, "light", b, { page, notes });
      },
      /* 17 Letter grid — dark. 3×2 values: mint letter, Heading4 title, TextXL body. */
      letterGrid({ id, page, caption, title, items, notes }) {
        const p = PAL.dark, h = pageHead(p, { caption, title, width: 1400 }), b = h.els, y0 = h.top;
        if (items.length !== 6 && items.length !== 3) fail(id, "letter grid holds 3 or 6 items");
        const rows = items.length / 3, cw = (G.W - 48) / 3, rh = (G.BOT - y0 - 24 * (rows - 1)) / rows;
        items.forEach((it, i) => { const x = G.L + (i % 3) * (cw + 24), y = y0 + Math.floor(i / 3) * (rh + 24);
          b.push(rule(x, y, cw, p.f20), ts("Heading2", x, y + 24, cw, esc(it.letter), MINT), ts("Heading4", x, y + 116, cw, esc(it.title), p.f100, "h3"), ts("TextXL", x, y + 172, cw, esc(it.body), p.f75));
          if (172 + measure(esc(it.body), "TextXL", cw) > rh) fail(id, `item ${i + 1} too long`); });
        return section(id, "dark", b, { page, notes });
      },
      /* 18 Photo gallery — dark or light. One large photo + 2×2. */
      gallery({ id, page, theme = "dark", caption, title, photos, notes }) {
        const p = PAL[theme], h = pageHead(p, { caption, title, width: 1600 }), b = h.els, y0 = h.top, gh = G.BOT - y0;
        if (photos.length !== 5) fail(id, "gallery holds 5 photos");
        const bw = 1000, rw = G.W - bw - 24, sw = (rw - 24) / 2, sh = (gh - 24) / 2;
        b.push(img(photos[0].src, photos[0].alt, G.L, y0, bw, gh));
        photos.slice(1).forEach((ph, i) => b.push(img(ph.src, ph.alt, G.L + bw + 24 + (i % 2) * (sw + 24), y0 + Math.floor(i / 2) * (sh + 24), sw, sh)));
        return section(id, theme, b, { page, notes });
      },
    };
    return { PAL, STY, G, MINT, ts, box, rule, img, icon, measure, textWidth, paras, esc, frame, section, pageHead, layouts };
  }

  root.NagarroCompose = { init, PAL, STY, G, MINT };
})(typeof window !== "undefined" ? window : globalThis);
