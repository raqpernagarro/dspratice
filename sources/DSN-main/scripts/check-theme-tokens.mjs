/**
 * Guard for the starter pack: every custom property a generated theme sets or
 * reads must be declared in the tokens.css it ships with. A theme that re-values
 * a name tokens.css doesn't declare is silently ignored by the browser — which is
 * how a stale tarball once shipped amber themes with Nagarro-teal menus.
 *
 * Generates CSS for every preset and every option value (single- and multi-brand)
 * with the real configurator engine (site/lib/theme/theme.ts, bundled in memory
 * by esbuild), then diffs the names against tokens.css.
 *
 *   import { missingThemeTokens } from './check-theme-tokens.mjs';
 *   const missing = await missingThemeTokens(tokensCssText); // [] when clean
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const themeDir = path.join(root, 'site', 'lib', 'theme');

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const declared = (css) => new Set([...stripComments(css).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const referenced = (css) => new Set([...stripComments(css).matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));

async function loadEngine() {
  const { outputFiles } = await build({
    stdin: {
      contents: `export * from './theme'; export { SURFACE_STYLES } from './styles'; export { SHAPES, DENSITIES } from './shape-density';`,
      resolveDir: themeDir,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    write: false,
    logLevel: 'silent',
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
}

/** Every theme the configurator can produce, one option changed at a time. */
function settingsMatrix(e) {
  const base = e.PRESETS.find((p) => p.label !== 'Nagarro')?.settings ?? e.DEFAULT_SETTINGS;
  const axes = {
    neutral: ['default', 'gray', 'match'],
    feedback: e.FEEDBACK_MODES.map((m) => m.value),
    dataviz: e.DATAVIZ_MODES.map((m) => m.value),
    cta: e.CTA_MODES.map((m) => m.value),
    font: e.FONTS.map((f) => f.id),
    style: e.SURFACE_STYLES.map((s) => s.value),
    shape: e.SHAPES.map((s) => s.value),
    density: e.DENSITIES.map((d) => d.value),
  };
  const variants = Object.entries(axes).flatMap(([key, values]) => values.map((v) => ({ ...base, [key]: v })));
  return [...e.PRESETS.map((p) => p.settings), ...variants];
}

export async function missingThemeTokens(tokensCss) {
  const e = await loadEngine();
  const all = settingsMatrix(e);
  const css = [
    ...all.map((s) => e.toCss(e.buildTheme(s), 'x')),
    e.toMultiCss(
      e.PRESETS.map((p) => ({ slug: e.slugify(p.label), name: p.label, settings: p.settings })),
      e.slugify(e.PRESETS[0].label),
      'x',
    ),
  ].join('\n');

  const known = declared(tokensCss);
  const sets = declared(css);
  const uses = [...referenced(css)].filter((n) => !sets.has(n));
  return [...new Set([...sets, ...uses])].filter((n) => !known.has(n)).sort();
}
