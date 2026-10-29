'use client';

import { useState } from 'react';
import { Button, Tab } from 'ds-ngr';
import { Check, Copy } from 'lucide-react';

/** Preview / Code tabs for one template. The preview is the full-screen frame route. */
export function TemplateViewer({ slug, title, source }: { slug: string; title: string; source: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context or permissions) — the Code tab still shows the source.
    }
  };

  return (
    <div className="template-viewer">
      <Tab
        defaultValue="preview"
        tabs={[
          {
            value: 'preview',
            label: 'Preview',
            panel: (
              <div className="template-frame">
                <iframe src={`/p/templates/${slug}`} title={`${title} template`} />
              </div>
            ),
          },
          {
            value: 'code',
            label: 'Code',
            panel: (
              <pre className="template-code">
                <code>{source}</code>
              </pre>
            ),
          },
        ]}
      />
      <div className="template-viewer-actions">
        <Button variant="secondary" showLeadingIcon leadingIcon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={copy}>
          {copied ? 'Copied' : 'Copy code'}
        </Button>
      </div>
    </div>
  );
}
