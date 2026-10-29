import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocsLayout } from '@/components/DocsLayout';
import { GuideBody } from '@/components/GuideVisuals';
import { DocsNav } from '@/components/DocsNav';
import { Breadcrumb, Pager } from '@/components/SectionNav';
import { GUIDES, getGuide } from '@/lib/ds-knowledge';

/** Guides with an editor at /guides/<slug>/edit. */
const EDITABLE = new Set(['ai-rules']);

export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  return { title: GUIDES.find((g) => g.slug === slug)?.title };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  return (
    <DocsLayout nav={<DocsNav active={`guides/${guide.slug}`} />}>
      <Breadcrumb
        label="Guides"
        base="/docs#guides"
        current={guide.title}
        meta={
          <>
            {EDITABLE.has(guide.slug) && <Link className="link-button" href={`/guides/${guide.slug}/edit`}>Edit rules</Link>}
            <code>{guide.source}</code>
          </>
        }
      />
      <h1>{guide.title}</h1>
      <p className="lead">{guide.description}</p>
      <GuideBody slug={guide.slug} body={guide.body} />
      <Pager base="/guides" items={GUIDES} active={guide.slug} />
    </DocsLayout>
  );
}
