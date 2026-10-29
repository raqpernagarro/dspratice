import { notFound } from 'next/navigation';
import { DocsLayout } from '@/components/DocsLayout';
import { DocsNav } from '@/components/DocsNav';
import { AiMdEditor } from '@/components/rules/AiMdEditor';
import { Breadcrumb } from '@/components/SectionNav';
import { getComponentNames, getGuide, getTokenNames, isPrimitiveToken, REPO_ROOT } from '@/lib/ds-knowledge';
import { outline } from '@/lib/rules/document';
import { canWriteRepo } from '@/lib/spec/server';
import fs from 'node:fs';
import path from 'node:path';

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit AI usage rules', robots: { index: false } };

/** Only AI.md is editable for now — it is the file with a rule structure. */
const EDITABLE = new Set(['ai-rules']);

export default async function EditGuidePage({ params }: Props) {
  const slug = (await params).slug;
  const guide = getGuide(slug);
  if (!guide || !EDITABLE.has(slug)) notFound();
  // Read fresh on every request so each edit starts from the file as it is now.
  const md = fs.readFileSync(path.join(REPO_ROOT, guide.source), 'utf8');
  return (
    <DocsLayout nav={<DocsNav active={`guides/${guide.slug}`} />}>
      <Breadcrumb label={guide.title} base={`/guides/${guide.slug}`} current="Edit" meta={<code>{guide.source}</code>} />
      <h1>Edit {guide.title}</h1>
      <p className="lead">Add a rule with the form, edit numbered rules field by field, or change any other section as markdown.</p>
      <AiMdEditor
        blocks={outline(md)}
        components={[...getComponentNames()].sort()}
        tokens={[...getTokenNames()].filter((t) => !isPrimitiveToken(t))}
        canWriteRepo={canWriteRepo()}
      />
    </DocsLayout>
  );
}
