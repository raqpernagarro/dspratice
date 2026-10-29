'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/** Natural viewport the template is laid out at before the tile scales it down. */
const FRAME_WIDTH = 1280;
const FRAME_HEIGHT = 800;

/** A live, non-interactive miniature of a template page. */
export function TemplateThumb({ slug, title }: { slug: string; title: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / FRAME_WIDTH);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={stage} className="template-thumb">
      {scale > 0 && (
        <iframe
          src={`/p/templates/${slug}`}
          title={`${title} preview`}
          loading="lazy"
          tabIndex={-1}
          style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT, transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}
