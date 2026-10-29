'use client';

/**
 * Pre-paint inline script. It runs from the server HTML; when React re-creates the
 * root layout on the client (e.g. a notFound() 404) it is emitted as an inert
 * `text/plain` block, which React doesn't warn about and which wouldn't run anyway.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? undefined : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
