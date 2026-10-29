import { ResolvedValue } from './ResolvedValue';

// Mirrors src/docs/Styleguide.mdx (Storybook). Every preview uses the live CSS
// variable, so the page follows the header theme toggle and any applied theme.

interface SwatchGroup { title: string; subtitle: string; colors: [label: string, token: string][] }

const BACKGROUNDS: SwatchGroup[] = [
  { title: 'Page', subtitle: 'Main surfaces', colors: [['page/default', '--color-background-neutral-primary'], ['page/lower', '--color-background-neutral-secondary']] },
  { title: 'Surface hierarchy', subtitle: 'Semantic roles', colors: [['primary', '--color-background-neutral-primary'], ['secondary', '--color-background-neutral-secondary'], ['tertiary', '--color-background-neutral-tertiary']] },
  { title: 'Interactive (CTA)', subtitle: 'Buttons and primary actions', colors: [['cta/default', '--color-background-interactive-primary-default'], ['cta/hover', '--color-background-interactive-primary-hover'], ['cta/pressed', '--color-background-interactive-primary-active']] },
  { title: 'Interactive (Default)', subtitle: 'Standard actions', colors: [['default/default', '--color-background-interactive-secondary-default'], ['default/hover', '--color-background-interactive-secondary-hover'], ['default/pressed', '--color-background-interactive-secondary-active']] },
  { title: 'Interactive (Danger)', subtitle: 'Destructive actions', colors: [['danger/default', '--color-background-interactive-destructive-default'], ['danger/hover', '--color-background-interactive-destructive-hover'], ['danger/pressed', '--color-background-interactive-destructive-active']] },
];

const TEXT: SwatchGroup[] = [
  { title: 'Core typography', subtitle: 'Standard content roles', colors: [['text/primary', '--color-foreground-neutral-primary'], ['text/secondary', '--color-foreground-neutral-secondary'], ['text/tertiary', '--color-foreground-neutral-tertiary'], ['text/disabled', '--color-foreground-interactive-disabled'], ['text/placeholder', '--input-foreground-placeholder']] },
  { title: 'Interactive & accent', subtitle: 'Actions and branding', colors: [['text/accent', '--color-foreground-accent-strong'], ['text/danger', '--color-foreground-interactive-destructive-default'], ['text/cta/hover', '--color-foreground-interactive-primary-hover'], ['text/cta/pressed', '--color-foreground-interactive-primary-active']] },
  { title: 'Feedback text', subtitle: 'Status signaling', colors: [['text/error', '--color-foreground-error-strong'], ['text/success', '--color-foreground-success-strong'], ['text/warning', '--color-foreground-warning-strong']] },
  { title: 'Inverted', subtitle: 'On dark/accent backgrounds', colors: [['inverted/primary', '--color-foreground-inverse-primary'], ['inverted/secondary', '--color-foreground-inverse-secondary'], ['inverted/tertiary', '--color-foreground-inverse-tertiary']] },
];

const FEEDBACK: SwatchGroup[] = [
  { title: 'Success', subtitle: 'Positive outcomes', colors: [['success/default', '--color-background-success-soft-default']] },
  { title: 'Warning', subtitle: 'Attention required', colors: [['warning/default', '--color-background-warning-soft-default']] },
  { title: 'Error', subtitle: 'Critical issues', colors: [['error/default', '--color-background-error-soft-default'], ['error/critical', '--color-background-error-strong']] },
];

const CHARTS: SwatchGroup[] = [
  { title: 'Series', subtitle: 'Categorical, in order', colors: Array.from({ length: 8 }, (_, i) => [`${i + 1}`, `--color-background-dataviz-${i + 1}`]) },
];
const CHART_STATES: SwatchGroup[] = [
  { title: 'States', subtitle: 'Follow the feedback ramps', colors: [['positive', '--color-background-dataviz-positive'], ['negative', '--color-background-dataviz-negative'], ['warning', '--color-background-dataviz-warning'], ['neutral', '--color-background-dataviz-neutral']] },
];

const FONT_SCALE = [
  'micro',
  'label',
  'body-sm',
  'body-md',
  'display-sm',
  'display-md',
  'display-lg',
  'display-xl',
  'display-2xl',
  'display-3xl',
];
const WEIGHTS = [['Regular', 'regular'], ['Medium', 'medium'], ['Semibold', 'semibold']];
const SPACE = ['none', '3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
const INSET = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl'];
const RADIUS = [['none', 'none'], ['xsmall', 'xsmall'], ['small', 'small'], ['standard', 'standard'], ['large', 'large'], ['xlarge', 'xlarge'], ['full', 'full']];
const ELEVATION = [
  { name: 'short', use: 'Cards, chips', shadow: '0 var(--primitive-size-1) var(--effect-blur-sm) var(--primitive-size-negative-1) var(--color-shadow-elevation-sm)' },
  { name: 'medium', use: 'Dropdowns, tooltips', shadow: '0 var(--primitive-size-4) var(--effect-blur-md) var(--primitive-size-negative-2) var(--color-shadow-elevation-md)' },
  { name: 'high', use: 'Modals, popovers', shadow: '0 var(--primitive-size-16) var(--effect-blur-lg) var(--primitive-size-negative-3) var(--color-shadow-elevation-lg)' },
];

/** Lets long token names wrap at hyphens instead of mid-word, without altering copied text. */
const breakable = (token: string) =>
  token.split(/(?<=-)(?=[a-z0-9])/).map((part, i) => (i === 0 ? part : <span key={i}><wbr />{part}</span>));

/** `compact` drops the token names: for chart series, where the label is the order. */
function Swatches({ groups, compact = false }: { groups: SwatchGroup[]; compact?: boolean }) {
  return (
    <div className="sg-palette">
      {groups.map((g) => (
        <div key={g.title} className="sg-palette-row">
          <div>
            <p className="sg-row-title">{g.title}</p>
            <p className="sg-row-sub">{g.subtitle}</p>
          </div>
          <div className="sg-swatches" style={{ gridTemplateColumns: `repeat(${g.colors.length}, minmax(0, 1fr))` }}>
            {g.colors.map(([label, token]) => (
              <div key={token} className="sg-swatch">
                <span className="sg-swatch-chip" style={{ background: `var(${token})` }} />
                <span className="sg-swatch-label">{label}</span>
                {!compact && <code className="sg-swatch-token">{breakable(token)}</code>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Each visual is a standalone block (no heading) so it can sit under the matching
// heading of a foundation guide (/guides/colors, /typography, /spacing, /foundations).

export const BackgroundSwatches = () => <div className="sg-root"><Swatches groups={BACKGROUNDS} /></div>;
export const TextSwatches = () => <div className="sg-root"><Swatches groups={TEXT} /></div>;
export const FeedbackSwatches = () => <div className="sg-root"><Swatches groups={FEEDBACK} /></div>;
export const ChartSwatches = () => (
  <div className="sg-root">
    <Swatches groups={CHARTS} compact />
    <Swatches groups={CHART_STATES} />
  </div>
);

export function FontScale() {
  return (
    <div className="sg-root">
      <div className="sg-list">
        {FONT_SCALE.map((name) => (
          <div key={name} className="sg-type-row">
            <p className="sg-type-sample" style={{ fontSize: `var(--font-size-${name})`, lineHeight: `var(--font-line-height-${name})` }}>
              The quick brown fox jumps over the lazy dog
            </p>
            <div className="sg-meta">
              <span>font/size/{name}</span>
              <code>--font-size-{name}</code>
              <code>--font-line-height-{name}</code>
              <ResolvedValue token={`--font-size-${name}`} prop="font-size" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FontWeights() {
  return (
    <div className="sg-root">
      <div className="sg-weights">
        {WEIGHTS.map(([label, token]) => (
          <div key={token} className="sg-weight">
            <span style={{ fontWeight: `var(--font-weight-${token})` }}>Aa</span>
            <span className="sg-row-sub">{label}</span>
            <code className="sg-swatch-token">--font-weight-{token}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpaceScale() {
  return (
    <div className="sg-root">
      <div className="sg-space-list">
        {SPACE.map((name) => (
          <div key={name} className="sg-space-row">
            <code>--space-{name}</code>
            <ResolvedValue token={`--space-${name}`} />
            <span className="sg-space-bar" style={{ width: `var(--space-${name})` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InsetScale() {
  return (
    <div className="sg-root">
      <div className="sg-tiles">
        {INSET.map((name) => (
          <div key={name} className="sg-tile-wrap">
            <div className="sg-inset" style={{ padding: `var(--space-${name})` }}>
              <span className="sg-inset-content" />
            </div>
            <span className="sg-row-title">{name}</span>
            <ResolvedValue token={`--space-${name}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RadiusScale() {
  return (
    <div className="sg-root">
      <div className="sg-tiles">
        {RADIUS.map(([label, token]) => (
          <div key={token} className="sg-tile-wrap">
            <span className="sg-radius" style={{ borderRadius: `var(--shape-radius-${token})` }} />
            <span className="sg-row-title">{label}</span>
            <code className="sg-swatch-token">--shape-radius-{token}</code>
            <ResolvedValue token={`--shape-radius-${token}`} prop="border-radius" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ElevationScale() {
  return (
    <div className="sg-root">
      <div className="sg-elevation">
        {ELEVATION.map((e) => (
          <div key={e.name} className="sg-tile-wrap">
            <span className="sg-elevation-card" style={{ boxShadow: e.shadow }} />
            <span className="sg-row-title">{e.name}</span>
            <code className="sg-swatch-token">--color-shadow-elevation-{e.name}</code>
            <span className="sg-row-sub">{e.use}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The full styleguide in one block — used by the Customize preview. */
export function StyleguideSections() {
  return (
    <div className="sg-root">
      <h2 className="sg-h2">Background colors</h2>
      <BackgroundSwatches />
      <h2 className="sg-h2">Text colors</h2>
      <TextSwatches />
      <h2 className="sg-h2">Feedback colors</h2>
      <FeedbackSwatches />
      <h2 className="sg-h2">Chart colors</h2>
      <ChartSwatches />
      <h2 className="sg-h2">Typography</h2>
      <h3 className="sg-h3">Font scale</h3>
      <FontScale />
      <h3 className="sg-h3">Weights</h3>
      <FontWeights />
      <h2 className="sg-h2">Spacing</h2>
      <h3 className="sg-h3">Space (external)</h3>
      <SpaceScale />
      <h3 className="sg-h3">Padding (same scale)</h3>
      <InsetScale />
      <h2 className="sg-h2">Radius</h2>
      <RadiusScale />
      <h2 className="sg-h2">Elevation</h2>
      <ElevationScale />
    </div>
  );
}
