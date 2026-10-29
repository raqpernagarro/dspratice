import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { SkillRun } from '@/components/skills/SkillRun';
import { getSkill } from '@/lib/ds-knowledge';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  return { title: `Run /${(await params).slug}`, robots: { index: false } };
}

export default async function RunSkillPage({ params, searchParams }: Props) {
  const skill = getSkill((await params).slug);
  if (!skill) notFound();
  const src = (await searchParams).source;
  const source = (Array.isArray(src) ? src[0] : src) === 'openrouter' ? 'openrouter' : 'key';
  return (
    <main className="ws-page">
      <Suspense>
        <SkillRun
          source={source}
          slug={skill.slug}
          body={skill.body}
          help={
            <p className="muted">
              {source === 'key' ? (
                <>No key? <a href={`/skills/${skill.slug}/run?source=openrouter`}>Sign in with OpenRouter</a> instead.</>
              ) : (
                <>Have an API key? <a href={`/skills/${skill.slug}/run`}>Use your own key</a> instead.</>
              )}
            </p>
          }
        />
      </Suspense>
    </main>
  );
}
