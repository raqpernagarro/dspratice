import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/SectionNav';
import { ConnectPanel } from '@/components/prototype/ConnectPanel';
import { KitOverrideReset } from '@/components/prototype/KitOverrideReset';
import { KitRules } from '@/components/rules/KitRules';
import { canWriteRepo } from '@/lib/spec/server';
import { ScaleStrip } from '@/components/ScaleStrip';
import { getKitStore } from '@/lib/prototype';
import { overrideCss } from '@/lib/prototype/ir';
import { getComponent, getComponentNames, getCoreRules, getTokenNames, isPrimitiveToken, toSlug } from '@/lib/ds-knowledge';
import { describeTheme } from '@/lib/prototype/theme';
import { themeFor } from '@/lib/prototype/service';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  const kit = await getKitStore().get((await params).id);
  return { title: kit ? `${kit.name} · Team kit` : 'Team kit', robots: { index: false } };
}

/** A team kit: its theme, team rules, customized DS-Ngr components, own components and patterns, and how to connect an AI to it. */
export default async function KitPage({ params, searchParams }: Props) {
  const kit = await getKitStore().get((await params).id);
  if (!kit) notFound();
  const key = (await searchParams).key;
  const editKey = typeof key === 'string' && key ? key : undefined;
  const overrides = Object.entries(kit.overrides ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const theme = describeTheme(themeFor(null, null, kit));
  return (
    <main className="page">
      <Breadcrumb label="Prototype" base="/prototype" current={kit.name} />
      <p className="eyebrow">Team kit · v{kit.version}</p>
      <h1>{kit.name}</h1>
      <p className="lead kit-theme">
        <ScaleStrip scale={theme.accentScale} /> {theme.name} theme · {theme.font.label}
        {theme.brands && ` · ${theme.brands.length} brands`}
      </p>

      <h2>Connect</h2>
      <ConnectPanel kitId={kit.id} kitKey={typeof key === 'string' ? key : undefined} />

      <h2>Rules ({kit.rules?.length ?? 0})</h2>
      <KitRules
        kitId={kit.id}
        kitKey={editKey}
        rules={kit.rules ?? []}
        coreRules={getCoreRules()}
        components={[...getComponentNames()].sort()}
        tokens={[...getTokenNames()].filter((t) => !isPrimitiveToken(t))}
        canWriteRepo={canWriteRepo()}
      />

      <h2>Customized components ({overrides.length})</h2>
      {overrides.length === 0 && (
        <p className="muted">
          None yet. Open any component in the <a href="/components">gallery</a> and choose Customize to change its tokens or defaults for this kit.
        </p>
      )}
      {overrides.map(([name, o]) => (
        <section key={name} className="kit-item">
          <div className="kit-item-head">
            <h3><a href={`/components/${getComponent(toSlug(name))?.slug ?? toSlug(name)}`}>{name}</a></h3>
            {editKey && <KitOverrideReset kitId={kit.id} kitKey={editKey} component={name} />}
          </div>
          {o.note && <p className="muted">{o.note}</p>}
          <ul className="custom-changes">
            {Object.entries(o.tokens).map(([k, v]) => <li key={k}><code>{k}</code> → <code>{v}</code></li>)}
            {Object.entries(o.defaults).map(([k, v]) => <li key={k}><code>{k}</code> defaults to <code>{JSON.stringify(v)}</code></li>)}
          </ul>
        </section>
      ))}
      {overrides.length > 0 && (
        <details className="kit-export">
          <summary>Use these customizations in an app</summary>
          <p className="muted">Load this CSS after <code>ds-ngr</code>’s styles. Defaults are not applied outside DS-Ngr prototypes yet — pass them as props, or wrap the components.</p>
          <pre className="theme-code"><code>{overrideCss(Object.fromEntries(overrides))}</code></pre>
          <pre className="theme-code"><code>{JSON.stringify(Object.fromEntries(overrides.map(([n, o]) => [n, o.defaults]).filter(([, d]) => Object.keys(d as object).length)), null, 2)}</code></pre>
        </details>
      )}

      <h2>Components ({kit.components.length})</h2>
      {kit.components.length === 0 && <p className="muted">None yet. Connect with the edit link and ask your AI to save one.</p>}
      {kit.components.map((c) => (
        <section key={c.name} className="kit-item">
          <h3>{c.name}</h3>
          <p className="muted">{c.description}</p>
          <p className="muted">Props: {c.params.length ? c.params.map((p) => <code key={p}>{p}</code>).reduce((a, b) => <>{a}, {b}</>) : 'none'}</p>
          <pre className="theme-code"><code>{c.source}</code></pre>
        </section>
      ))}

      <h2>Patterns ({kit.patterns.length})</h2>
      {kit.patterns.length === 0 && <p className="muted">None yet.</p>}
      {kit.patterns.map((p) => (
        <section key={p.name} className="kit-item">
          <h3>{p.name}</h3>
          <p className="muted">{p.description}</p>
          <div className="pg-preview kit-preview">
            <iframe src={`/p/kit/${kit.id}/${encodeURIComponent(p.name)}`} title={`${p.name} example`} loading="lazy" />
          </div>
        </section>
      ))}
    </main>
  );
}
