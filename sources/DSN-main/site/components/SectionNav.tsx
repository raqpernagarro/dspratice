import Link from 'next/link';

const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={dir === 'left' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5'} />
  </svg>
);

export interface SectionNavItem { slug: string; title: string }

/** "← Guides / Typography" — the way back, visible at every width (the side menu hides on mobile). */
export function Breadcrumb({ label, base, current, meta }: {
  label: string;
  base: string;
  current: string;
  meta?: React.ReactNode;
}) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <Link href={base} className="breadcrumb-back">
        <Chevron dir="left" />
        {label}
      </Link>
      <span className="breadcrumb-sep" aria-hidden>/</span>
      <span aria-current="page">{current}</span>
      {meta && <span className="breadcrumb-meta">{meta}</span>}
    </nav>
  );
}

/** Previous / next links at the foot of a page in a flat section. */
export function Pager({ base, items, active }: { base: string; items: SectionNavItem[]; active: string }) {
  const i = items.findIndex((x) => x.slug === active);
  const prev = items[i - 1];
  const next = items[i + 1];
  if (!prev && !next) return null;
  return (
    <nav aria-label="Pagination" className="pager">
      {prev ? (
        <Link href={`${base}/${prev.slug}`} className="pager-link">
          <span className="pager-dir"><Chevron dir="left" />Previous</span>
          <span className="pager-title">{prev.title}</span>
        </Link>
      ) : <span />}
      {next && (
        <Link href={`${base}/${next.slug}`} className="pager-link next">
          <span className="pager-dir">Next<Chevron dir="right" /></span>
          <span className="pager-title">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
