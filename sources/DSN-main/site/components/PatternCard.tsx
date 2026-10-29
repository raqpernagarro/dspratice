import Link from 'next/link';
import { PatternPreview } from '@/components/PatternPreview';
import type { listPatterns } from '@/lib/ds-knowledge';

export function PatternCard({ pattern: p }: { pattern: ReturnType<typeof listPatterns>[number] }) {
  return (
    <div className="preview-card">
      <div className="preview-stage pattern-stage" aria-hidden>
        <PatternPreview slug={p.slug} />
      </div>
      <div className="guide-meta">
        <Link href={`/patterns/${p.slug}`} className="preview-name card-title">{p.title}</Link>
        <span className="muted">{p.usedFor}</span>
        <span className="chips">{p.assembly.map((a) => <code key={a}>{a}</code>)}</span>
      </div>
    </div>
  );
}
