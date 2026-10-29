/**
 * Scripted component drafts for the demo source (lib/chat/demo.ts): the three
 * examples the Create component page suggests, each with two options that
 * differ in a real trade-off. Built only from DS-Ngr parts and tokens, so they
 * pass the same checks a model's drafts do (see demo.test.ts).
 */

export interface DemoDraft {
  /** Words in a request that pick this example. */
  keywords: string[];
  title: string;
  options: {
    name: string;
    summary: string;
    rationale: string;
    source: string;
    states: { label: string; usage: string }[];
  }[];
}

const row = "display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'";
const col = "display: 'flex', flexDirection: 'column', gap: 'var(--space-2xs)'";
const muted = "color: 'var(--color-foreground-neutral-secondary)', fontSize: 'var(--font-size-body-sm)'";

const STEPS = `[{ label: 'Placed', date: '12 Oct', done: true }, { label: 'Paid', date: '12 Oct', done: true }, { label: 'Shipped', date: '14 Oct', done: true }, { label: 'Delivered', date: 'Expected 17 Oct', done: false }]`;

export const DEMO_DRAFTS: DemoDraft[] = [
  {
    keywords: ['timeline', 'order', 'history', 'shipped', 'delivered', 'tracking', 'steps'],
    title: 'Order status timeline',
    options: [
      {
        name: 'OrderTimeline',
        summary: 'A vertical history of an order’s status, for detail pages and drawers.',
        rationale: 'Roomy and readable: one row per step with its date, best where the order is the focus.',
        source: `export default function OrderTimeline({ title, steps }) {
  return (
    <Card showHeader title={title} showBottomBar={false}>
      <div style={{ ${col}, gap: 'var(--space-md)' }}>
        {steps.length === 0 && <span style={{ ${muted} }}>No status updates yet.</span>}
        {steps.map((s) => (
          <div key={s.label} style={{ ${row}, justifyContent: 'space-between' }}>
            <div style={{ ${row} }}>
              <Tag label={s.done ? 'Done' : 'Next'} variant={s.done ? 'success' : 'neutral'} size="sm" />
              <span>{s.label}</span>
            </div>
            <span style={{ ${muted} }}>{s.date}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}`,
        states: [
          { label: 'In transit', usage: `<OrderTimeline title="Order 1042" steps={${STEPS}} />` },
          { label: 'Just placed', usage: `<OrderTimeline title="Order 1043" steps={[{ label: 'Placed', date: 'Today', done: true }, { label: 'Paid', date: 'Pending', done: false }]} />` },
          { label: 'Empty', usage: '<OrderTimeline title="Order 1044" steps={[]} />' },
          { label: 'Long text', usage: `<OrderTimeline title="Order 1045 for Adventure Works international logistics" steps={[{ label: 'Waiting for the carrier to collect the parcel from the warehouse', date: '15 Oct', done: false }]} />` },
        ],
      },
      {
        name: 'OrderProgressStrip',
        summary: 'A one-line order progress summary for tables and lists.',
        rationale: 'Dense: the current step and overall progress in one row, best in lists of many orders.',
        source: `export default function OrderProgressStrip({ order, steps }) {
  const done = steps.filter((s) => s.done).length;
  const current = steps.find((s) => !s.done);
  return (
    <div style={{ ${row}, justifyContent: 'space-between', padding: 'var(--space-sm) var(--space-md)', borderRadius: 'var(--shape-radius-md)', border: 'var(--size-border-sm) solid var(--color-border-neutral-primary)' }}>
      <div style={{ ${col} }}>
        <strong>{order}</strong>
        <span style={{ ${muted} }}>{current ? 'Next: ' + current.label + ' · ' + current.date : 'Delivered'}</span>
      </div>
      <div style={{ width: '40%' }}>
        <ProgressBar value={steps.length ? Number(((done / steps.length) * 100).toFixed(0)) : 0} label={done + ' of ' + steps.length + ' steps'} />
      </div>
    </div>
  );
}`,
        states: [
          { label: 'In transit', usage: `<OrderProgressStrip order="Order 1042" steps={${STEPS}} />` },
          { label: 'Delivered', usage: `<OrderProgressStrip order="Order 1039" steps={[{ label: 'Placed', date: '2 Oct', done: true }, { label: 'Delivered', date: '6 Oct', done: true }]} />` },
          { label: 'Empty', usage: '<OrderProgressStrip order="Order 1044" steps={[]} />' },
        ],
      },
    ],
  },
  {
    keywords: ['team', 'member', 'person', 'people', 'user', 'role', 'avatar', 'row'],
    title: 'Team member row',
    options: [
      {
        name: 'TeamMemberRow',
        summary: 'A list row for one person: avatar, name, role and status.',
        rationale: 'Compact list row, best in member lists and pickers where many people are shown.',
        source: `export default function TeamMemberRow({ name, role, status }) {
  return (
    <div style={{ ${row}, justifyContent: 'space-between', padding: 'var(--space-xs) 0' }}>
      <div style={{ ${row} }}>
        <Avatar name={name} fill="initials" size="sm" />
        <div style={{ ${col} }}>
          <span>{name}</span>
          <span style={{ ${muted} }}>{role}</span>
        </div>
      </div>
      {status && <Tag label={status} variant={status === 'Away' ? 'warning' : status === 'Invited' ? 'neutral' : 'success'} size="sm" />}
    </div>
  );
}`,
        states: [
          { label: 'Active', usage: '<TeamMemberRow name="Ana Costa" role="Delivery manager" status="Active" />' },
          { label: 'Away', usage: '<TeamMemberRow name="Bruno Lima" role="Frontend engineer" status="Away" />' },
          { label: 'Invited', usage: '<TeamMemberRow name="carla.reis@example.com" role="Pending invite" status="Invited" />' },
          { label: 'No status', usage: '<TeamMemberRow name="Diogo Sá" role="QA" />' },
          { label: 'Long text', usage: '<TeamMemberRow name="Maria Fernanda de Albuquerque Rodrigues" role="Principal product designer, platform experience" status="Active" />' },
        ],
      },
      {
        name: 'TeamMemberCard',
        summary: 'A card for one person with a primary action, for directories and team pages.',
        rationale: 'Roomy card with an action, best where people are browsed rather than scanned.',
        source: `export default function TeamMemberCard({ name, role, status }) {
  return (
    <Card showHeader title={name} description={role} headerLeadingControl={<Avatar name={name} fill="initials" size="lg" />} showBottomBar={false}>
      <div style={{ ${row}, justifyContent: 'space-between' }}>
        <Tag label={status || 'No status'} variant={status === 'Away' ? 'warning' : status ? 'success' : 'neutral'} size="sm" />
        <Button variant="secondary" size="sm">Message</Button>
      </div>
    </Card>
  );
}`,
        states: [
          { label: 'Active', usage: '<TeamMemberCard name="Ana Costa" role="Delivery manager" status="Active" />' },
          { label: 'Away', usage: '<TeamMemberCard name="Bruno Lima" role="Frontend engineer" status="Away" />' },
          { label: 'No status', usage: '<TeamMemberCard name="Diogo Sá" role="QA" />' },
        ],
      },
    ],
  },
  {
    keywords: ['usage', 'meter', 'quota', 'limit', 'plan', 'storage', 'seats', 'consumption'],
    title: 'Usage meter',
    options: [
      {
        name: 'UsageMeter',
        summary: 'Shows how much of a plan limit is used, with a warning past 80%.',
        rationale: 'Inline meter for settings and billing pages, where several limits sit together.',
        source: `export default function UsageMeter({ label, used, limit, unit }) {
  const percent = limit ? Number(((used / limit) * 100).toFixed(0)) : 0;
  return (
    <div style={{ ${col}, gap: 'var(--space-xs)' }}>
      <div style={{ ${row}, justifyContent: 'space-between' }}>
        <span>{label}</span>
        {percent >= 80 && <Tag label={percent >= 100 ? 'Limit reached' : 'Almost full'} variant={percent >= 100 ? 'error' : 'warning'} size="sm" />}
      </div>
      <ProgressBar value={percent > 100 ? 100 : percent} label={used + ' of ' + limit + ' ' + unit} />
    </div>
  );
}`,
        states: [
          { label: 'Comfortable', usage: '<UsageMeter label="Storage" used={12} limit={50} unit="GB" />' },
          { label: 'Over 80%', usage: '<UsageMeter label="Seats" used={9} limit={10} unit="seats" />' },
          { label: 'Limit reached', usage: '<UsageMeter label="API calls" used={100000} limit={100000} unit="calls" />' },
          { label: 'Empty', usage: '<UsageMeter label="Projects" used={0} limit={20} unit="projects" />' },
        ],
      },
      {
        name: 'UsageSummaryCard',
        summary: 'A card summarising plan usage with an upgrade action.',
        rationale: 'Stands alone on dashboards and nudges the upgrade, at the cost of more space.',
        source: `export default function UsageSummaryCard({ plan, used, limit, unit }) {
  const percent = limit ? Number(((used / limit) * 100).toFixed(0)) : 0;
  return (
    <Card showHeader title={plan + ' plan'} description={used + ' of ' + limit + ' ' + unit + ' used'} showBottomBar={false}>
      <div style={{ ${col}, gap: 'var(--space-sm)' }}>
        <ProgressBar value={percent > 100 ? 100 : percent} label={percent + '%'} />
        <div style={{ ${row}, justifyContent: 'space-between' }}>
          <span style={{ ${muted} }}>{percent >= 80 ? 'You are close to your limit.' : 'Plenty of room left.'}</span>
          <Button variant={percent >= 80 ? 'primary' : 'secondary'} size="sm">Upgrade</Button>
        </div>
      </div>
    </Card>
  );
}`,
        states: [
          { label: 'Comfortable', usage: '<UsageSummaryCard plan="Team" used={12} limit={50} unit="GB" />' },
          { label: 'Over 80%', usage: '<UsageSummaryCard plan="Starter" used={9} limit={10} unit="seats" />' },
          { label: 'Empty', usage: '<UsageSummaryCard plan="Free" used={0} limit={3} unit="projects" />' },
        ],
      },
    ],
  },
];

const words = (s: string) => s.toLowerCase().match(/[a-z]+/g) ?? [];

/** The example whose keywords best match the request, or null. */
export function pickDraft(text: string): DemoDraft | null {
  const asked = new Set(words(text));
  let best: DemoDraft | null = null;
  let score = 0;
  for (const d of DEMO_DRAFTS) {
    const s = d.keywords.filter((k) => asked.has(k) || asked.has(`${k}s`)).length;
    if (s > score) [best, score] = [d, s];
  }
  return best;
}
