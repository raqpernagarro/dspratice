import { notFound } from 'next/navigation';
import { SkillActions } from '@/components/skills/SkillActions';
import { Markdown } from '@/components/Markdown';
import { Breadcrumb, Pager } from '@/components/SectionNav';
import { getSkill, listSkills } from '@/lib/ds-knowledge';

export const generateStaticParams = () => listSkills().map((s) => ({ slug: s.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: `/${(await params).slug}` };
}

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const skill = getSkill((await params).slug);
  if (!skill) notFound();
  const skills = listSkills();
  return (
    <main className="page narrow">
      <Breadcrumb label="Skills" base="/skills" current={`/${skill.slug}`} meta={<code>{skill.source}</code>} />
      <h1>/{skill.slug}</h1>
      <p className="lead">{skill.description}</p>
      <div className="skill-actions">
        <SkillActions slug={skill.slug} primary />
      </div>
      <Markdown>{skill.body}</Markdown>
      <Pager base="/skills" items={skills.map((s) => ({ slug: s.slug, title: `/${s.slug}` }))} active={skill.slug} />
    </main>
  );
}
