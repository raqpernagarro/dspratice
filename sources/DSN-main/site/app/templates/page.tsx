import { listTemplates } from '@/lib/ds-knowledge';
import { TemplateGallery } from '@/components/templates/TemplateGallery';

export const metadata = { title: 'Templates' };

export default function TemplatesPage() {
  return (
    <main className="page page-wide">
      <h1>Templates</h1>
      <p className="lead">
        Full pages built only from DS-Ngr components and tokens. Each one follows its pattern spec, passes the same checks
        AI agents run, and can be copied or opened in the prototype playground.
      </p>
      <TemplateGallery templates={listTemplates()} />
    </main>
  );
}
