import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
// Loads every registered template and records its metadata and the media its example uses. Writes to the cwd (.build/).
const ROOT = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
const reg = await import(ROOT + '/js/templates/index.js');
console.log(Object.keys(reg));
const all = reg.TEMPLATES ?? reg.templates ?? reg.default;
const list = Array.isArray(all) ? all : Object.values(all);
const out = []; const assets = new Map(); const errs = [];
for (const t of list) {
  let html = '';
  try { html = t.render(t.example ?? {}, { deck: {}, esc: s => String(s ?? '') }); } catch (e) { errs.push([t.name, e.message]); }
  for (const m of html.matchAll(/(?:src=["']|url\(["']?)([^"')]+\.(?:png|jpe?g|webp|svg|gif|mp4))/gi)) {
    const p = m[1].replace(/^\//, ''); if (/^(https?:|data:)/.test(p)) continue;
    assets.set(p, (assets.get(p) || 0) + 1);
  }
  out.push({ name: t.name, family: t.family, role: t.role, shape: t.shape, theme: t.theme, media: t.media, capacity: t.capacity, description: t.description, use: t.use, intent: t.intent, schema: t.schema, example: t.example, excludeFromMaster: t.excludeFromMaster, htmlLen: html.length });
}
let total = 0, missing = [];
for (const p of assets.keys()) { try { total += fs.statSync(ROOT + '/' + decodeURI(p)).size; } catch { missing.push(p); } }
fs.writeFileSync('inventory.json', JSON.stringify(out, null, 1));
fs.writeFileSync('assets.json', JSON.stringify([...assets.keys()], null, 1));
console.log('templates', out.length, 'errors', errs.length, errs.slice(0,5));
console.log('assets', assets.size, 'bytes', total, 'missing', missing.length, missing.slice(0,5));
const by = k => Object.entries(out.reduce((a, t) => (a[t[k]] = (a[t[k]] || 0) + 1, a), {})).sort((a,b)=>b[1]-a[1]);
console.log('family', JSON.stringify(by('family'))); console.log('role', JSON.stringify(by('role'))); console.log('theme', JSON.stringify(by('theme')));
console.log('excluded', out.filter(t=>t.excludeFromMaster).length);
