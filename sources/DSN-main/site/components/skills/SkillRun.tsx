'use client';

import dynamic from 'next/dynamic';
import { Chat, latestPrototype, type ChatSource } from '@/components/prototype/Chat';

// react-markdown doesn't server-render from a client component here.
const Markdown = dynamic(() => import('@/components/Markdown').then((m) => m.Markdown), { ssr: false });

/** A repo skill run in the site chat: the skill's instructions on the canvas until it draws a prototype. */
export function SkillRun({ source, slug, body, help }: { source: ChatSource; slug: string; body: string; help?: React.ReactNode }) {
  return (
    <Chat
      source={source}
      skill={slug}
      title={`Run /${slug}`}
      back={{ href: `/skills/${slug}`, label: `/${slug}` }}
      help={help}
      copy={{
        intro: `Runs /${slug} with DS-Ngr’s component, token and rule lookups. It can’t read or change repo files, so steps that need them come back as instructions for you.`,
        placeholder: 'Add details, or ask a follow-up…',
        suggestions: [{ label: `Run /${slug}`, prompt: `Run /${slug}.` }],
      }}
      canvas={({ messages }) => {
        const prototype = latestPrototype(messages);
        return prototype ? (
          <div className="ws-stage">
            <div className="ws-frame">
              <iframe key={prototype.id} src={`/p/${prototype.id}?live`} title="Prototype canvas" />
            </div>
          </div>
        ) : (
          <div className="skill-run-doc">
            <p className="eyebrow">Skill instructions · skills/{slug}/SKILL.md</p>
            <Markdown>{body}</Markdown>
          </div>
        );
      }}
    />
  );
}
