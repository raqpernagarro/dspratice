import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { DocsLayout } from '@/components/DocsLayout';
import { ComponentPreview } from '@/components/ComponentPreview';
import { groupAnchor, listComponentGroups } from '@/lib/ds-knowledge';

export const metadata = { title: 'Components' };

export default function ComponentsPage() {
  return (
    <DocsLayout active="overview">
      <div className="page-title-row">
        <h1>All components</h1>
        <div className="page-title-actions">
          <Link href="/components/new?source=demo" className="link-button">
            Try without a key
          </Link>
          <Link href="/components/new" className="link-button primary">
            <Sparkles size={16} aria-hidden="true" /> Create component
          </Link>
        </div>
      </div>
      <p className="lead">Every tile is the live component from <code>ds-ngr</code> — not a screenshot — so the gallery always matches the library.</p>
      {listComponentGroups().map(({ group, items }) => (
        <section key={group}>
          <h2 id={groupAnchor(group)}>{group}</h2>
          <div className="preview-grid">
            {items.map((c) => (
              <div key={c.slug} className="preview-card">
                <div className="preview-stage" inert aria-hidden>
                  <ComponentPreview name={c.name} />
                </div>
                <Link href={`/components/${c.slug}`} className="preview-name">{c.label}</Link>
              </div>
            ))}
          </div>
        </section>
      ))}
    </DocsLayout>
  );
}
