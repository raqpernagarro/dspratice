import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/SectionNav';
import { SpecEditor } from '@/components/spec/SpecEditor';
import { getComponent, getComponentNames, getCoreRules, type ComponentEntry } from '@/lib/ds-knowledge';
import { ruleComponents } from '@/lib/rules/lint';
import { parseSpec } from '@/lib/spec/markdown';
import { canWriteRepo, specTarget } from '@/lib/spec/server';
import { emptySpec, type ComponentSpec } from '@/lib/spec/types';

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  const c = getComponent((await params).slug);
  return { title: c ? `${c.label} spec` : 'Component spec', robots: { index: false } };
}

/** A new spec, prefilled with what the index already knows: tier, path, and one table per variant/size union. */
function startingSpec(c: ComponentEntry, target: string): ComponentSpec {
  const spec = emptySpec(c.name, c.tier, target);
  const unions = [['variant', c.variants], ['size', c.sizes]] as const;
  spec.sections = spec.sections.map((s) =>
    s.kind === 'variants'
      ? { ...s, tables: unions.filter(([, v]) => v.length).map(([prop, values]) => ({ heading: `\`${prop}\` prop`, rows: [['Value', 'Use when'], ...values.map((v) => [`\`"${v}"\``, ''])] })) }
      : s,
  );
  return spec;
}

/** The spec template as a form: write a new spec for a component, or edit its co-located one. */
export default async function SpecPage({ params }: Props) {
  const c = getComponent((await params).slug);
  if (!c) notFound();
  const { target, existing, shared } = specTarget(c);
  const components = [...getComponentNames()].sort();
  const names = new Set(components);
  const related = getCoreRules().filter((r) => ruleComponents(r, names).includes(c.name));
  return (
    <main className="page page-wide">
      <Breadcrumb label={c.label} base={`/components/${c.slug}`} current={existing ? 'Edit spec' : 'Write spec'} />
      <h1>{existing ? `Edit the ${c.label} spec` : `Write the ${c.label} spec`}</h1>
      <p className="lead">
        Specs tell agents when to pick {c.label}, when not to, and how it behaves in a layout. Fill in each section; the preview is the file agents read.
      </p>
      {shared && (
        <p className="muted">
          {c.label} is documented in the shared spec <code>{shared}</code>. This starts its own spec next to the component; move anything specific to {c.label} across, then trim the shared one.
        </p>
      )}
      <SpecEditor
        initial={existing ? parseSpec(existing) : startingSpec(c, target)}
        slug={c.slug}
        target={target}
        exists={!!existing}
        components={components}
        props={Object.fromEntries(Object.entries(c.props).map(([k, p]) => [k, p.type]))}
        related={related}
        canWriteRepo={canWriteRepo()}
      />
    </main>
  );
}
