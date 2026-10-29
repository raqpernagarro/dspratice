'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface Heading { id: string; text: string }

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Right-hand "On this page" list built from the main column's h2s, with scroll-spy. */
export function OnThisPage() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const pathname = usePathname();

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLHeadingElement>('.docs-content h2')];
    const used = new Set<string>();
    const found = els.map((el) => {
      let id = el.id || slugify(el.textContent ?? '');
      while (used.has(id)) id += '-2';
      used.add(id);
      el.id = id;
      return { id, text: el.textContent ?? '' };
    });
    setHeadings(found);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -65% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  if (headings.length < 2) return <aside className="toc" aria-hidden="true" />;

  return (
    <aside className="toc">
      <nav aria-label="On this page">
        <p className="toc-heading">On this page</p>
        {headings.map((h) => (
          <a key={h.id} href={`#${h.id}`} aria-current={h.id === activeId ? 'location' : undefined}>{h.text}</a>
        ))}
      </nav>
    </aside>
  );
}
