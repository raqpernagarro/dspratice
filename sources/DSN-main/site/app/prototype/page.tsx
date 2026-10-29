import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Tag } from '@/components/ds';

export const metadata = { title: 'Prototype' };

/* Artwork: tokens only, so every illustration follows the active theme. */
const ink = 'var(--color-foreground-neutral-secondary)';
const accent = 'var(--color-foreground-accent-strong)';
const surface = 'var(--color-background-neutral-primary)';
const line = 'var(--color-border-neutral-primary)';
const soft = 'var(--color-background-interactive-secondary-selected)';

function McpArt() {
  return (
    <svg viewBox="0 0 240 140" aria-hidden="true">
      {/* AI client nodes */}
      {[28, 70, 112].map((y, i) => (
        <g key={y}>
          <rect x="16" y={y - 14} width="56" height="28" rx="8" fill={surface} stroke={line} />
          <circle cx="32" cy={y} r="5" fill={i === 1 ? accent : ink} opacity={i === 1 ? 1 : 0.5} />
          <rect x="42" y={y - 3} width="20" height="6" rx="3" fill={ink} opacity="0.35" />
          <path d={`M72 ${y} C 100 ${y}, 104 70, 128 70`} fill="none" stroke={i === 1 ? accent : line} strokeWidth="1.5" strokeDasharray={i === 1 ? undefined : '3 3'} />
        </g>
      ))}
      {/* live canvas */}
      <rect x="128" y="22" width="96" height="96" rx="10" fill={surface} stroke={accent} strokeWidth="1.5" />
      <rect x="138" y="32" width="76" height="10" rx="3" fill={soft} />
      <rect x="138" y="50" width="34" height="28" rx="4" fill={soft} />
      <rect x="180" y="50" width="34" height="28" rx="4" fill="none" stroke={line} />
      <rect x="138" y="86" width="44" height="8" rx="4" fill={accent} />
      <rect x="138" y="100" width="62" height="6" rx="3" fill={ink} opacity="0.3" />
      <circle cx="214" cy="110" r="4" fill={accent} />
    </svg>
  );
}

function KeyArt() {
  return (
    <svg viewBox="0 0 240 140" aria-hidden="true">
      {/* browser window */}
      <rect x="20" y="18" width="200" height="104" rx="10" fill={surface} stroke={line} />
      <path d="M20 40 H220" stroke={line} />
      {[34, 46, 58].map((x) => <circle key={x} cx={x} cy="29" r="3.5" fill={ink} opacity="0.35" />)}
      {/* masked key field */}
      <rect x="40" y="58" width="160" height="28" rx="6" fill={soft} stroke={accent} />
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={56 + i * 12} cy="72" r="3" fill={accent} />)}
      {/* key */}
      <circle cx="176" cy="72" r="7" fill="none" stroke={accent} strokeWidth="2" />
      <path d="M183 72 H194 M190 72 V77" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      {/* lock badge: stays local */}
      <rect x="96" y="98" width="48" height="14" rx="7" fill={surface} stroke={line} />
      <rect x="104" y="103" width="6" height="5" rx="1" fill={ink} />
      <rect x="114" y="104" width="22" height="3" rx="1.5" fill={ink} opacity="0.35" />
    </svg>
  );
}

function RouterArt() {
  const models = [24, 56, 88, 120];
  return (
    <svg viewBox="0 0 240 140" aria-hidden="true">
      {/* single sign-in */}
      <rect x="16" y="56" width="60" height="28" rx="14" fill={accent} />
      <circle cx="32" cy="70" r="6" fill={surface} />
      <rect x="44" y="67" width="22" height="6" rx="3" fill={surface} opacity="0.8" />
      {/* hub */}
      <path d="M76 70 H108" stroke={accent} strokeWidth="1.5" />
      <circle cx="120" cy="70" r="12" fill={soft} stroke={accent} strokeWidth="1.5" />
      <circle cx="120" cy="70" r="4" fill={accent} />
      {/* fan-out to models */}
      {models.map((y, i) => (
        <g key={y}>
          <path d={`M132 70 C 156 70, 156 ${y}, 176 ${y}`} fill="none" stroke={line} strokeWidth="1.5" />
          <rect x="176" y={y - 11} width="48" height="22" rx="6" fill={surface} stroke={i === 1 ? accent : line} />
          <rect x="184" y={y - 3} width={18 + i * 4} height="6" rx="3" fill={i === 1 ? accent : ink} opacity={i === 1 ? 1 : 0.35} />
        </g>
      ))}
    </svg>
  );
}

function CompanyArt() {
  const people = [52, 84, 116, 148, 180];
  return (
    <svg viewBox="0 0 240 140" aria-hidden="true">
      {/* shared key vault */}
      <rect x="92" y="14" width="56" height="44" rx="10" fill={soft} stroke={accent} strokeWidth="1.5" />
      <circle cx="114" cy="36" r="7" fill="none" stroke={accent} strokeWidth="2" />
      <path d="M121 36 H134 M130 36 V41" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      {/* team */}
      {people.map((x, i) => (
        <g key={x}>
          <path d={`M120 58 C 120 74, ${x} 70, ${x} 86`} fill="none" stroke={line} strokeWidth="1.5" />
          <circle cx={x} cy="94" r="8" fill={surface} stroke={i === 2 ? accent : line} strokeWidth="1.5" />
          <circle cx={x} cy="92" r="3" fill={i === 2 ? accent : ink} opacity={i === 2 ? 1 : 0.45} />
        </g>
      ))}
      {/* quota meter */}
      <rect x="52" y="114" width="136" height="8" rx="4" fill={surface} stroke={line} />
      <rect x="52" y="114" width="84" height="8" rx="4" fill={accent} />
    </svg>
  );
}

function CliArt() {
  return (
    <svg viewBox="0 0 240 140" aria-hidden="true">
      {/* terminal */}
      <rect x="16" y="22" width="120" height="96" rx="10" fill={surface} stroke={line} />
      <path d="M16 42 H136" stroke={line} />
      {[28, 40, 52].map((x) => <circle key={x} cx={x} cy="32" r="3.5" fill={ink} opacity="0.35" />)}
      <path d="M28 58 L36 64 L28 70" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="42" y="61" width="72" height="6" rx="3" fill={accent} />
      <rect x="28" y="80" width="56" height="6" rx="3" fill={ink} opacity="0.35" />
      <rect x="28" y="94" width="80" height="6" rx="3" fill={ink} opacity="0.35" />
      {/* writes an app */}
      <path d="M136 70 H160" stroke={accent} strokeWidth="1.5" />
      <rect x="160" y="30" width="64" height="80" rx="8" fill={surface} stroke={accent} strokeWidth="1.5" />
      <rect x="160" y="30" width="16" height="80" rx="8" fill={soft} />
      <rect x="184" y="42" width="30" height="8" rx="3" fill={soft} />
      <rect x="184" y="58" width="30" height="20" rx="4" fill="none" stroke={line} />
      <rect x="184" y="86" width="22" height="8" rx="4" fill={accent} />
    </svg>
  );
}

type Status = 'live' | 'hosted';

const PATHS: { title: string; body: string; art: ReactNode; href: string; status: Status }[] = [
  { title: 'Try the demo — no key', body: 'Click through the chat and live canvas without an API key. A scripted stand-in replays page templates through the real tools.', art: <KeyArt />, href: '/prototype/chat?source=demo', status: 'live' },
  { title: 'Connect your AI via MCP', body: 'Claude Code, Cursor, ChatGPT or Copilot draw on a live canvas here using real DS-Ngr components — one command or config line to connect.', art: <McpArt />, href: '/prototype/mcp', status: 'live' },
  { title: 'Build with the CLI', body: 'Start the real app in your codebase: one command creates a themed React app, then add pages and look up components from your terminal.', art: <CliArt />, href: '/prototype/cli', status: 'live' },
  { title: 'Chat with your own key', body: 'Paste an Anthropic, OpenAI or Gemini key — kept in your browser, sent only with your requests, never saved.', art: <KeyArt />, href: '/prototype/chat?source=key', status: 'live' },
  { title: 'Sign in with OpenRouter', body: 'One sign-in, any model, billed to your OpenRouter account.', art: <RouterArt />, href: '/prototype/chat?source=openrouter', status: 'live' },
  { title: 'Company key', body: 'Sign in with your Nagarro account and use the shared, quota-managed key.', art: <CompanyArt />, href: '/prototype/company', status: 'hosted' },
];

function RoadmapRow({ title, body, art, status }: { title: string; body: string; art: ReactNode; status: Status }) {
  return (
    <>
      <div className="roadmap-art">{art}</div>
      <div className="roadmap-body">
        <span className="roadmap-title">{title}</span>
        <span className="muted">{body}</span>
        <span>
          {status === 'live' ? <Tag variant="success" size="sm" label="Available" /> : <Tag variant="neutral" size="sm" label="Needs the hosted site" />}
        </span>
      </div>
      <ChevronRight className="roadmap-chevron" size={24} aria-hidden="true" />
    </>
  );
}

export default function PrototypePage() {
  return (
    <main className="page">
      <h1>Prototype with DS-Ngr</h1>
      <p className="lead">
        Build real, shareable prototypes from DS-Ngr components with whichever AI you prefer. Every route uses the same
        rules and component docs this site is generated from.
      </p>
      <div className="hero-actions">
        <Link href="/prototype/playground" className="link-button">
          Try the canvas playground
        </Link>
      </div>
      <ol className="roadmap-list">
        {PATHS.map((p) => (
          <li key={p.title}>
            <Link href={p.href} className="roadmap-row roadmap-link">
              <RoadmapRow {...p} />
            </Link>
          </li>
        ))}
      </ol>

    </main>
  );
}
