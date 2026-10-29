'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Play } from 'lucide-react';
import { Button, Card } from 'ds-ngr';
import type { Skill } from '@/lib/ds-knowledge';

/** Run and Edit for one skill. DS-Ngr Button has no link mode, so these navigate on click. */
export function SkillActions({ slug, primary = false }: { slug: string; primary?: boolean }) {
  return (
    <>
      <RunButton slug={slug} primary={primary} />
      <EditButton slug={slug} />
    </>
  );
}

/** `primary` on a skill's own page, where Run is the main action; cards keep it secondary (no primary CTA inside a Card). */
function RunButton({ slug, primary = false }: { slug: string; primary?: boolean }) {
  const router = useRouter();
  return (
    <Button variant={primary ? 'primary' : 'secondary'} size="md" showLeadingIcon leadingIcon={<Play size={16} aria-hidden />} onClick={() => router.push(`/skills/${slug}/run`)}>
      Run
    </Button>
  );
}

function EditButton({ slug, iconOnly = false }: { slug: string; iconOnly?: boolean }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="md"
      showLabel={!iconOnly}
      showLeadingIcon
      leadingIcon={<Pencil size={16} aria-hidden />}
      aria-label={iconOnly ? `Edit /${slug}` : undefined}
      onClick={() => router.push(`/skills/${slug}/edit`)}
    >
      Edit
    </Button>
  );
}

/** One skill in the /skills grid. The whole card opens the skill; Run and an icon-only Edit (shown on hover or focus) sit above that link in the bottom bar. */
export function SkillCard({ skill }: { skill: Pick<Skill, 'slug' | 'about'> }) {
  return (
    <Card
      className="skill-card"
      title={`/${skill.slug}`}
      headerSize="large"
      aria-label={`/${skill.slug}`}
      bottomBarLeftActions={<RunButton slug={skill.slug} />}
      bottomBarRightActions={<span className="skill-card-edit"><EditButton slug={skill.slug} iconOnly /></span>}
    >
      <Link href={`/skills/${skill.slug}`} className="skill-card-link" aria-label={`Open /${skill.slug}`}>
        <p className="skill-card-summary">{skill.about}</p>
      </Link>
    </Card>
  );
}
