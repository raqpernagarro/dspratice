import { DocsLayout } from '@/components/DocsLayout';
import { DocsNav } from '@/components/DocsNav';
import { GuideCard } from '@/components/GuideCard';
import { PatternCard } from '@/components/PatternCard';
import { GUIDES, listPatterns } from '@/lib/ds-knowledge';

export const metadata = { title: 'Docs' };

export default function DocsPage() {
  return (
    <DocsLayout nav={<DocsNav active="overview" />}>
      <h1>All docs</h1>
      <p className="lead">Guides and page patterns for building with DS-Ngr.</p>
      <section>
        <h2 id="guides">Guides</h2>
        <div className="preview-grid guide-grid">
          {GUIDES.map((g) => <GuideCard key={g.slug} guide={g} />)}
        </div>
      </section>
      <section>
        <h2 id="patterns">Patterns</h2>
        <div className="preview-grid guide-grid">
          {listPatterns().map((p) => <PatternCard key={p.slug} pattern={p} />)}
        </div>
      </section>
    </DocsLayout>
  );
}
