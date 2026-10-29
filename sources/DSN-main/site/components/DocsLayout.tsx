import { ComponentNav } from './ComponentNav';
import { OnThisPage } from './OnThisPage';

/**
 * Three-column docs frame: menu · content · on-this-page, centred as one block.
 * `toc={false}` drops the right column when the left menu already indexes the page.
 */
export function DocsLayout({ active, nav, toc = true, children }: {
  active?: string;
  nav?: React.ReactNode;
  toc?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={toc ? 'docs-layout' : 'docs-layout no-toc'}>
      {nav ?? <ComponentNav active={active} />}
      <main className="docs-content">{children}</main>
      {toc && <OnThisPage />}
    </div>
  );
}
