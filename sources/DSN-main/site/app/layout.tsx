import type { Metadata } from 'next';
import '../../tokens.css';
import '../../src/styles/global-consumer.css';
import './site.css';
import { ChromeGate } from '@/components/ChromeGate';
import { InlineScript } from '@/components/InlineScript';
import { SiteHeader } from '@/components/SiteHeader';
import { StyledRegistry } from '@/lib/styled-registry';
import { getStorybookUrl } from '@/lib/ds-knowledge';
import { siteThemeScript } from '@/lib/theme/site-theme';

export const metadata: Metadata = {
  title: { default: 'DS-Ngr', template: '%s · DS-Ngr' },
  description: 'The Nagarro design system — components, tokens, patterns and an AI prototyping space.',
};

// Applied before paint so the stored theme never flashes.
const themeScript = `try{var t=localStorage.getItem('dsn-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}`;

// Lexical pulls in prismjs, which auto-highlights `code.language-*` on load and mutates
// `<pre>` before React hydrates docs markdown. Lexical tokenizes via the API only.
const prismScript = 'window.Prism=window.Prism||{};window.Prism.manual=true';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <InlineScript html={themeScript} />
        <InlineScript html={prismScript} />
        <InlineScript html={siteThemeScript} />
      </head>
      <body>
        <StyledRegistry>
          <ChromeGate>
            <SiteHeader storybookUrl={getStorybookUrl()} />
          </ChromeGate>
          {children}
        </StyledRegistry>
      </body>
    </html>
  );
}
