import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DocsLayout } from '@/components/DocsLayout';
import { Markdown } from '@/components/Markdown';
import { StoryPlayground } from '@/components/StoryPlayground';
import { demoOptions } from '@/lib/chat/demo-customize';
import {
  getComponent,
  getComponentGroup,
  getIndex,
  getStorybookUrl,
  resolveStorybookPreview,
  listComponents,
  orderStoriesForPlayground,
  readSpec,
  stripTitle,
} from '@/lib/ds-knowledge';

export const generateStaticParams = () => listComponents().map((c) => ({ slug: c.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = getComponent((await params).slug);
  return { title: c?.label ?? 'Component' };
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const component = getComponent((await params).slug);
  if (!component) notFound();

  const spec = readSpec(component.spec);
  // `Playground` is the args-driven hero (AGENTS.md Rule 7); the rest follow in file order.
  const { storybookUrl: embedStorybook, stories: liveStories } = await resolveStorybookPreview(
    component.path,
    component.name,
  );
  const stories = orderStoriesForPlayground(liveStories);
  const storybook = getStorybookUrl();
  const primaryStory = stories[0];
  // Only list what the component actually has — an empty row is noise, not information.
  const unique = (values: string[]) => [...new Set(values)];
  const facts = ([
    ['Parts', component.parts],
    ['Variants', component.variants],
    ['Sizes', component.sizes],
    ['Boolean props', component.booleanProps],
    ['Tokens used', component.tokens],
  ] as [string, string[]][])
    .map(([label, values]) => [label, unique(values)] as [string, string[]])
    .filter(([, values]) => values.length);

  return (
    <DocsLayout active={component.slug}>
        <p className="eyebrow">{getComponentGroup(component.slug)}</p>
        <h1>{component.label}</h1>
        <div className="hero-actions">
          {primaryStory && (
            <a className="link-button" href={`${storybook}/index.html?path=/docs/${primaryStory.id.split('--')[0]}--docs`} target="_blank" rel="noreferrer">
              Open in Storybook ↗
            </a>
          )}
          <a className="link-button" href={getIndex().meta.figma} target="_blank" rel="noreferrer">Figma ↗</a>
          <Link className="link-button" href={`/components/${component.slug}/customize`}>Customize {component.label}</Link>
          <Link className="link-button" href={`/components/${component.slug}/spec`}>{spec ? 'Edit spec' : 'Write spec'}</Link>
          {demoOptions(component.name, '').length > 0 && (
            <Link className="link-button" href={`/components/${component.slug}/customize?source=demo`}>Try customizing (no key)</Link>
          )}
          <code className="source-path">{component.path}</code>
        </div>

        {primaryStory && (
          <section>
            <StoryPlayground storybookUrl={embedStorybook} stories={stories} title={component.label} />
          </section>
        )}

        {facts.length > 0 && (
          <section>
            <h2>API at a glance</h2>
            <dl className="facts">
              {facts.map(([label, values]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{values.map((v, i) => <code key={`${label}-${i}`}>{v}</code>)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section>
          {spec ? <Markdown>{stripTitle(spec)}</Markdown> : (
            <p className="muted">
              No spec yet. <Link href={`/components/${component.slug}/spec`}>Write one from the template</Link>, or generate it with the <code>ds-component-doc</code> skill.
            </p>
          )}
        </section>
    </DocsLayout>
  );
}
