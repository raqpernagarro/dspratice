// Illustrative tile art for the Guides index — the guide-page counterpart of
// ComponentPreview. Pure markup on DS tokens, so every tile follows the theme.

// SVG marks rather than ✓/✕ glyphs — font glyphs sit off-centre in a circle.
const Check = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 5.25 4.1 7.3 8 2.9" /></svg>
);
const Cross = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M2.75 2.75l4.5 4.5M7.25 2.75l-4.5 4.5" /></svg>
);

const RULES: [ok: boolean, width: string][] = [[true, 'w70'], [true, 'w55'], [false, 'w62'], [true, 'w45']];

const AiRules = () => (
  <div className="gv-doc">
    <span className="gv-doc-file">AI.md</span>
    {RULES.map(([ok, w], i) => (
      <div key={i} className={`gv-rule ${ok ? 'ok' : 'no'}`}>
        <span className="gv-mark">{ok ? <Check /> : <Cross />}</span>
        <span className={`gv-line ${w}`} />
      </div>
    ))}
  </div>
);

const AiShort = () => (
  <div className="gv-prompt">
    <div className="gv-prompt-bar">
      <span className="gv-dot" /><span className="gv-dot" /><span className="gv-dot" />
      <span className="gv-copy">Copy</span>
    </div>
    <span className="gv-line w80" />
    <span className="gv-line w60" />
    <span className="gv-line w70" />
    <span className="gv-caret">Paste into any AI tool▍</span>
  </div>
);

// One value traced through the three layers: raw scale → semantic role → component.
const Foundations = () => (
  <div className="gv-chain">
    <div className="gv-tier t3">
      <span className="gv-tier-label">Component</span>
      <span className="gv-tier-body"><span className="gv-btn">Button</span></span>
    </div>
    <div className="gv-tier t2">
      <span className="gv-tier-label">Semantic</span>
      <span className="gv-tier-body"><code className="gv-token"><i />bg.primary</code></span>
    </div>
    <div className="gv-tier t1">
      <span className="gv-tier-label">Primitive</span>
      <span className="gv-tier-body gv-ramp">
        {[1, 2, 3, 4, 5, 6].map((n) => <i key={n} className={n === 5 ? 'on' : undefined} />)}
      </span>
    </div>
  </div>
);

const SWATCHES = [
  '--color-background-interactive-primary-default',
  '--tag-foreground-progress',
  '--color-foreground-success-strong',
  '--color-foreground-warning-strong',
  '--color-foreground-error-strong',
  '--color-background-inverse-primary',
];

const Colour = () => (
  <div className="gv-swatches">
    {SWATCHES.map((t) => (
      <span key={t} className="gv-swatch" style={{ background: `var(${t})` }} />
    ))}
  </div>
);

const Typography = () => (
  <div className="gv-type">
    <span className="gv-type-hero">Aa</span>
    <div className="gv-type-scale">
      <span className="gv-type-display">Display</span>
      <span className="gv-type-heading">Heading</span>
      <span className="gv-type-body">Body text</span>
    </div>
  </div>
);

const SPACES = [4, 8, 12, 16, 24, 32];

const Spacing = () => (
  <div className="gv-spacing">
    {SPACES.map((s) => (
      <div key={s} className="gv-space-row">
        <span className="gv-space-label">{s}</span>
        <span className="gv-space-bar" style={{ width: s * 4 }} />
      </div>
    ))}
  </div>
);

const FigmaSync = () => (
  <div className="gv-sync">
    <div className="gv-node">
      <span className="gv-node-icon figma">
        <i /><i /><i /><i /><i />
      </span>
      Figma
    </div>
    <div className="gv-arrows">
      <span className="gv-arrow"><svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5h19M16 1l4 4-4 4" /></svg></span>
      <span className="gv-arrow back"><svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5h19M16 1l4 4-4 4" /></svg></span>
    </div>
    <div className="gv-node">
      <span className="gv-node-icon code">{'</>'}</span>
      Code
    </div>
  </div>
);

const ART: Record<string, () => React.JSX.Element> = {
  'ai-rules': AiRules,
  'ai-short': AiShort,
  foundations: Foundations,
  colors: Colour,
  typography: Typography,
  spacing: Spacing,
  'figma-sync': FigmaSync,
};

export function GuidePreview({ slug, title }: { slug: string; title: string }) {
  const Art = ART[slug];
  return Art ? <Art /> : <span className="pv-fallback">{title.charAt(0)}</span>;
}
