import Link from 'next/link';
import { GuideCard } from '@/components/GuideCard';
import { HomeShowcase } from '@/components/HomeShowcase';
import { PatternCard } from '@/components/PatternCard';
import { GUIDES, getIndex, getLibraryVersion, listComponents, listPatterns, getStorybookUrl } from '@/lib/ds-knowledge';

export default function Home() {
  const { meta } = getIndex();
  const components = listComponents();
  const patterns = listPatterns();

  return (
    <main className="page home">
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <Link href="/guides/ai-short" className="hero-pill">
          <span className="hero-pill-dot" aria-hidden="true" />
          DS-Ngr v{getLibraryVersion()} · {components.length} components · agent ready
        </Link>
        <h1 className="hero-title">
          Built for Nagarro.
          <span>Ready for any AI.</span>
        </h1>
        <p className="hero-lead">
          The Nagarro design system for web: accessible components, a three-layer token system and page
          patterns, documented from source and ready to prototype with the AI you already use.
        </p>
        <div className="hero-actions">
          <Link className="link-button primary lg" href="/components">Browse components</Link>
          <Link className="link-button lg" href="/prototype">Start prototyping</Link>
        </div>
        <p className="hero-meta">
          Synced with <a href={`${getStorybookUrl()}/index.html`} target="_blank" rel="noreferrer">Storybook</a> and{' '}
          <a href={meta.figma} target="_blank" rel="noreferrer">Figma</a> · commit {meta.gitCommit}
        </p>
      </section>

      <HomeShowcase />

      <section>
        <div className="section-head">
          <h2>Patterns</h2>
          <Link href="/docs#patterns">View all</Link>
        </div>
        <div className="preview-grid guide-grid">
          {patterns.map((p) => <PatternCard key={p.slug} pattern={p} />)}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Guides</h2>
          <Link href="/docs#guides">View all</Link>
        </div>
        <div className="preview-grid guide-grid">
          {GUIDES.map((g) => <GuideCard key={g.slug} guide={g} />)}
        </div>
      </section>
    </main>
  );
}
