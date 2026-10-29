import { notFound } from 'next/navigation';
import { DocsLayout } from '@/components/DocsLayout';
import { Markdown } from '@/components/Markdown';
import { DocsNav } from '@/components/DocsNav';
import { Breadcrumb, Pager } from '@/components/SectionNav';
import Link from 'next/link';
import { listPatterns, listTemplates, readSpec, stripTitle } from '@/lib/ds-knowledge';

export const generateStaticParams = () => listPatterns().map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  return { title: listPatterns().find((p) => p.slug === slug)?.title };
}

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const patterns = listPatterns();
  const pattern = patterns.find((p) => p.slug === slug);
  if (!pattern) notFound();
  const spec = readSpec(pattern.spec);
  const template = listTemplates().find((t) => t.pattern === slug);
  // Sibling spec links (`[data-page.md](./data-page.md)`) → site routes; unknown patterns become plain text.
  const body = spec && stripTitle(spec).replace(/\[([^\]]+)\]\((?:\.\/)?([a-z0-9-]+)\.md\)/g, (_, text: string, ref: string) => {
    const target = patterns.find((p) => p.slug === ref);
    return target ? `[${text === `${ref}.md` ? target.title : text}](/patterns/${ref})` : text;
  });
  return (
    <DocsLayout nav={<DocsNav active={`patterns/${slug}`} />}>
      <Breadcrumb label="Patterns" base="/docs#patterns" current={pattern.title} />
      <h1>{pattern.title}</h1>
      <p className="lead">{pattern.usedFor}</p>
      <p className="chips">{pattern.assembly.map((a) => <code key={a}>{a}</code>)}</p>
      {template && (
        <div className="hero-actions">
          <Link className="link-button" href={`/templates/${template.slug}`}>View the {template.title.toLowerCase()} template</Link>
        </div>
      )}
      {body && <Markdown>{body}</Markdown>}
      <Pager base="/patterns" items={patterns} active={slug} />
    </DocsLayout>
  );
}
