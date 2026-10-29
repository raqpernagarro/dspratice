import { Breadcrumb } from '@/components/SectionNav';
import { ConnectPanel } from '@/components/prototype/ConnectPanel';
import { TOOLS } from '@/lib/mcp/tools';

export const metadata = { title: 'Connect your AI' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function McpPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <main className="page">
      <Breadcrumb label="Prototype" base="/prototype" current="Connect your AI" />
      <h1>Connect your AI via MCP</h1>
      <p className="lead">
        Give Claude Code, Claude, Cursor or Copilot DS-Ngr itself: the components with their real props, the rules, the tokens in your
        theme — and a live canvas to draw prototypes on. Pick your theme or team kit; every answer and every prototype
        follows it.
      </p>
      <ConnectPanel initialTheme={one(sp.theme)} kitId={one(sp.kit)} kitKey={one(sp.key)} />

      <h2>Try it</h2>
      <ol className="steps">
        <li>Add the connection above to your AI client and check that it lists the <code>ds-ngr</code> tools.</li>
        <li>
          Ask for a screen, for example: <em>“Using ds-ngr, build a data page listing projects with status and owner.”</em>
        </li>
        <li>Your AI replies with a live link. Open it: the canvas updates every time the AI fixes an issue or you ask for a change.</li>
        <li>Share the link without <code>?live</code> for a fixed view, or keep iterating in the same conversation.</li>
      </ol>

      <h2>What your AI can do</h2>
      <ul className="tool-list">
        {TOOLS.map((t) => (
          <li key={t.name}>
            <code>{t.name}</code>
            <span className="muted">{t.description.split('. ')[0].replace(/\.$/, '')}.</span>
          </li>
        ))}
      </ul>

      <h2>Team kits</h2>
      <p className="muted">
        A team kit bundles your theme with your own components (a ProjectCard, a KPI strip…) and page patterns, written
        with DS-Ngr parts. Ask your AI to <em>“create a team kit from this theme”</em>; it returns a link to share with
        the team and a private link that can edit the kit.
      </p>
    </main>
  );
}
