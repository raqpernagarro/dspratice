import { Breadcrumb } from '@/components/SectionNav';
import { orgConfigured } from '@/lib/chat/org';

export const metadata = { title: 'Company key' };
export const dynamic = 'force-dynamic';

const ENV = [
  ['ORG_AI_PROVIDER', 'gateway, anthropic or openai'],
  ['ORG_AI_KEY', 'The shared key. Server-only; never exposed to browsers.'],
  ['ORG_AI_MODEL', 'Model id for that provider, e.g. claude-sonnet-5-5'],
  ['ORG_AI_DAILY_TOKENS', 'Per-person daily token budget (default 200000)'],
];

export default function CompanyKeyPage() {
  const configured = orgConfigured();
  return (
    <main className="page">
      <Breadcrumb label="Prototype" base="/prototype" current="Company key" />
      <p className="eyebrow">Needs the hosted site</p>
      <h1>Company key</h1>
      <p className="lead">
        Sign in with your Nagarro account and prototype on a shared, quota-managed key — no personal key or subscription
        needed. This route switches on once the site is hosted with Nagarro sign-in.
      </p>

      <h2>What you will get</h2>
      <ul className="steps">
        <li>The same chat and live canvas as the own-key route, with the model chosen by the DS team.</li>
        <li>A daily allowance per person, shown in the chat. It resets at midnight UTC.</li>
        <li>Nothing to paste: the key lives on the server and is never sent to your browser.</li>
      </ul>
      <p className="muted">Until then, use your own key, OpenRouter, or connect the AI you already have via MCP.</p>

      <h2>For admins: switching it on</h2>
      <p className="muted">Server status: {configured ? 'company key configured; waiting for sign-in.' : 'not configured.'}</p>
      <ol className="steps">
        <li>
          <strong>Host the site</strong> and move prototypes, kits and usage to a durable store (the local file store in
          <code> site/.data</code> sits behind one interface in <code>lib/prototype/store.ts</code>).
        </li>
        <li>
          <strong>Add Nagarro sign-in</strong> (Microsoft Entra ID app registration) and implement <code>getOrgUser()</code> in
          <code> lib/chat/org.ts</code> to return the signed-in user.
        </li>
        <li>
          <strong>Set the environment</strong> on the server:
          <ul className="env-list">
            {ENV.map(([k, v]) => (
              <li key={k}>
                <code>{k}</code> <span className="muted">{v}</span>
              </li>
            ))}
          </ul>
        </li>
        <li>
          <strong>Swap the quota store</strong>: <code>getQuota()</code> uses local files today; point it at the durable store.
        </li>
      </ol>
    </main>
  );
}
