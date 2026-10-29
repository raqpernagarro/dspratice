import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/SectionNav';
import { SkillEditor } from '@/components/skills/SkillEditor';
import { getSkill, REPO_ROOT } from '@/lib/ds-knowledge';
import { canWriteRepo } from '@/lib/spec/server';

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props) {
  return { title: `Edit /${(await params).slug}`, robots: { index: false } };
}

export default async function EditSkillPage({ params }: Props) {
  const skill = getSkill((await params).slug);
  if (!skill) notFound();
  // Read fresh on every request so each edit starts from the file as it is now.
  const md = fs.readFileSync(path.join(REPO_ROOT, skill.source), 'utf8');
  return (
    <main className="page page-wide">
      <Breadcrumb label={`/${skill.slug}`} base={`/skills/${skill.slug}`} current="Edit" meta={<code>{skill.source}</code>} />
      <h1>Edit /{skill.slug}</h1>
      <p className="lead">
        Edit the skill as markdown. Keep the frontmatter: <code>name</code> is the skill id and <code>description</code> tells agents when
        to use it.
      </p>
      <SkillEditor slug={skill.slug} source={skill.source} initial={md} canWriteRepo={canWriteRepo()} />
    </main>
  );
}
