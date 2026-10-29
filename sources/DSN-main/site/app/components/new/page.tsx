import { Suspense } from 'react';
import type { ChatSource } from '@/components/prototype/Chat';
import { ComponentDraftChat } from '@/components/prototype/DraftCanvas';

export const metadata = { title: 'Create component' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const toSource = (v: string | undefined): ChatSource => (v === 'openrouter' || v === 'demo' ? v : 'key');

const STEPS = [
  'Describe the component, or paste the text of a Jira or Notion ticket.',
  'The AI checks whether DS-Ngr already covers it. If it does, it tells you which component to use instead.',
  'Otherwise it drafts two or three options built only from DS-Ngr parts and tokens, each shown in its key states and checked against the rules.',
  'Compare them in light and dark, on desktop and mobile. Ask for changes in the chat.',
  'Choose one and add it to your team kit. It is then usable in prototypes and over MCP; promotion into DS-Ngr itself goes through review.',
];

const DEMO_NOTE = 'Demo mode needs no key: the check against DS-Ngr is real for any request, and it drafts scripted options for the three suggested examples.';

/** Full-screen workspace: chat beside the drafted options. `?source=demo` runs without a key. */
export default async function NewComponentPage({ searchParams }: Props) {
  const sp = await searchParams;
  const source = toSource(one(sp.source));
  return (
    <main className="ws-page">
      <Suspense>
        <ComponentDraftChat
          source={source}
          kitId={one(sp.kit)}
          kitKey={one(sp.key)}
          help={
            <details className="ws-help">
              <summary>How it works</summary>
              <p className="muted">Describe what you need. The AI checks what already exists, then drafts options with DS-Ngr’s components, tokens and rules for you to pick from.</p>
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
