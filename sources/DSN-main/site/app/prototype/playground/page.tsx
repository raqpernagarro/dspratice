import { Breadcrumb } from '@/components/SectionNav';
import { Playground } from '@/components/prototype/Playground';
import { readTemplate } from '@/lib/ds-knowledge';

export const metadata = { title: 'Prototype playground' };

/** `?template=<slug>` starts from a page template instead of the default example. */
export default async function PlaygroundPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const { template } = await searchParams;
  const initialSource = (template && readTemplate(template)) || undefined;
  return (
    <main className="page page-wide">
      <Breadcrumb label="Prototype" base="/prototype" current="Playground" />
      <h1>Playground</h1>
      <p className="lead">
        Paste JSX built from DS-Ngr components. It renders with the real library, is checked against the same rules AI
        agents follow, and saves as a shareable link.
      </p>
      <Playground initialSource={initialSource} />
    </main>
  );
}
