import { notFound } from 'next/navigation';
import { listTemplates, readTemplate } from '@/lib/ds-knowledge';
import { compilePrototype } from '@/lib/prototype';
import { PrototypeRenderer } from '@/components/prototype/PrototypeRenderer';

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => listTemplates().map((t) => ({ slug: t.slug }));

export async function generateMetadata({ params }: Props) {
  const slug = (await params).slug;
  return { title: listTemplates().find((t) => t.slug === slug)?.title ?? 'Template', robots: { index: false } };
}

/** Full-screen template, framed by the gallery and the template page so 100vh means the frame. */
export default async function TemplateFramePage({ params }: Props) {
  const source = readTemplate((await params).slug);
  if (!source) notFound();
  const { root } = compilePrototype(source);
  if (!root) notFound();
  return <PrototypeRenderer root={root} />;
}
