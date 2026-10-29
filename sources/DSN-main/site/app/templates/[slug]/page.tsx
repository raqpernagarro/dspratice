import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/SectionNav';
import { TemplateViewer } from '@/components/templates/TemplateViewer';
import { listPatterns, listTemplates, readTemplate } from '@/lib/ds-knowledge';
import { compilePrototype } from '@/lib/prototype';

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => listTemplates().map((t) => ({ slug: t.slug }));

export async function generateMetadata({ params }: Props) {
  const slug = (await params).slug;
  return { title: listTemplates().find((t) => t.slug === slug)?.title ?? 'Template' };
}

export default async function TemplatePage({ params }: Props) {
  const { slug } = await params;
  const template = listTemplates().find((t) => t.slug === slug);
  const source = readTemplate(slug);
  if (!template || !source) notFound();

  const pattern = template.pattern ? listPatterns().find((p) => p.slug === template.pattern) : undefined;
  const issues = compilePrototype(source).issues.filter((i) => i.severity !== 'info');

  return (
    <main className="page page-wide">
      <Breadcrumb label="Templates" base="/templates" current={template.title} meta={<code>templates/{slug}.jsx</code>} />
      <p className="eyebrow">{template.category}</p>
      <h1>{template.title}</h1>
      <p className="lead">{template.description}</p>
      <div className="hero-actions">
        <Link className="link-button primary" href={`/prototype/playground?template=${slug}`}>Open in playground</Link>
        {pattern && <Link className="link-button" href={`/patterns/${pattern.slug}`}>{pattern.title} pattern</Link>}
        <span className="muted">{issues.length === 0 ? 'Passes all prototype checks' : `${issues.length} check issue${issues.length > 1 ? 's' : ''} — open in playground for details`}</span>
      </div>
      <TemplateViewer slug={slug} title={template.title} source={source} />
    </main>
  );
}
