'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, Figma, FolderDown, Link2, Paintbrush, Plug, Plus, RotateCcw, Save, Sparkles, Star, Trash2 } from 'lucide-react';
import { Button, SegmentControl, Select, TextInput, Tooltip } from 'ds-ngr';
import { BrandSelect } from './BrandSelect';
import { HomeShowcase } from './HomeShowcase';
import { ScaleStrip } from './ScaleStrip';
import type { BrandChoice } from '@/lib/theme/brand-catalog';
import {
  CTA_MODES, DATAVIZ_MODES, DEFAULT_SETTINGS, defaultCta, FEEDBACK_MODES, FONTS, PRESETS, buildTheme, contrastChecks, decodeSettings, encodeSettings, fontHref, fontSamplesHref, previewScales, sampleStack,
  toCss, toDtcg, toMultiCss, toMultiDtcg, encodeBrands, decodeBrands, slugify,
  type Brand, type CtaMode, type DatavizMode, type FeedbackMode, type FontId, type NeutralMode, type ThemeSettings,
} from '@/lib/theme/theme';
import { EMPTY_BRAND_SET, THEME_CHANGE_EVENT, readBrands, writeBrands, type BrandSet } from '@/lib/theme/brands';
import { SURFACE_STYLES, type SurfaceStyle } from '@/lib/theme/styles';
import { DENSITIES, SHAPES, SHAPE_TABLE, type Density, type Shape } from '@/lib/theme/shape-density';
import { readSiteTheme, suspendSiteTheme, themeStyleCss, toSiteTheme, writeSiteTheme } from '@/lib/theme/site-theme';
import { figmaFileKey, toAppPrompt, toFigmaPrompt, type FigmaHandoffMode } from '@/lib/theme/figma-handoff';
import { DEFAULT_STARTER_NAME, STARTER_PAGES, toPackageName, type StarterPage } from '@/lib/starter/options';

const NEUTRALS: { value: NeutralMode; label: string; description: string }[] = [
  { value: 'default', label: 'Nagarro', description: 'The default violet-gray' },
  { value: 'gray', label: 'Gray', description: 'Pure gray, no tint' },
  { value: 'match', label: 'Brand-tinted', description: 'A hint of your brand hue' },
];
const EXPORTS = [
  { value: 'css', label: 'theme.css' },
  { value: 'json', label: 'Figma tokens' },
];

// Any list of colours as equal bands in the same 16px slot (feedback trio, first chart series).
function ColorStrip({ colors }: { colors: string[] }) {
  const step = 100 / colors.length;
  return (
    <span
      className="theme-preset-strip"
      style={{ background: `linear-gradient(90deg, ${colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(', ')})` }}
    />
  );
}

// Step 400 is where each ramp's signature hue sits (Nagarro's Sunset Pink, Mint
// Green and Vanilla Yellow), so the presets read as their actual colours.
const feedbackTrio = (f: ReturnType<typeof previewScales>['feedback']) => [f.red['400'], f.yellow['400'], f.green['400']];

// Sets each Typeface option's name in its own font. Select labels are plain
// strings, so this targets the options by position inside that one listbox.
const FONT_SAMPLES_CSS = FONTS.map(
  (f, i) => `[aria-label="Typeface options"] .dsn-select-option:nth-child(${i + 1}) .dsn-menu-cell-label{font-family:${sampleStack(f)}}`,
).join('');

const STYLE_ID = 'dsn-theme-preview';
const FONT_ID = 'dsn-theme-font';
const FONT_SAMPLES_ID = 'dsn-theme-font-samples';

function Swatches({ scale }: { scale: Record<string, string> }) {
  return (
    <div className="theme-scale-row">
      {Object.entries(scale).map(([step, hex]) => (
        <span key={step} className="theme-swatch" style={{ background: hex }} title={`${step} · ${hex}`} />
      ))}
    </div>
  );
}

// Primary button fill as it looks in light mode, in the same 16px slot.
function CtaChip({ color }: { color: string }) {
  return <span className="theme-preset-strip theme-cta-chip" style={{ background: color }} />;
}
const ctaFill = (cta: CtaMode, s: ThemeSettings) => {
  const sc = previewScales(buildTheme({ ...s, cta }));
  return cta === 'exact' ? `#${s.brand}` : cta === 'brand' ? sc.accent['600'] : sc.neutral['900'];
};

function FontSample({ stack }: { stack: string }) {
  return <span className="theme-sample theme-font-sample" style={{ fontFamily: stack }}>Aa</span>;
}

// Each look's ring and shadow on a small tile, exaggerated so four 12px tiles read apart.
// Tinted from the slot's text colour so the tiles stay visible in dark mode.
const tint = (pct: number) => `color-mix(in srgb, currentColor ${pct}%, transparent)`;
const SURFACE_SAMPLE: Record<SurfaceStyle, string> = {
  embossed: `inset 0 -2px 0 ${tint(15)}, 0 0 0 1px ${tint(35)}, 0 1px 2px ${tint(35)}`,
  flat: `0 0 0 1px ${tint(35)}`,
  outlined: `0 0 0 1.5px ${tint(90)}`,
  soft: `0 0 0 1px ${tint(10)}, 0 2px 5px ${tint(50)}`,
};
function SurfaceSample({ style }: { style: SurfaceStyle }) {
  return (
    <span className="theme-sample">
      <span className="theme-surface-tile" style={{ boxShadow: SURFACE_SAMPLE[style] }} />
    </span>
  );
}

// A top-left corner drawn at half the control radius (--shape-radius-control-md).
function ShapeSample({ shape }: { shape: Shape }) {
  const r = SHAPE_TABLE['--shape-radius-control-md'][shape] / 2;
  return (
    <svg className="theme-sample" viewBox="0 0 16 16" aria-hidden="true">
      <path d={`M2 15V${2 + r}${r ? `A${r} ${r} 0 0 1 ${2 + r} 2` : ''}H15`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Three rows whose gap scales with the density (×0.75 … ×1.5).
const DENSITY_GAP: Record<Density, number> = { compact: 1, default: 2, comfortable: 3, spacious: 4 };
function DensitySample({ density }: { density: Density }) {
  const g = DENSITY_GAP[density];
  const top = (16 - (6 + 2 * g)) / 2;
  return (
    <svg className="theme-sample" viewBox="0 0 16 16" aria-hidden="true">
      {[0, 1, 2].map((i) => <rect key={i} x="1" y={top + i * (2 + g)} width="14" height="2" rx="1" fill="currentColor" />)}
    </svg>
  );
}

function ContrastBadge({ failing }: { failing: number }) {
  return <span className={failing ? 'theme-badge fail' : 'theme-badge pass'}>{failing ? `${failing} below AA` : 'All pass'}</span>;
}

function CheckList({ checks }: { checks: ReturnType<typeof contrastChecks> }) {
  return (
    <ul className="theme-checks">
      {checks.map((c) => (
        <li key={c.label} className="theme-check">
          <span className="theme-check-sample" style={{ color: c.fg, background: c.bg }}>Aa</span>
          <span className="theme-check-label">{c.label}</span>
          <span className={c.ratio >= 4.5 ? 'theme-ratio pass' : 'theme-ratio fail'}>{c.ratio.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}

// Keeps a sidebar taller than the viewport in reach without giving it its own
// scrollbar: it moves with the page until its far edge shows, then sticks, in
// both directions. The page stays the only scroller. Its CSS `top` is the
// highest it may sit.
function useStickyPanel<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const GAP = 16;
    let maxTop = 0;
    let lastY = window.scrollY;
    let lastTop = el.getBoundingClientRect().top;
    const place = () => {
      const y = window.scrollY;
      const minTop = Math.min(maxTop, window.innerHeight - el.offsetHeight - GAP);
      const top = Math.max(minTop, Math.min(maxTop, lastTop - (y - lastY)));
      el.style.top = `${top}px`;
      lastY = y;
      lastTop = el.getBoundingClientRect().top;
    };
    const measure = () => {
      el.style.top = '';
      maxTop = parseFloat(getComputedStyle(el).top) || 0;
      place();
    };
    measure();
    const resize = new ResizeObserver(place);
    resize.observe(el);
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      resize.disconnect();
      window.removeEventListener('scroll', place);
      window.removeEventListener('resize', measure);
      el.style.top = '';
    };
  }, []);
  return ref;
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export function ThemeConfigurator() {
  const panelRef = useStickyPanel<HTMLElement>();
  const [s, setS] = useState<ThemeSettings>(DEFAULT_SETTINGS);
  const [hexDraft, setHexDraft] = useState(`#${DEFAULT_SETTINGS.brand}`);
  const [format, setFormat] = useState('css');
  const [copied, setCopied] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState('');
  // Query string of the theme applied to the whole site ('' = Nagarro, none applied).
  const [appliedQuery, setAppliedQuery] = useState('');
  // Saved brands for the multi-brand export, and the one open in the editor ('' = none).
  const [brandSet, setBrandSet] = useState<BrandSet>(EMPTY_BRAND_SET);
  const [activeSlug, setActiveSlug] = useState('');
  const [brandName, setBrandName] = useState('');
  const [scope, setScope] = useState<'one' | 'all'>('one');
  const [starterName, setStarterName] = useState(DEFAULT_STARTER_NAME);
  const [starterPage, setStarterPage] = useState<StarterPage>('dashboard');
  const [starterState, setStarterState] = useState<'idle' | 'busy' | 'error'>('idle');

  // Hydrate from the URL once (or, with no link, from the applied site theme),
  // then keep the URL in sync (shareable link). The sync waits for hydration
  // so it never overwrites an incoming link.
  // A ?brands= link replaces the saved set; with no other settings it opens the default brand.
  useEffect(() => {
    const applied = readSiteTheme()?.query ?? '';
    setAppliedQuery(applied);
    const params = new URLSearchParams(window.location.search);
    const linked = params.get('brands');
    params.delete('brands');
    const set = (linked && decodeBrands(linked)) || readBrands();
    if (linked && set.brands.length) writeBrands(set);
    setBrandSet(set);
    const own = params.toString();
    const opened = !own && linked ? set.brands.find((b) => b.slug === set.defaultSlug) : undefined;
    const initial = opened ? opened.settings : decodeSettings(own || (linked ? '' : applied));
    if (opened) setActiveSlug(opened.slug);
    setS(initial);
    setHexDraft(`#${initial.brand}`);
    setHydrated(true);
  }, []);
  const brandsParam = brandSet.brands.length ? encodeBrands(brandSet.brands, brandSet.defaultSlug) : '';
  const shareQuery = [encodeSettings(s), brandsParam && `brands=${brandsParam}`].filter(Boolean).join('&');
  useEffect(() => {
    if (!hydrated) return;
    window.history.replaceState(null, '', shareQuery ? `?${shareQuery}` : window.location.pathname);
  }, [shareQuery, hydrated]);

  const theme = useMemo(() => buildTheme(s), [s]);
  const checks = useMemo(() => contrastChecks(theme), [theme]);
  const scales = previewScales(theme);
  // Read the URL only after hydration so server and client render the same text.
  const shareUrl = hydrated ? `${window.location.origin}${window.location.pathname}${shareQuery ? `?${shareQuery}` : ''}` : '';
  const multi = scope === 'all' && brandSet.brands.length > 1;
  const tokens = multi ? toMultiDtcg(brandSet.brands, brandSet.defaultSlug) : toDtcg(theme);
  const output =
    format === 'css'
      ? multi ? toMultiCss(brandSet.brands, brandSet.defaultSlug, shareUrl) : toCss(theme, shareUrl)
      : JSON.stringify(tokens, null, 2);
  // The same starter from the terminal (cli/, served by scripts/build-cli-assets.mjs).
  const starterCommand = hydrated
    ? [
        `npx ${window.location.origin}/cli/ds-ngr-cli.tgz create ${toPackageName(starterName)}`,
        `--page ${starterPage}`,
        shareQuery && `--theme "${shareUrl}"`,
        multi && '--brands all',
      ].filter(Boolean).join(' ')
    : '';
  async function downloadStarter() {
    setStarterState('busy');
    const name = toPackageName(starterName);
    const q = new URLSearchParams(shareQuery);
    q.set('page', starterPage);
    q.set('name', name);
    if (multi) q.set('scope', 'all');
    try {
      const res = await fetch(`/api/starter?${q}`);
      if (!res.ok) throw new Error(String(res.status));
      const url = URL.createObjectURL(await res.blob());
      Object.assign(document.createElement('a'), { href: url, download: `${name}.zip` }).click();
      URL.revokeObjectURL(url);
      setStarterState('idle');
    } catch {
      setStarterState('error');
    }
  }
  const brandChecks = useMemo(
    () => brandSet.brands.map((b) => ({ brand: b, checks: contrastChecks(buildTheme(b.settings)) })),
    [brandSet],
  );

  // Semantic tokens resolve primitives on :root, so the preview overrides there
  // (doubled selector beats tokens.css) and cleans up when leaving the page.
  useEffect(() => {
    const css = themeStyleCss(theme);
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = Object.assign(document.createElement('style'), { id: STYLE_ID });
      document.head.appendChild(style);
    }
    style.textContent = css;

    const href = fontHref(theme);
    let link = document.getElementById(FONT_ID) as HTMLLinkElement | null;
    if (href && !link) {
      link = Object.assign(document.createElement('link'), { id: FONT_ID, rel: 'stylesheet' });
      document.head.appendChild(link);
    }
    if (link) {
      if (href) link.href = href;
      else link.remove();
    }
  }, [theme]);
  // The typeface menu previews every font, so load them all once (subset to their names).
  // The applied site theme steps aside while the preview is live, and returns on leave.
  useEffect(() => {
    suspendSiteTheme(true);
    const samples = Object.assign(document.createElement('link'), { id: FONT_SAMPLES_ID, rel: 'stylesheet', href: fontSamplesHref() });
    const sampleCss = Object.assign(document.createElement('style'), { textContent: FONT_SAMPLES_CSS });
    // Prepended: the subset shares family names with the full font in FONT_ID, and the later @font-face wins.
    document.head.prepend(samples);
    document.head.append(sampleCss);
    return () => {
      document.getElementById(STYLE_ID)?.remove();
      document.getElementById(FONT_ID)?.remove();
      samples.remove();
      sampleCss.remove();
      suspendSiteTheme(false);
    };
  }, []);

  const update = (patch: Partial<ThemeSettings>) => setS((prev) => ({ ...prev, ...patch }));
  const load = (next: ThemeSettings) => { setS(next); setHexDraft(`#${next.brand}`); };

  // A brand picked in the site header while this page is open: the preview owns
  // the page, so open that brand here too (or Nagarro) instead of showing nothing.
  const latest = useRef({ s, brandSet, appliedQuery });
  latest.current = { s, brandSet, appliedQuery };
  useEffect(() => {
    const onChange = () => {
      const applied = readSiteTheme()?.query ?? '';
      const prev = latest.current;
      if (applied === prev.appliedQuery) return;
      setAppliedQuery(applied);
      if (applied === encodeSettings(prev.s)) return;
      const builtIn = PRESETS.find((p) => encodeSettings(p.settings) === applied);
      if (builtIn) {
        setActiveSlug('');
        load(builtIn.settings);
        return;
      }
      const b = prev.brandSet.brands.find((x) => encodeSettings(x.settings) === applied);
      if (b) {
        setActiveSlug(b.slug);
        load(b.settings);
      } else if (!applied) {
        setActiveSlug('');
        load(DEFAULT_SETTINGS);
      } else {
        load(decodeSettings(applied));
      }
    };
    window.addEventListener(THEME_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  }, []);

  const activeBrand = brandSet.brands.find((b) => b.slug === activeSlug);
  const brandDirty = !!activeBrand && encodeSettings(activeBrand.settings) !== encodeSettings(s);
  const saveBrands = (next: BrandSet) => {
    const set = { ...next, defaultSlug: next.brands.some((b) => b.slug === next.defaultSlug) ? next.defaultSlug : (next.brands[0]?.slug ?? '') };
    setBrandSet(set);
    writeBrands(set);
    if (set.brands.length < 2) setScope('one');
  };
  const addBrand = () => {
    const name = brandName.trim().slice(0, 40);
    if (!name) return;
    const brand: Brand = { name, slug: slugify(name, brandSet.brands.map((b) => b.slug)), settings: s };
    saveBrands({ ...brandSet, brands: [...brandSet.brands, brand] });
    setActiveSlug(brand.slug);
    setBrandName('');
  };
  const openBrand = (slug: string) => {
    const b = brandSet.brands.find((x) => x.slug === slug);
    if (!b) return;
    setActiveSlug(b.slug);
    load(b.settings);
  };
  // The sidebar shows the open brand with its actions; a lone saved brand shows
  // even when closed, since the picker only appears with two or more.
  const shownBrand = activeBrand ?? (brandSet.brands.length === 1 ? brandSet.brands[0] : undefined);
  const updateBrand = () =>
    saveBrands({ ...brandSet, brands: brandSet.brands.map((b) => (b.slug === activeSlug ? { ...b, settings: s } : b)) });
  const removeBrand = () => {
    saveBrands({ ...brandSet, brands: brandSet.brands.filter((b) => b.slug !== activeSlug) });
    setActiveSlug('');
  };
  const setBrand = (value: string) => {
    setHexDraft(value);
    const hex = value.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return;
    const next = hex.toUpperCase();
    // A CTA still on the old brand's default follows the new brand's default.
    update(s.cta === defaultCta(s.brand) ? { brand: next, cta: defaultCta(next) } : { brand: next });
  };
  const flash = (what: string) => {
    setCopied(what);
    window.setTimeout(() => setCopied(null), 1500);
  };
  const query = encodeSettings(s);
  const isApplied = hydrated && query === appliedQuery;
  // Applying the Nagarro default clears the saved theme instead of storing an empty one.
  const applyToSite = () => {
    writeSiteTheme(query ? toSiteTheme(theme, query) : null);
    setAppliedQuery(query);
  };
  const failing = checks.filter((c) => c.ratio < 4.5);
  const figmaValid = figmaFileKey(figmaUrl) !== null;
  const copyFigmaPrompt = (mode: FigmaHandoffMode) =>
    navigator.clipboard
      .writeText(toFigmaPrompt({ mode, figmaUrl, tokens }))
      .then(() => flash(mode));
  const pickBrand = (choice: BrandChoice) => {
    load(choice.settings);
    writeSiteTheme(toSiteTheme(buildTheme(choice.settings), choice.query));
    setAppliedQuery(choice.query);
    setActiveSlug('');
  };
  const copyExportPrompt = () =>
    navigator.clipboard
      .writeText(
        format === 'css'
          ? toAppPrompt({ css: output, shareUrl, brands: multi ? brandSet.brands.map((b) => b.slug) : undefined })
          : toFigmaPrompt({ mode: 'apply', figmaUrl: figmaValid ? figmaUrl : undefined, tokens }),
      )
      .then(() => flash('prompt'));

  return (
    <div className="theme-layout">
      <aside ref={panelRef} className="theme-panel" aria-label="Theme settings">
        <section className="theme-group">
          <h2 className="theme-group-title">Brands</h2>
          <BrandSelect brandSet={brandSet} appliedQuery={appliedQuery} previewSettings={s} onPick={pickBrand} />
        </section>

        <section className="theme-group">
          {/* TextInput's icon slot is aria-hidden, so the swatch there is a label for the
              native picker, which stays focusable beside it (keyboard + screen readers). */}
          <div className="theme-color-field">
            <TextInput
              label="Brand"
              value={hexDraft}
              onChange={(e) => setBrand(e.target.value)}
              error={!/^#?[0-9a-fA-F]{6}$/.test(hexDraft)}
              errorMessage="Use a 6-digit hex, e.g. #0F766E"
              leadingIcon={
                <label htmlFor="theme-brand-picker" className="theme-color-swatch" style={{ background: `#${s.brand}` }} />
              }
            />
            <input
              id="theme-brand-picker"
              type="color"
              className="theme-color-input"
              aria-label="Pick brand color"
              value={`#${s.brand.toLowerCase()}`}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>
          <Swatches scale={scales.accent} />
        </section>

        <section className="theme-group">
          <Select
            label="Neutrals"
            options={NEUTRALS.map((n) => ({
              ...n,
              icon: <ScaleStrip scale={previewScales(buildTheme({ ...s, neutral: n.value })).neutral} />,
            }))}
            value={s.neutral}
            icon
            leadingIcon={<ScaleStrip scale={scales.neutral} />}
            onChange={(neutral: string) => update({ neutral: neutral as NeutralMode })}
          />
          <Swatches scale={scales.neutral} />
        </section>

        <section className="theme-group">
          <Select
            label="Feedback colors"
            options={FEEDBACK_MODES.map((f) => ({
              ...f,
              icon: <ColorStrip colors={feedbackTrio(previewScales(buildTheme({ ...s, feedback: f.value })).feedback)} />,
            }))}
            value={s.feedback}
            icon
            leadingIcon={<ColorStrip colors={feedbackTrio(scales.feedback)} />}
            onChange={(feedback: string) => update({ feedback: feedback as FeedbackMode })}
          />
        </section>

        <section className="theme-group">
          <Select
            label="Chart colors"
            options={DATAVIZ_MODES.map((d) => ({
              ...d,
              icon: <ColorStrip colors={previewScales(buildTheme({ ...s, dataviz: d.value })).dataviz.light.slice(0, 3)} />,
            }))}
            value={s.dataviz}
            icon
            leadingIcon={<ColorStrip colors={scales.dataviz.light.slice(0, 3)} />}
            onChange={(dataviz: string) => update({ dataviz: dataviz as DatavizMode })}
          />
          {s.dataviz === 'shades' && <p className="theme-note">Shades of one hue stay distinct for about 4 series. Use Brand-led for more.</p>}
        </section>

        <section className="theme-group">
          <h2 className="theme-group-title">Primary button</h2>
          <Select
            aria-label="Primary button color"
            options={CTA_MODES.map(({ value, label, hint }) => ({ value, label, description: hint, icon: <CtaChip color={ctaFill(value, s)} /> }))}
            value={s.cta}
            icon
            leadingIcon={<CtaChip color={ctaFill(s.cta, s)} />}
            onChange={(cta: string) => update({ cta: cta as CtaMode })}
          />
        </section>

        <section className="theme-group">
          <h2 className="theme-group-title">Typeface</h2>
          <Select
            aria-label="Typeface"
            options={FONTS.map((f) => ({ value: f.id, label: f.label, description: f.note, icon: <FontSample stack={sampleStack(f)} /> }))}
            value={s.font}
            icon
            leadingIcon={<FontSample stack={sampleStack(theme.font)} />}
            onChange={(font) => update({ font: font as FontId })}
          />
          {s.font === 'default' && <p className="theme-note">Equip is licensed for Nagarro use only.</p>}
        </section>

        <section className="theme-group">
          <h2 className="theme-group-title">Surface style</h2>
          <Select
            aria-label="Surface style"
            options={SURFACE_STYLES.map(({ value, label, hint }) => ({ value, label, description: hint, icon: <SurfaceSample style={value} /> }))}
            value={s.style}
            icon
            leadingIcon={<SurfaceSample style={s.style} />}
            onChange={(style: string) => update({ style: style as SurfaceStyle })}
          />
          {s.style !== 'embossed' && <p className="theme-note">Prototype — pending the Figma effects Style mode.</p>}
        </section>

        <section className="theme-group">
          <h2 className="theme-group-title">Roundness</h2>
          <Select
            aria-label="Roundness"
            options={SHAPES.map(({ value, label, hint }) => ({ value, label, description: hint, icon: <ShapeSample shape={value} /> }))}
            value={s.shape}
            icon
            leadingIcon={<ShapeSample shape={s.shape} />}
            onChange={(shape: string) => update({ shape: shape as Shape })}
          />
        </section>

        <section className="theme-group">
          <h2 className="theme-group-title">Density</h2>
          <Select
            aria-label="Density"
            options={DENSITIES.map(({ value, label, hint }) => ({ value, label, description: hint, icon: <DensitySample density={value} /> }))}
            value={s.density}
            icon
            leadingIcon={<DensitySample density={s.density} />}
            onChange={(density: string) => update({ density: density as Density })}
          />
        </section>

        <section className="theme-group">
          <Button
            variant="primary"
            disabled={isApplied}
            showLeadingIcon
            leadingIcon={isApplied ? <Check size={16} aria-hidden /> : <Paintbrush size={16} aria-hidden />}
            onClick={applyToSite}
          >
            {isApplied ? 'Applied to site' : 'Apply to site'}
          </Button>
        </section>

        {encodeSettings(s) !== encodeSettings(DEFAULT_SETTINGS) && (
          <Button
            variant="ghost"
            showLeadingIcon
            leadingIcon={<RotateCcw size={16} aria-hidden />}
            onClick={() => load(DEFAULT_SETTINGS)}
          >
            Reset to Nagarro
          </Button>
        )}

        <section className="theme-group">
          <h2 className="theme-group-title">Saved for export</h2>
          <p className="theme-note">Name the current settings to ship several brands in one theme file.</p>
          {shownBrand && (
            <div className="theme-brand-row">
              <span className="theme-brand-current">
                <ScaleStrip scale={previewScales(buildTheme(shownBrand.settings)).accent} />
                {shownBrand.name}
              </span>
              {activeBrand ? (
                <div className="theme-brand-actions">
                  {brandDirty && (
                    <Tooltip content={`Update ${activeBrand.name}`}>
                      <Button variant="primary" showLabel={false} showLeadingIcon leadingIcon={<Save size={16} aria-hidden />} aria-label={`Update ${activeBrand.name}`} onClick={updateBrand} />
                    </Tooltip>
                  )}
                  {brandSet.defaultSlug !== activeBrand.slug && (
                    <Tooltip content="Make default">
                      <Button variant="ghost" showLabel={false} showLeadingIcon leadingIcon={<Star size={16} aria-hidden />} aria-label="Make default" onClick={() => saveBrands({ ...brandSet, defaultSlug: activeBrand.slug })} />
                    </Tooltip>
                  )}
                  <Tooltip content="Remove">
                    <Button variant="ghost" showLabel={false} showLeadingIcon leadingIcon={<Trash2 size={16} aria-hidden />} aria-label="Remove" onClick={removeBrand} />
                  </Tooltip>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => openBrand(shownBrand.slug)}>Open</Button>
              )}
            </div>
          )}
          <form className="theme-brand-add" onSubmit={(e) => { e.preventDefault(); addBrand(); }}>
            <TextInput
              label="Save current settings as"
              placeholder="Brand name, e.g. Acme Retail"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
            <Button type="submit" variant="secondary" disabled={!brandName.trim()} showLeadingIcon leadingIcon={<Plus size={16} aria-hidden />}>
              Add
            </Button>
          </form>
        </section>
      </aside>

      <div className="theme-main">
        <HomeShowcase
          withStyleguide
          controls={brandSet.brands.length > 1 && (
            <Select
              className="theme-brand-picker"
              aria-label="Saved brands"
              placeholder="Open a saved brand"
              options={brandSet.brands.map((b) => ({
                value: b.slug,
                label: b.name,
                description: `${b.slug === brandSet.defaultSlug ? 'Default · ' : ''}data-brand="${b.slug}"`,
                icon: <ScaleStrip scale={previewScales(buildTheme(b.settings)).accent} />,
              }))}
              value={activeSlug}
              icon
              leadingIcon={<ScaleStrip scale={activeBrand ? previewScales(buildTheme(activeBrand.settings)).accent : scales.accent} />}
              onChange={openBrand}
            />
          )}
        />

        <section className="theme-card" aria-labelledby="theme-contrast">
          <div className="theme-card-head">
            <h2 id="theme-contrast" className="theme-group-title">Contrast (WCAG AA ≥ 4.5){multi && ' · all brands'}</h2>
            <ContrastBadge
              failing={multi ? brandChecks.reduce((n, b) => n + b.checks.filter((c) => c.ratio < 4.5).length, 0) : failing.length}
            />
          </div>
          {multi ? (
            <div className="theme-brand-checks">
              {brandChecks.map(({ brand, checks: bc }) => (
                <details key={brand.slug} className="theme-brand-check">
                  <summary>
                    <ScaleStrip scale={previewScales(buildTheme(brand.settings)).accent} />
                    <span className="theme-brand-check-name">{brand.name}</span>
                    <ContrastBadge failing={bc.filter((c) => c.ratio < 4.5).length} />
                  </summary>
                  <CheckList checks={bc} />
                </details>
              ))}
            </div>
          ) : (
            <CheckList checks={checks} />
          )}
        </section>

        <section className="theme-card" aria-labelledby="theme-export">
          <div className="theme-card-head">
            <h2 id="theme-export" className="theme-group-title">Export</h2>
            <div className="theme-actions">
              {brandSet.brands.length > 1 && (
                <SegmentControl
                  aria-label="Export scope"
                  fullWidth={false}
                  options={[{ value: 'one', label: 'This brand' }, { value: 'all', label: `All brands (${brandSet.brands.length})` }]}
                  value={scope}
                  onChange={(v: string) => setScope(v as 'one' | 'all')}
                />
              )}
              <SegmentControl aria-label="Export format" fullWidth={false} options={EXPORTS} value={format} onChange={setFormat} />
            </div>
          </div>
          <pre className="theme-code"><code>{output}</code></pre>
          <div className="theme-actions">
            <Button
              variant="primary"
              showLeadingIcon
              leadingIcon={<Copy size={16} />}
              onClick={() => navigator.clipboard.writeText(output).then(() => flash('code'))}
            >
              {copied === 'code' ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="secondary"
              showLeadingIcon
              leadingIcon={<Sparkles size={16} />}
              onClick={copyExportPrompt}
            >
              {copied === 'prompt' ? 'Copied' : 'Copy prompt'}
            </Button>
            <Button
              variant="secondary"
              showLeadingIcon
              leadingIcon={<Download size={16} />}
              onClick={() =>
                format === 'css'
                  ? download(multi ? 'themes.css' : 'theme.css', output, 'text/css')
                  : download(multi ? 'themes.tokens.json' : 'theme.tokens.json', output, 'application/json')
              }
            >
              Download
            </Button>
            <Button
              variant="ghost"
              showLeadingIcon
              leadingIcon={<Link2 size={16} />}
              onClick={() => navigator.clipboard.writeText(shareUrl).then(() => flash('link'))}
            >
              {copied === 'link' ? 'Link copied' : 'Copy share link'}
            </Button>
            <Button
              variant="ghost"
              showLeadingIcon
              leadingIcon={<Plug size={16} />}
              onClick={() => window.location.assign(`/prototype/mcp?theme=${encodeURIComponent(multi ? `brands=${brandsParam}` : encodeSettings(s))}`)}
            >
              Connect your AI
            </Button>
          </div>
          <p className="theme-note">
            {format === 'css'
              ? multi
                ? 'Load themes.css after tokens.css and set data-brand on <html> to switch brands. A brand can’t cover only part of a page: semantic tokens resolve on the root.'
                : 'Load theme.css after tokens.css in the client app, or Copy prompt and paste it into Claude Code or Cursor in your app repo. It only re-values existing tokens, so light and dark mode both follow.'
              : multi
                ? 'Each brand becomes a mode of the primitive and typography collections in Figma. Copy prompt and paste it into an agent with a Figma MCP.'
                : 'Copy prompt and paste it into an agent with a Figma MCP, or use Send to Figma below to set the target file.'}
          </p>
        </section>

        <section className="theme-card" aria-labelledby="theme-starter">
          <div className="theme-card-head">
            <h2 id="theme-starter" className="theme-group-title">Starter pack</h2>
          </div>
          <p className="theme-note">
            A ready-to-run React + Vite app on DS-Ngr with {multi ? `all ${brandSet.brands.length} brands` : 'this theme'} applied, the library included, and CLAUDE.md / AGENTS.md for AI agents.
          </p>
          <div className="theme-starter-fields">
            <TextInput
              label="App name"
              value={starterName}
              onChange={(e) => setStarterName(e.target.value)}
              onBlur={() => setStarterName(toPackageName(starterName))}
              helperText="Used for the folder and package name."
            />
            <Select
              label="Starting page"
              options={STARTER_PAGES.map(({ value, label, description }) => ({ value, label, description }))}
              value={starterPage}
              onChange={(v: string) => setStarterPage(v as StarterPage)}
            />
          </div>
          <div className="theme-actions">
            <Button
              variant="primary"
              showLeadingIcon
              leadingIcon={<FolderDown size={16} />}
              loading={starterState === 'busy'}
              disabled={!hydrated}
              onClick={downloadStarter}
            >
              Download starter (.zip)
            </Button>
            <Button
              variant="secondary"
              showLeadingIcon
              leadingIcon={<Copy size={16} />}
              disabled={!hydrated}
              onClick={() => navigator.clipboard.writeText(starterCommand).then(() => flash('cli'))}
            >
              {copied === 'cli' ? 'Copied' : 'Copy CLI command'}
            </Button>
          </div>
          {starterState === 'error' ? (
            <p className="theme-note" role="alert">The starter pack couldn’t be generated. Try again, or download theme.css above.</p>
          ) : (
            <ol className="theme-steps">
              <li>Unzip it and open the folder in your IDE.</li>
              <li>Run <code>npm install</code>, then <code>npm run dev</code>.</li>
              <li>Build on it with your AI agent — it already knows the design system rules.</li>
              <li>
                Prefer the terminal? <em>Copy CLI command</em> creates the same app in one step — see <a href={`/prototype/cli${shareQuery ? `?theme=${encodeURIComponent(shareQuery)}` : ''}`}>Build with the CLI</a>.
              </li>
            </ol>
          )}
        </section>

        <section className="theme-card" aria-labelledby="theme-figma">
          <div className="theme-card-head">
            <h2 id="theme-figma" className="theme-group-title">Send to Figma</h2>
          </div>
          <TextInput
            label="Figma file URL"
            placeholder="https://www.figma.com/design/…"
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
            error={figmaUrl !== '' && !figmaValid}
            errorMessage="Paste a figma.com/design/… or figma.com/file/… link"
            helperText="Use a duplicate or branch of your file, not the main DS library."
          />
          <div className="theme-actions">
            <Button
              variant="secondary"
              disabled={!figmaValid}
              showLeadingIcon
              leadingIcon={<Copy size={16} />}
              onClick={() => copyFigmaPrompt('check')}
            >
              {copied === 'check' ? 'Copied' : 'Copy parity check'}
            </Button>
            <Button
              variant="primary"
              disabled={!figmaValid}
              showLeadingIcon
              leadingIcon={<Figma size={16} />}
              onClick={() => copyFigmaPrompt('apply')}
            >
              {copied === 'apply' ? 'Copied' : 'Copy apply prompt'}
            </Button>
          </div>
          <ol className="theme-steps">
            <li>Open Claude Code or Cursor with a Figma MCP connected (official Figma or figma-console).</li>
            <li>Paste the prompt. The parity check only reads; the apply prompt shows a diff first.</li>
            <li>Review the diff, approve, then check the file. Variables are matched by name and never deleted.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
