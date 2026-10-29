import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { readIndex, requirePackage } from './pkg.mjs';
import { UsageError } from './site.mjs';

const pascal = (slug) => slug.split(/[^a-zA-Z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

/** `ds-ngr add [template]` — copies a page template from the installed package. */
export function add(positionals, flags) {
  const pkg = requirePackage();
  const templates = readIndex(pkg).templates ?? {};
  const slug = positionals[0];

  if (!slug) {
    console.log('Page templates (ds-ngr add <slug>):\n');
    const width = Math.max(...Object.keys(templates).map((s) => s.length));
    for (const [s, t] of Object.entries(templates)) console.log(`  ${s.padEnd(width)}  ${t.description}`);
    return;
  }

  const template = templates[slug];
  if (!template) throw new UsageError(`No template "${slug}". Run \`ds-ngr add\` to list them.`);

  const component = flags.name ?? pascal(slug);
  const outDir = path.resolve(flags.out ?? 'src/pages');
  const out = path.join(outDir, `${component}.tsx`);
  if (existsSync(out) && !flags.force) throw new UsageError(`${path.relative(process.cwd(), out)} already exists. Pass --force to overwrite.`);

  const body = readFileSync(path.join(pkg, template.path), 'utf8')
    // Name the page component after the file.
    .replace(/export default function \w*\s*\(/, `export default function ${component}(`);
  // Templates are untyped JSX (their sample data infers loose types), so the
  // copy opts out of type checking until the sample data is replaced.
  const source = `// @ts-nocheck — from the ds-ngr "${slug}" template. Replace the sample data with typed data, then delete this line.\n${body}`;
  mkdirSync(outDir, { recursive: true });
  writeFileSync(out, source);

  const rel = path.relative(process.cwd(), out);
  console.log(`Added ${rel} — ${template.title}.`);
  console.log(`It is a full page with its own AppShell. Render it in place of <Home /> in src/App.tsx:`);
  const importPath = path.relative(path.resolve('src'), out).replace(/\.tsx$/, '').split(path.sep).join('/');
  console.log(`\n  import ${component} from './${importPath}';\n`);
  if (template.pattern) console.log(`Pattern rules: node_modules/ds-ngr/specs/patterns/${template.pattern}.md`);
}
