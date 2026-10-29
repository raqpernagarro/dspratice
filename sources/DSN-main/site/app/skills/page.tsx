import { SkillCard } from '@/components/skills/SkillActions';
import { listSkills } from '@/lib/ds-knowledge';

export const metadata = { title: 'Skills' };

export default function SkillsPage() {
  const skills = listSkills();
  return (
    <main className="page">
      <h1>Skills</h1>
      <p className="lead">
        Agent skills that ship with DS-Ngr. Each one is a slash command for Claude Code or Cursor that audits, documents or
        syncs the design system. Run <code>npm run sync:skills</code> to install them locally.
      </p>
      <div className="skill-grid">
        {skills.map((s) => (
          <SkillCard key={s.slug} skill={s} />
        ))}
      </div>
    </main>
  );
}
