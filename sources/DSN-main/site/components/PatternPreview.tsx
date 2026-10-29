// Wireframe tile art for the Patterns index — each tile is a miniature page
// built on DS tokens, so it follows the theme like the component previews.

const Shell = ({ children, title = 'w40' }: { children: React.ReactNode; title?: string }) => (
  <div className="wf-shell">
    <div className="wf-side">
      <span className="wf-logo" />
      <span className="wf-nav active" />
      <span className="wf-nav" />
      <span className="wf-nav" />
      <span className="wf-nav" />
    </div>
    <div className="wf-main">
      <div className="wf-header">
        <span className={`gv-line ${title} wf-title`} />
        <span className="wf-btn" />
      </div>
      {children}
    </div>
  </div>
);

const Toolbar = () => (
  <div className="wf-toolbar">
    <span className="wf-search" />
    <span className="wf-chip" />
    <span className="wf-chip" />
  </div>
);

const ROWS = [
  ['w70', 'success'],
  ['w55', 'progress'],
  ['w62', 'warning'],
  ['w45', 'success'],
  ['w60', 'neutral'],
];

const Table = ({ selected }: { selected?: number }) => (
  <div className="wf-table">
    <div className="wf-row head">
      <span className="gv-line w45" /><span className="gv-line w60" /><span className="gv-line w45" />
    </div>
    {ROWS.map(([w, tone], i) => (
      <div key={i} className={`wf-row${selected === i ? ' selected' : ''}`}>
        <span className={`gv-line ${w}`} />
        <span className="gv-line w55" />
        <span className={`wf-tag ${tone}`} />
      </div>
    ))}
  </div>
);

const DataPage = () => (
  <Shell>
    <Toolbar />
    <Table />
    <div className="wf-pagination">
      <span className="wf-page" /><span className="wf-page active" /><span className="wf-page" />
    </div>
  </Shell>
);

const Field = ({ w = 'w45' }: { w?: string }) => (
  <div className="wf-field">
    <span className={`gv-line ${w} wf-label`} />
    <span className="wf-input" />
  </div>
);

const FormPage = () => (
  <Shell title="w55">
    <div className="wf-card wf-form">
      <div className="wf-form-grid">
        <Field /><Field w="w60" />
      </div>
      <Field w="w55" />
      <div className="wf-field">
        <span className="gv-line w45 wf-label" />
        <span className="wf-input tall" />
      </div>
      <div className="wf-actions">
        <span className="wf-btn ghost" /><span className="wf-btn" />
      </div>
    </div>
  </Shell>
);

const BARS = [40, 65, 50, 80, 60, 92, 72];

const Dashboard = () => (
  <Shell>
    <div className="wf-stats">
      {['up', 'up', 'down'].map((d, i) => (
        <div key={i} className="wf-card wf-stat">
          <span className="gv-line w60" />
          <span className="wf-stat-value" />
          <span className={`wf-delta ${d}`} />
        </div>
      ))}
    </div>
    <div className="wf-charts">
      <div className="wf-card wf-chart">
        {BARS.map((h, i) => <span key={i} className="wf-bar" style={{ height: `${h}%` }} />)}
      </div>
      <div className="wf-card wf-donut-card">
        <span className="wf-donut" />
      </div>
    </div>
  </Shell>
);

const DetailDrawer = () => (
  <div className="wf-drawer-scene">
    <Shell>
      <Toolbar />
      <Table selected={1} />
    </Shell>
    <span className="wf-scrim" />
    <div className="wf-drawer">
      <div className="wf-drawer-head">
        <span className="gv-line w60 wf-title" />
        <span className="wf-close" />
      </div>
      {['w55', 'w70', 'w45', 'w62'].map((w, i) => (
        <div key={i} className="wf-dl">
          <span className="gv-line w45" />
          <span className={`gv-line ${w} strong`} />
        </div>
      ))}
      <div className="wf-actions">
        <span className="wf-btn" />
      </div>
    </div>
  </div>
);

const ART: Record<string, () => React.JSX.Element> = {
  'data-page': DataPage,
  'form-page': FormPage,
  dashboard: Dashboard,
  'detail-drawer': DetailDrawer,
};

export function PatternPreview({ slug }: { slug: string }) {
  const Art = ART[slug];
  return Art ? <Art /> : <span className="pv-fallback">{slug.charAt(0).toUpperCase()}</span>;
}
