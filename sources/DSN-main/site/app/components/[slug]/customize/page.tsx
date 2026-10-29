import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { ChatSource } from '@/components/prototype/Chat';
import { CustomizeChat } from '@/components/prototype/CustomizeCanvas';
import { demoChildren, demoProps } from '@/lib/chat/demo-customize';
import { getComponent } from '@/lib/ds-knowledge';
import { playgroundFor } from '@/lib/prototype/customize';
import { canWriteRepo } from '@/lib/spec/server';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const toSource = (v: string | undefined): ChatSource => (v === 'openrouter' || v === 'demo' ? v : 'key');

export async function generateMetadata({ params }: Props) {
  const c = getComponent((await params).slug);
  return { title: c ? `Customize ${c.label}` : 'Customize component' };
}

const STEPS = [
  'Say how this component should differ for you or your team — rounder, more compact, more on-brand.',
  'The AI can change only the component’s own tokens (pointing them at other DS-Ngr tokens) and its default props. No code is copied, so DS-Ngr fixes and updates keep reaching your version.',
  'Each option is shown next to the original, in light and dark, with the exact list of changes and any other components that share a changed token.',
  'Choose one and add it to a kit. A kit only you hold the link to is personal; share the link and it’s your team’s. Remove it from the kit at any time to go back to DS-Ngr.',
];

const DEMO_NOTE = 'Demo mode needs no key: it drafts scripted options from the component’s own corner radius, size, variant and on/off defaults, checked by the same rules.';

/** Full-screen workspace: chat beside before/after options. `?source=demo` runs without a key. */
export default async function CustomizeComponentPage({ params, searchParams }: Props) {
  const component = getComponent((await params).slug);
  if (!component) notFound();
  const sp = await searchParams;
  const source = toSource(one(sp.source));
  // One live instance on the canvas, driven by the props panel; starts from the demo's sample props.
  const playground = playgroundFor(component.name, demoProps(component.name), demoChildren(component.name));
  return (
    <main className="ws-page">
      <Suspense>
        <CustomizeChat
          source={source}
          component={component.name}
          label={component.label}
          slug={component.slug}
          kitId={one(sp.kit)}
          kitKey={one(sp.key)}
          playground={playground}
          canCreatePr={canWriteRepo()}
          help={
            <details className="ws-help">
              <summary>How it works</summary>
              <p className="muted">Make {component.label} yours or your team’s — as a layer on top of DS-Ngr, not a copy of it.</p>
              <ol className="steps">
                {STEPS.map((s) => <li key={s}>{s}</li>)}
              </ol>
              {source === 'demo' && <p className="muted">{DEMO_NOTE}</p>}
            </details>
          }
        />
      </Suspense>
    </main>
  );
}
