import fs from "node:fs";
const P = "out/project/";
const t = JSON.parse(fs.readFileSync(P + "tokens.json", "utf8"));
const theme = process.argv[2] || "light";
const val = (v, th) => typeof v === "string" ? v : (v[th] ?? v.light);
const cv = (v, th) => { const x = val(v, th); return x.startsWith("{") ? `var(--${x.slice(1, -1)})` : x; };
let css = `:root{${t.color.tokens.map(c => `--${c.name}:${cv(c.value, theme)};`).join("")}`;
for (const fam of ["spacing", "radius", "layout", "weight"]) css += t[fam].tokens.map(x => `--${x.name}:${x.value};`).join("");
css += Object.entries(t.type.families).map(([k, v]) => `--font-${k}:${v};`).join("") + "}";
css += t.type.fonts.map(f => `@font-face{font-family:"${f.family}";src:url("/project/${f.file}") format("woff2");font-weight:${f.weight};}`).join("");
fs.writeFileSync(P + "_test-tokens.css", css);
for (const d of fs.readdirSync(P + "components")) {
  const f = P + "components/" + d + "/preview.html"; if (!fs.existsSync(f)) continue;
  let h = fs.readFileSync(f, "utf8").replace("<head>", `<head><link rel="stylesheet" href="/project/_test-tokens.css"><link rel="stylesheet" href="/project/components/bundle.css"><script src="/project/components/bundle.js"></script>`).replace("<html", `<html data-theme="${theme}"`);
  fs.writeFileSync(P + "components/" + d + "/_test.html", h);
}
console.log("ok");
