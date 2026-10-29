'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Chip } from 'ds-ngr';
import type { TemplateEntry } from '@/lib/ds-knowledge';
import { TemplateThumb } from './TemplateThumb';

const ALL = 'All';

export function TemplateGallery({ templates }: { templates: TemplateEntry[] }) {
  const categories = [ALL, ...new Set(templates.map((t) => t.category))];
  const [category, setCategory] = useState(ALL);
  const shown = category === ALL ? templates : templates.filter((t) => t.category === category);

  return (
    <>
      <div className="template-filter" role="group" aria-label="Filter by category">
        {categories.map((c) => (
          <Chip key={c} label={c} size="md" selected={c === category} showLeadingIcon={false} showTrailingIcon={false} onClick={() => setCategory(c)} />
        ))}
      </div>
      <div className="template-grid">
        {shown.map((t) => (
          <div key={t.slug} className="preview-card">
            <div className="preview-stage template-stage" inert aria-hidden>
              <TemplateThumb slug={t.slug} title={t.title} />
            </div>
            <div className="guide-meta">
              <Link href={`/templates/${t.slug}`} className="preview-name card-title">{t.title}</Link>
              <span className="muted">{t.description}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
