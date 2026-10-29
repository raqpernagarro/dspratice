import Link from 'next/link';
import { GuidePreview } from '@/components/GuidePreview';
import type { GUIDES } from '@/lib/ds-knowledge';

export function GuideCard({ guide: g }: { guide: (typeof GUIDES)[number] }) {
  return (
    <div className="preview-card">
      <div className="preview-stage" aria-hidden>
        <GuidePreview slug={g.slug} title={g.title} />
      </div>
      <div className="guide-meta">
        <Link href={`/guides/${g.slug}`} className="preview-name">{g.title}</Link>
        <span className="muted">{g.description}</span>
        <code className="source-path">{g.source}</code>
      </div>
    </div>
  );
}
