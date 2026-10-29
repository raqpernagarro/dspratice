import { DocsLayout } from '@/components/DocsLayout';
import { TokenFilterBar, TokenFilterProvider, TokenTables } from '@/components/TokenFilters';
import { TokensNav } from '@/components/TokensNav';
import { getSemanticTokens } from '@/lib/ds-knowledge';

export const metadata = { title: 'Tokens' };

export default function TokensPage() {
  return (
    <TokenFilterProvider groups={getSemanticTokens()}>
      <DocsLayout toc={false} nav={<TokensNav />}>
        <h1>Tokens</h1>
        <p className="lead">
          Semantic and component tokens parsed from <code>tokens.css</code>. Previews use the live CSS variable, so they follow the
          theme toggle — hover a motion row to play it. Primitives are intentionally hidden — components never use them.
        </p>
        <TokenFilterBar />
        <TokenTables />
      </DocsLayout>
    </TokenFilterProvider>
  );
}
