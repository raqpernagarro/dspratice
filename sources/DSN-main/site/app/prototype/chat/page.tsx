import { Suspense } from 'react';
import { Chat, type ChatSource } from '@/components/prototype/Chat';
import { listTemplates } from '@/lib/ds-knowledge';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const toSource = (v: string | undefined): ChatSource => (v === 'openrouter' || v === 'demo' ? v : 'key');

const COPY: Record<ChatSource, { title: string; lead: string; steps: string[] }> = {
  key: {
    title: 'Chat with your own key',
    lead: 'Use your own Anthropic, OpenAI or Gemini API key. The AI reads DS-Ngr’s components and rules and draws your screen on a live canvas you can share.',
    steps: [
      'Pick a provider and paste an API key. It is kept in this browser’s storage.',
      'Describe a screen. Each message goes to this site with your key in a request header; the site forwards it to the provider and keeps nothing.',
      'The AI looks up real props, writes the screen, and fixes every rule issue it gets back. The canvas updates as it works.',
      'Use Open to share the prototype link. Forget key removes the key from this browser.',
    ],
  },
  openrouter: {
    title: 'Sign in with OpenRouter',
    lead: 'One sign-in, any model OpenRouter offers — Claude, GPT, Gemini and more — billed to your OpenRouter account.',
    steps: [
      'Sign in with OpenRouter. It creates a key for this site that you control (and can revoke) in your OpenRouter settings.',
      'The key is kept in this browser and sent only with your chat requests, never saved on the server.',
      'Pick a model in the composer, describe a screen, and watch it build on the canvas. Models marked “free” need no credit on your OpenRouter account.',
      'Sign out removes the key from this browser; revoke it in OpenRouter to disable it everywhere.',
    ],
  },
  demo: {
    title: 'Try the demo',
    lead: 'No key, no AI: a scripted stand-in replays DS-Ngr page templates through the same tools and live canvas the real chat uses.',
    steps: [
      'Pick a suggestion or ask for a kind of page — dashboard, data page, settings, form, kanban board or sign in.',
      'The demo reads the design context, looks up a component and creates the prototype, step by step, like a model would.',
      'The canvas shows the real page, rendered with the real library and checked against the rules.',
      'It can’t follow edit requests. For that, chat with a key — Gemini and OpenRouter both have free options.',
    ],
  },
};

export async function generateMetadata({ searchParams }: Props) {
  const source = toSource(one((await searchParams).source));
  return { title: COPY[source].title };
}

export default async function ChatPage({ searchParams }: Props) {
  const sp = await searchParams;
  const source = toSource(one(sp.source));
  const { title, lead, steps } = COPY[source];
  return (
    <main className="ws-page">
      <Suspense>
        <Chat
          source={source}
          kitId={one(sp.kit)}
          kitKey={one(sp.key)}
          title={title}
          back={{ href: '/prototype', label: 'Prototype' }}
          templates={listTemplates()}
          help={
            <details className="ws-help">
              <summary>How it works</summary>
              <p className="muted">{lead}</p>
              <ol className="steps">
                {steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </details>
          }
        />
      </Suspense>
    </main>
  );
}
