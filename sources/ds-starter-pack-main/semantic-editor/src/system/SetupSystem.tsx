import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  CircleHalf,
  DownloadSimple,
  LinkSimple,
  Moon,
  Sun,
  FigmaLogo,
  PaintBrush,
  Plus,
  Square,
  Stack,
  X,
  RocketLaunch,
  Sparkle,
  SlidersHorizontal,
} from '@phosphor-icons/react'
import { useEffect, useId, useMemo, useState, type ReactNode } from 'react'

import { makeProjectFile, projectFileName, versionAfter, type AppTypeId, type ProjectFile, type ProjectInfo } from '../../../stories/base-ui/tokens/project-file'
import { THEME_PRESETS } from '../agent/presets'
import { applyProposal } from '../agent/themeAgent'
import { APP_TYPES, appType, figmaFileKey, githubRepo } from '../app/appTypes'
import { useApp, useProject } from '../app/AppContext'
import { download } from '../app/download'
import { useShell } from '../app/ShellContext'
import { ConfigureView } from '../configure/ConfigureView'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { buildChangeSet, changeSetSummary } from '../exchange/changeset'
import {
  APPEARANCES,
  BRAND_GROUPS,
  groupOf,
  isSeparate,
  MODE_NAMES,
  type Appearance,
  type BrandGroup,
  type BrandOwn,
  type ThemeConfig,
} from '../../../stories/base-ui/tokens/theme-config'
import { AppTypeThumb, BrandsPreview, FigmaIllustration, GitHubIllustration, ModesPreview, PluginIllustration, SitePreview } from './illustrations'
import { canWriteRepo, isStarter } from './mode'
import { shipToRepo } from './ship'

const TEMPLATE_REPO = 'https://github.com/nagarro-dv/ds-starter-pack'

type StartMode = 'defaults' | 'describe' | 'preset'

type StepId = 'name' | 'brands' | 'type' | 'modes' | 'start' | 'look' | 'review' | 'code' | 'design' | 'figma'
type ModesChoice = 'both' | 'light' | 'dark'

/** A brand as the Brands step edits it. The first one is the main brand. */
interface BrandRow {
  id: string
  name: string
  description: string
  appType: AppTypeId
}

interface Step {
  /** Unique per step (look and review steps repeat per brand). */
  key: string
  id: StepId
  title: string
  /** For look and review steps of a multi-brand system: which brand (0 = main). */
  brand?: number
}

/**
 * The steps, built from the system's shape. Several brands replace the Product step (each brand has
 * its own) and get a Look step each; a second mode adds a step per brand, to check it when it
 * follows the first or to style it when it has its own colors. Choices change the list straight away.
 */
const GROUP_LABEL: Record<BrandGroup, string> = { colors: 'colors', fonts: 'fonts', shape: 'shape' }
const listOf = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0] ?? '')

function stepsFor(modes: Appearance[], secondSeparate: boolean, brands: BrandRow[] | null, differs: BrandGroup[]): Step[] {
  const [base, other] = modes
  const looks = (brands ?? [null]).flatMap((b, i): Step[] => {
    // Another brand only gets steps for what it owns; with nothing of its own it simply follows.
    if (b && i > 0) {
      if (!differs.length) return []
      const who = `${b.name.trim() || `Brand ${i + 1}`}: `
      return [
        { key: `look-${i}`, id: 'look', title: `${who}${listOf(differs.map((g) => GROUP_LABEL[g]))}`, brand: i },
        ...(other && differs.includes('colors') ? [{ key: `review-${i}`, id: 'review' as const, title: `${who}${MODE_NAMES[other].toLowerCase()}`, brand: i }] : []),
      ]
    }
    const who = b ? `${b.name.trim() || `Brand ${i + 1}`}: ` : ''
    const lookTitle = other ? `${who}${MODE_NAMES[base].toLowerCase()}` : b ? who.slice(0, -2) : 'Look'
    return [
      { key: `look-${i}`, id: 'look', title: b ? lookTitle : other ? `${MODE_NAMES[base]} look` : 'Look', brand: b ? i : undefined },
      ...(other
        ? [
            {
              key: `review-${i}`,
              id: 'review' as const,
              title: b
                ? `${who}${secondSeparate ? MODE_NAMES[other].toLowerCase() : `check ${MODE_NAMES[other].toLowerCase()}`}`
                : secondSeparate
                ? `${MODE_NAMES[other]} look`
                : `Check ${MODE_NAMES[other].toLowerCase()}`,
              brand: b ? i : undefined,
            },
          ]
        : []),
    ]
  })
  return [
    { key: 'name', id: 'name', title: 'Name it' },
    { key: 'brands', id: 'brands', title: 'Brands' },
    ...(brands ? [] : [{ key: 'type', id: 'type' as const, title: 'Product' }]),
    { key: 'modes', id: 'modes', title: 'Modes' },
    { key: 'start', id: 'start', title: 'Starting point' },
    ...looks,
    { key: 'code', id: 'code', title: 'Code' },
    { key: 'design', id: 'design', title: 'Figma file' },
    { key: 'figma', id: 'figma', title: 'Export to Figma' },
  ]
}

const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'brand'

const modesFor = (choice: ModesChoice, base: Appearance): Appearance[] => (choice === 'both' ? (base === 'dark' ? ['dark', 'light'] : ['light', 'dark']) : [choice])

function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="wiz-field">
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {hint ? <p className="wiz-hint">{hint}</p> : null}
    </div>
  )
}

const DEFAULT_NAME = 'Your design system'

/**
 * "Set up system": what the system is for, how it starts and how it looks, as short screens with a
 * picture of what to do. The Look step is the full theme editor. The last step exports the theme to
 * Figma (the download is required, with where to import it), then saves the next version and opens
 * the site on its docs, styled as the new system.
 * Later this is where component selection, briefings and mirroring an existing Figma file belong.
 */
export function SetupSystem({ saved, onCannotShip }: { saved: ProjectFile; onCannotShip: () => void }) {
  const { doc, update } = useProject()
  const { agent, setSettingsOpen } = useApp()
  const starter = isStarter()
  const version = versionAfter(saved.versions)
  const [writable, setWritable] = useState<boolean | null>(null)
  const [shipping, setShipping] = useState(false)
  const [shipError, setShipError] = useState('')
  useEffect(() => {
    canWriteRepo().then(setWritable)
  }, [])
  const { theme, patchTheme, replaceTheme, updateTheme } = useSemanticEditor()
  const { agentOpen, setAgentOpen } = useShell()
  const [info, setInfo] = useState<ProjectInfo>(doc.info)
  const [modesChoice, setModesChoice] = useState<ModesChoice>(theme.modes.length > 1 ? 'both' : theme.modes[0])
  const [modesBase, setModesBase] = useState<Appearance>(theme.modes[0])
  const modes = modesFor(modesChoice, modesBase)
  const [secondSeparate, setSecondSeparate] = useState(theme.modes.length > 1 && isSeparate({ ...theme, brand: null }, theme.modes[1]))
  const [multi, setMulti] = useState(theme.brands.length > 1)
  const [rows, setRows] = useState<BrandRow[]>(() =>
    theme.brands.length > 1
      ? theme.brands.map((b) => ({ id: b.id, name: b.name, description: b.description, appType: b.appType as AppTypeId }))
      : [
          { id: 'new-1', name: doc.info.name, description: doc.info.description, appType: doc.info.appType },
          { id: 'new-2', name: '', description: '', appType: doc.info.appType },
        ]
  )
  const patchRow = (i: number, p: Partial<BrandRow>) => setRows((list) => list.map((r, k) => (k === i ? { ...r, ...p } : r)))
  // What the other brands have of their own; everything else follows the main brand.
  const [differs, setDiffers] = useState<BrandGroup[]>(() => {
    const owned = BRAND_GROUPS.filter((g) => theme.brands.slice(1).some((b) => b.own?.[g]))
    return theme.brands.length > 1 ? owned : ['colors']
  })
  // Brands made in this run start from the main brand as it is when you reach their step.
  const [fresh, setFresh] = useState<Set<string>>(() => new Set())
  const PAGES = stepsFor(modes, modes.length > 1 && secondSeparate, multi ? rows : null, differs)
  const [page, setPage] = useState(Math.min(doc.setupStep, PAGES.length - 1))
  const [mode, setMode] = useState<StartMode>(doc.pendingPrompt ? 'describe' : 'defaults')
  const [brief, setBrief] = useState(doc.pendingPrompt ?? '')
  const [preset, setPreset] = useState<string | null>(null)
  const patch = (p: Partial<ProjectInfo>) => setInfo((i) => ({ ...i, ...p }))

  const repo = githubRepo(info.githubUrl)
  const fileKey = figmaFileKey(info.figmaUrl)
  const githubInvalid = info.githubUrl.trim() !== '' && !repo
  const figmaInvalid = info.figmaUrl.trim() !== '' && !fileKey
  const names = rows.map((r) => r.name.trim().toLowerCase())
  const brandsInvalid = multi && (names.some((n) => !n) || new Set(names).size !== names.length)
  const blocked = (PAGES[page].id === 'code' && githubInvalid) || (PAGES[page].id === 'design' && figmaInvalid) || (PAGES[page].id === 'brands' && brandsInvalid)

  const describing = mode === 'describe' && brief.trim() !== ''
  // The starting point is applied once when you move on from it; going back and forth keeps your edits.
  const startKey = mode === 'preset' ? `preset:${preset}` : describing ? `describe:${brief.trim()}` : 'defaults'
  const [appliedStart, setAppliedStart] = useState('defaults')

  const applyStart = (name: string) => {
    if (startKey === appliedStart) return false
    setAppliedStart(startKey)
    const p = mode === 'preset' && preset ? THEME_PRESETS.find((x) => x.id === preset) : undefined
    if (p) {
      // A starting point sets every brand and mode: brands and modes with their own colors start from it too.
      const next = { ...applyProposal({ ...theme, appearance: theme.modes[0], brand: null }, p.proposal), name }
      const separate = Object.fromEntries(Object.keys(next.separate).map((m) => [m, { color: structuredClone(next.color), depth: next.depth }]))
      const seeded = { ...next, separate }
      // Brands follow the main brand anyway; what they own starts from the new look too.
      const reseed = (own: BrandOwn | null): BrandOwn | null => (own ? Object.fromEntries(Object.keys(own).map((g) => [g, groupOf(seeded, g as BrandGroup)])) : own)
      replaceTheme({ ...seeded, brands: seeded.brands.map((b, i) => (i === 0 ? b : { ...b, own: reseed(b.own) })) })
    }
    if (describing) {
      update({ pendingPrompt: brief.trim() })
      return true
    }
    return false
  }

  const commit = (next: number) => {
    const clean = { ...info, name: info.name.trim() || DEFAULT_NAME }
    setInfo(clean)
    update({ info: clean, setupStep: next })
    if (clean.name !== theme.name) patchTheme({ name: clean.name })
    const described = PAGES[page].id === 'start' && next > page ? applyStart(clean.name) : false
    const step = PAGES[next]
    const to = step.id
    if (PAGES[page].id === 'brands') {
      // The system's brands: the first is the main brand; a new brand starts as a copy of it.
      const taken = new Set<string>()
      const final = rows.map((r) => {
        let id = r.id.startsWith('new-') ? slugify(r.name) : r.id
        for (let n = 2; taken.has(id); n++) id = `${slugify(r.name)}-${n}`
        taken.add(id)
        return { ...r, id, name: r.name.trim(), description: r.description.trim() }
      })
      setRows(final)
      setFresh((set) => new Set([...set, ...final.filter((r, i) => i > 0 && !theme.brands.some((b) => b.id === r.id)).map((r) => r.id)]))
      if (multi) {
        const main = { ...clean, description: final[0].description || clean.description, appType: final[0].appType }
        setInfo(main)
        update({ info: main })
      }
      updateTheme((prev) => {
        if (!multi) return { ...prev, brands: [], brand: null }
        const brands = final.map((r, i) => {
          if (i === 0) return { ...r, own: null }
          const was = prev.brands.find((b) => b.id === r.id)?.own ?? {}
          const own: BrandOwn = {}
          for (const g of differs) own[g] = (was[g] ?? groupOf(prev, g)) as never
          return { ...r, own }
        })
        return { ...prev, brands, brand: null }
      })
    }
    if (PAGES[page].id === 'modes') {
      // The system's modes, and whether the second one has its own colors (for every brand).
      const [, second] = modes
      const own = (x: { color: ThemeConfig['color']; separate: ThemeConfig['separate'] }, depth: number | null): ThemeConfig['separate'] =>
        second && secondSeparate ? { [second]: x.separate[second] ?? { color: structuredClone(x.color), depth } } : {}
      updateTheme((prev) => ({
        ...prev,
        modes,
        appearance: modes[0],
        separate: own(prev, prev.depth),
        brands: prev.brands.map((b) =>
          b.own?.colors ? { ...b, own: { ...b.own, colors: { ...b.own.colors, separate: own(b.own.colors, b.own.shape?.depth ?? prev.depth) } } } : b
        ),
      }))
    }
    // Each Look step shows its brand in its mode.
    if (to === 'look' || to === 'review') {
      const b = step.brand !== undefined && step.brand > 0 ? rows[step.brand]?.id : null
      if (b && fresh.has(b)) {
        // First visit of a brand made in this run: what it owns starts from the main brand as it is now.
        updateTheme((prev) => ({
          ...prev,
          brands: prev.brands.map((x) => (x.id === b && x.own ? { ...x, own: Object.fromEntries(Object.keys(x.own).map((g) => [g, groupOf(prev, g as BrandGroup)])) } : x)),
        }))
        setFresh((set) => new Set([...set].filter((id) => id !== b)))
      }
      patchTheme({ appearance: to === 'review' ? modes[1] : modes[0], brand: b ?? null })
    }
    // The agent opens on the first Look step when the look was described in words.
    setAgentOpen(to === 'look' && !step.brand && (described || Boolean(doc.pendingPrompt)))
    setPage(next)
  }

  // Export to Figma: the changes this theme makes to the starter Figma variables.
  const onFigma = PAGES[page].id === 'figma'
  const changes = useMemo(() => (onFigma ? buildChangeSet(theme, version) : null), [onFigma, theme, version])
  const [downloaded, setDownloaded] = useState(false)
  const slug = projectFileName(info.name.trim() || DEFAULT_NAME).replace('.dsproject.json', '')
  const downloadChanges = () => {
    if (!changes) return
    download(`${slug}.changes.json`, JSON.stringify(changes, null, 2))
    setDownloaded(true)
  }
  const exported = downloaded

  /** Saves the setup as the next version; the site then opens on its docs. */
  const finish = async () => {
    const clean = { ...info, name: info.name.trim() || DEFAULT_NAME }
    const nextTheme = { ...theme, name: clean.name }
    update({ info: clean, theme: nextTheme, setupDone: true, setupStep: 0, pendingPrompt: null })
    if (!writable) return onCannotShip()
    const note = starter ? `Set up ${clean.name}` : 'Setup updated'
    setShipping(true)
    setShipError('')
    try {
      await shipToRepo(makeProjectFile(clean, nextTheme, doc.prototypes, doc.pages, [{ version, note, date: new Date().toISOString() }, ...saved.versions]), {
        version,
        note,
        view: 'docs',
      })
    } catch (e) {
      setShipping(false)
      setShipError(e instanceof Error ? e.message : 'Saving failed.')
    }
  }

  const current = PAGES[page]
  const id = current.id
  // On a brand's Look step: which brand, and what it owns.
  const lookBrand = multi && current.brand !== undefined ? rows[current.brand] : null
  const mainName = rows[0]?.name.trim() || 'the main brand'
  const follows = BRAND_GROUPS.filter((g) => !differs.includes(g))
  const brandNote = !lookBrand
    ? ''
    : current.brand === 0
    ? `${lookBrand.name} is the main brand${differs.length < 3 && rows.length > 1 ? `: the other brands follow its ${listOf(follows.map((g) => GROUP_LABEL[g]))}` : ''}. `
    : `${lookBrand.name} has its own ${listOf(differs.map((g) => GROUP_LABEL[g]))}${
        follows.length ? `; its ${listOf(follows.map((g) => GROUP_LABEL[g]))} follow ${mainName}` : ''
      }. `
  const t = appType(info.appType)

  const [base, other] = modes
  const body: Record<StepId, { title: string; lede: string; form: ReactNode; art: ReactNode }> = {
    brands: {
      title: 'One brand or several?',
      lede: 'Several brands share components, modes and spacing. Each one gets its own colors, fonts and shape, and its own collection in Figma.',
      form: (
        <>
          <div className="wiz-modes" role="radiogroup" aria-label="Brands">
            {(
              [
                [false, 'One brand', 'A single look for everything you build.'],
                [true, 'Several brands', 'Sub-brands or products that each need their own look.'],
              ] as [boolean, string, string][]
            ).map(([value, title, text]) => (
              <label key={String(value)} className={`wiz-mode wiz-mode--compact${multi === value ? ' is-selected' : ''}`}>
                <input type="radio" name="brands" checked={multi === value} onChange={() => setMulti(value)} />
                <span className="wiz-mode__icon" aria-hidden="true">
                  {value ? <Stack size={18} weight="fill" /> : <Square size={18} weight="fill" />}
                </span>
                <span>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </span>
              </label>
            ))}
          </div>
          {multi ? (
            <ol className="wiz-brands">
              {rows.map((r, i) => (
                <li key={r.id}>
                  <div className="wiz-brands__head">
                    <span>{i === 0 ? 'Main brand' : `Brand ${i + 1}`}</span>
                    {i > 1 ? (
                      <button
                        type="button"
                        className="ui-icon-btn"
                        onClick={() => setRows((list) => list.filter((_, k) => k !== i))}
                        aria-label={`Remove ${r.name || `brand ${i + 1}`}`}
                      >
                        <X size={12} weight="bold" />
                      </button>
                    ) : null}
                  </div>
                  <input
                    className="wiz-input"
                    value={r.name}
                    onChange={(e) => patchRow(i, { name: e.target.value })}
                    placeholder={i === 0 ? 'Acme Health' : 'Acme Kids'}
                    aria-label={`Brand ${i + 1} name`}
                    aria-invalid={(!r.name.trim() || names.indexOf(r.name.trim().toLowerCase()) !== i) && r.name !== '' ? true : undefined}
                  />
                  <input
                    className="wiz-input"
                    value={r.description}
                    onChange={(e) => patchRow(i, { description: e.target.value })}
                    placeholder="Who it’s for, in one line"
                    aria-label={`Brand ${i + 1} description`}
                  />
                  <select
                    className="wiz-input"
                    value={r.appType}
                    onChange={(e) => patchRow(i, { appType: e.target.value as AppTypeId })}
                    aria-label={`Brand ${i + 1} product type`}
                  >
                    {APP_TYPES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
              <li className="wiz-brands__add">
                <button
                  type="button"
                  className="ui-btn ui-btn--ghost"
                  onClick={() => setRows((list) => [...list, { id: `new-${Date.now()}`, name: '', description: '', appType: list[0].appType }])}
                >
                  <Plus size={14} weight="bold" /> Add a brand
                </button>
              </li>
            </ol>
          ) : null}
          {brandsInvalid ? <p className="wiz-hint">Give every brand a name, and no two the same.</p> : null}
          {multi ? (
            <fieldset className="wiz-base">
              <legend>What changes between brands?</legend>
              <div className="wiz-checks">
                {(
                  [
                    ['colors', 'Colors', 'Brand color, second color, backgrounds'],
                    ['fonts', 'Fonts', 'Typefaces, text size and scale'],
                    ['shape', 'Shape', 'Corner radius, shadows, borders and buttons'],
                  ] as [BrandGroup, string, string][]
                ).map(([g, title, text]) => (
                  <label key={g} className={`wiz-check${differs.includes(g) ? ' is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={differs.includes(g)}
                      onChange={(e) => setDiffers((list) => (e.target.checked ? BRAND_GROUPS.filter((x) => x === g || list.includes(x)) : list.filter((x) => x !== g)))}
                    />
                    <span>
                      <strong>{title}</strong>
                      <span>{text}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="wiz-hint">
                {differs.length
                  ? `Everything else follows the main brand: change it once and every brand follows. You can change this later in Edit theme.`
                  : 'The brands look the same and differ only in name and product. Tick what should be different.'}
              </p>
            </fieldset>
          ) : null}
        </>
      ),
      art: (
        <BrandsPreview
          names={multi ? rows.map((r, i) => r.name.trim() || `Brand ${i + 1}`) : [info.name.trim() || DEFAULT_NAME]}
          note={differs.length ? `Own ${listOf(differs.map((g) => GROUP_LABEL[g]))}` : 'Follows the main brand'}
        />
      ),
    },
    modes: {
      title: 'Which modes does it have?',
      lede: 'Some products only need one. With two, one is designed first and the other is worked out from it.',
      form: (
        <>
          <div className="wiz-modes" role="radiogroup" aria-label="Modes">
            {(
              [
                ['both', 'Light and dark', 'Both ship. People switch between them.'],
                ['light', 'Light only', 'One light mode. No dark mode to maintain.'],
                ['dark', 'Dark only', 'One dark mode, for products that live in the dark.'],
              ] as [ModesChoice, string, string][]
            ).map(([value, title, text]) => (
              <label key={value} className={`wiz-mode${modesChoice === value ? ' is-selected' : ''}`}>
                <input type="radio" name="modes" value={value} checked={modesChoice === value} onChange={() => setModesChoice(value)} />
                <span className="wiz-mode__icon wiz-mode__icon--modes" aria-hidden="true">
                  {value === 'dark' ? <Moon size={18} weight="fill" /> : value === 'light' ? <Sun size={18} weight="fill" /> : <CircleHalf size={18} weight="fill" />}
                </span>
                <span>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </span>
              </label>
            ))}
          </div>
          {modesChoice === 'both' ? (
            <fieldset className="wiz-base">
              <legend>Designed first</legend>
              <div className="chrome-segmented" role="radiogroup" aria-label="Designed first">
                {APPEARANCES.map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={modesBase === m} className={modesBase === m ? 'is-active' : ''} onClick={() => setModesBase(m)}>
                    {m === 'light' ? <Sun size={14} weight="bold" /> : <Moon size={14} weight="bold" />} {MODE_NAMES[m]}
                  </button>
                ))}
              </div>
              <p className="wiz-hint">{MODE_NAMES[modesBase]} is the default, and the one people see first.</p>
            </fieldset>
          ) : null}
          {modesChoice === 'both' ? (
            <fieldset className="wiz-base">
              <legend>How {MODE_NAMES[modes[1]].toLowerCase()} is made</legend>
              <div className="wiz-modes" role="radiogroup" aria-label={`How ${MODE_NAMES[modes[1]].toLowerCase()} is made`}>
                {(
                  [
                    [
                      false,
                      `Follows ${MODE_NAMES[modes[0]].toLowerCase()} automatically`,
                      `Worked out from your ${MODE_NAMES[modes[0]].toLowerCase()} choices. Every change applies to both. You get a step to check it.`,
                    ],
                    [true, 'Set up on its own', `Its own colors and shadows, styled in its own step. Type, shape and spacing stay shared.`],
                  ] as [boolean, string, string][]
                ).map(([value, title, text]) => (
                  <label key={String(value)} className={`wiz-mode wiz-mode--compact${secondSeparate === value ? ' is-selected' : ''}`}>
                    <input type="radio" name="second" checked={secondSeparate === value} onChange={() => setSecondSeparate(value)} />
                    <span className="wiz-mode__icon" aria-hidden="true">
                      {value ? <SlidersHorizontal size={18} weight="fill" /> : <LinkSimple size={18} weight="bold" />}
                    </span>
                    <span>
                      <strong>{title}</strong>
                      <span>{text}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
        </>
      ),
      art: <ModesPreview modes={modes} secondSeparate={secondSeparate} />,
    },
    name: {
      title: 'What’s your design system called?',
      lede: 'A name and one line on who it’s for. Both show on the site’s home page, and you can change them later.',
      form: (
        <>
          <Field label="System name">
            {(fid) => <input id={fid} className="wiz-input wiz-input--big" value={info.name} onChange={(e) => patch({ name: e.target.value })} autoComplete="off" autoFocus />}
          </Field>
          <Field label="In one line, who is it for?" hint="Optional. It helps the agent make better choices.">
            {(fid) => (
              <input
                id={fid}
                className="wiz-input"
                value={info.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder="A reporting tool for regional sales teams"
                autoComplete="off"
              />
            )}
          </Field>
        </>
      ),
      art: <SitePreview name={info.name} description={info.description} />,
    },
    type: {
      title: 'What are you building?',
      lede: 'This picks the example screens you preview while styling, and the ideas offered when you prototype.',
      form: (
        <div className="wiz-types" role="radiogroup" aria-label="Product type">
          {APP_TYPES.map((a) => (
            <label key={a.id} className={`wiz-type${info.appType === a.id ? ' is-selected' : ''}`}>
              <input type="radio" name="appType" value={a.id} checked={info.appType === a.id} onChange={() => patch({ appType: a.id })} />
              <AppTypeThumb id={a.id} />
              <strong>{a.name}</strong>
              <span>{a.description}</span>
            </label>
          ))}
        </div>
      ),
      art: (
        <div className="ill-window">
          <div className="ill-bar">Preview · {t.name}</div>
          <div className="ill-window__body ill-center">
            <AppTypeThumb id={info.appType} large />
            <p className="ill-caption">Example screen: {t.screens.join(', ')}</p>
          </div>
        </div>
      ),
    },
    start: {
      title: 'How do you want to start?',
      lede: 'Pick what feels easiest. You fine-tune it on the next step, and it stays editable later.',
      form: (
        <div className="wiz-modes" role="radiogroup" aria-label="Starting point">
          {(
            [
              starter
                ? ['defaults', SlidersHorizontal, 'Start from clean defaults', 'A neutral, accessible base. Shape it yourself with sliders later.']
                : ['defaults', SlidersHorizontal, 'Keep the current look', 'Only the details change. The theme stays as it is.'],
              ['describe', Sparkle, 'Describe the look', 'Tell the agent in your own words, like “calm and trustworthy” or “like Cartoon Network”.'],
              ['preset', PaintBrush, 'Pick a preset', 'Five ready-made looks. No agent needed.'],
            ] as [StartMode, typeof SlidersHorizontal, string, string][]
          ).map(([m, IconCmp, title, text]) => (
            <label key={m} className={`wiz-mode${mode === m ? ' is-selected' : ''}`}>
              <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
              <span className="wiz-mode__icon">
                <IconCmp size={18} weight="fill" />
              </span>
              <span>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
            </label>
          ))}
          <div className="wiz-mode is-soon" aria-disabled="true">
            <span className="wiz-mode__icon">
              <FigmaLogo size={18} weight="fill" />
            </span>
            <span>
              <strong>
                Mirror an existing Figma system <em className="wiz-soon">Coming later</em>
              </strong>
              <span>Drop in a Figma file and Claude sets the system up to match it, through the Figma MCP.</span>
            </span>
          </div>
          {mode === 'describe' ? (
            <div className="wiz-describe">
              <textarea
                className="wiz-input"
                rows={3}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Bold and graphic, like Cartoon Network"
                aria-label="Describe the look"
              />
              {agent.ready ? (
                <p className="wiz-hint">The agent styles it from this on the next step, Look.</p>
              ) : (
                <p className="wiz-hint">
                  The agent needs a connection to Claude.{' '}
                  <button type="button" className="agent-link" onClick={() => setSettingsOpen(true)}>
                    Connect it now
                  </button>{' '}
                  or later; your description is kept.
                </p>
              )}
            </div>
          ) : null}
          {mode === 'preset' ? (
            <div className="wiz-presets">
              {THEME_PRESETS.map((p) => (
                <button key={p.id} type="button" className={`agent-preset${preset === p.id ? ' is-selected' : ''}`} aria-pressed={preset === p.id} onClick={() => setPreset(p.id)}>
                  <span
                    className="agent-preset__swatch"
                    style={{
                      background: p.proposal.main ? `oklch(${p.proposal.main.l} ${p.proposal.main.c} ${p.proposal.main.h})` : undefined,
                      borderRadius: Math.min(p.proposal.radius ?? 8, 14),
                    }}
                    aria-hidden="true"
                  >
                    {p.proposal.accent ? <i style={{ background: p.proposal.accent }} /> : null}
                  </span>
                  <strong>{p.name}</strong>
                  <span>{p.blurb}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ),
      art: (
        <div className="ill-window">
          <div className="ill-bar">Edit theme</div>
          <div className="ill-window__body ill-configure">
            <div className="ill-sliders">
              {['Brand', 'Type', 'Radius', 'Density'].map((s, i) => (
                <span key={s}>
                  <small>{s}</small>
                  <i style={{ ['--v' as string]: `${30 + i * 15}%` }} />
                </span>
              ))}
            </div>
            <div className="ill-agentbox">
              <Sparkle size={12} weight="fill" /> {mode === 'describe' && brief ? brief : 'Make it look like…'}
            </div>
          </div>
        </div>
      ),
    },
    code: {
      title: 'Link your GitHub repository',
      lede: 'This site runs from your copy of the starter pack. Link it, so the docs point people to the source.',
      form: (
        <>
          <ol className="wiz-steps">
            <li>Open your copy of the repository on GitHub.</li>
            <li>Copy the address from the browser’s address bar.</li>
            <li>Paste it below.</li>
          </ol>
          <p className="wiz-hint">
            No copy yet? Open the{' '}
            <a href={TEMPLATE_REPO} target="_blank" rel="noreferrer">
              starter pack on GitHub
            </a>{' '}
            and choose <b>Use this template</b>.
          </p>
          <Field
            label="Your repository"
            hint={githubInvalid ? 'That doesn’t look like a GitHub repository link.' : repo ? <>Linked: {repo}</> : 'You can skip this and add it later in settings.'}
          >
            {(fid) => (
              <input
                id={fid}
                className="wiz-input"
                type="url"
                inputMode="url"
                value={info.githubUrl}
                onChange={(e) => patch({ githubUrl: e.target.value })}
                placeholder="https://github.com/your-team/your-design-system"
                aria-invalid={githubInvalid || undefined}
                autoComplete="off"
              />
            )}
          </Field>
        </>
      ),
      art: <GitHubIllustration />,
    },
    design: {
      title: 'Make your own copy of the Figma file',
      lede: 'Designers work in Figma. The file mirrors the code: same components, same tokens.',
      form: (
        <>
          <ol className="wiz-steps">
            <li>
              Find the <b>DS Starter Pack</b> file your team shared, and choose <b>Duplicate</b>.
            </li>
            <li>Rename the copy and move it to your team’s project.</li>
            <li>
              Open it, click <b>Share</b> then <b>Copy link</b>, and paste it below.
            </li>
          </ol>
          <Field
            label="Your Figma file"
            hint={figmaInvalid ? 'That doesn’t look like a Figma file link.' : fileKey ? <>Linked. File key: {fileKey}</> : 'You can skip this and add it later in settings.'}
          >
            {(fid) => (
              <input
                id={fid}
                className="wiz-input"
                type="url"
                inputMode="url"
                value={info.figmaUrl}
                onChange={(e) => patch({ figmaUrl: e.target.value })}
                placeholder="https://www.figma.com/design/…"
                aria-invalid={figmaInvalid || undefined}
                autoComplete="off"
              />
            )}
          </Field>
        </>
      ),
      art: <FigmaIllustration />,
    },
    look: {
      title: lookBrand ? `${lookBrand.name}${other ? `, ${MODE_NAMES[base].toLowerCase()}` : ''}` : other ? `Shape the ${MODE_NAMES[base].toLowerCase()} look` : 'Shape the look',
      lede:
        brandNote +
        (other
          ? `Color, type, shape and components, with sliders or the agent. ${MODE_NAMES[other]} is worked out from it.`
          : 'Color, type, shape and components, with sliders or the agent.'),
      form: null,
      art: null,
    },
    review: {
      title: !other
        ? ''
        : lookBrand
        ? `${lookBrand.name}, ${MODE_NAMES[other].toLowerCase()}`
        : secondSeparate
        ? `Shape the ${MODE_NAMES[other].toLowerCase()} look`
        : `Check the ${MODE_NAMES[other].toLowerCase()} look`,
      lede: !other
        ? ''
        : secondSeparate
        ? `${MODE_NAMES[other]} has its own colors and shadows, set here. Type, shape and spacing are shared with ${MODE_NAMES[base].toLowerCase()}.`
        : `${MODE_NAMES[other]} is worked out from ${MODE_NAMES[
            base
          ].toLowerCase()} automatically, so changes here apply to both. To tune it on its own, go back to Modes and choose “Set up on its own”.`,
      form: null,
      art: null,
    },
    figma: {
      title: 'Export to Figma',
      lede: 'Designers work in your Figma file, so it needs the same theme as the code. Download the changes, then import them with the plugin.',
      form: (
        <>
          <div className="wiz-download">
            <span className="wiz-download__icon" aria-hidden="true">
              <FigmaLogo size={20} weight="fill" />
            </span>
            <span className="wiz-download__text">
              <strong>{slug}.changes.json</strong>
              <span>
                {changes ? changeSetSummary(changes) : ''}
              </span>
            </span>
            {changes ? (
              <button type="button" className={`ui-btn ${downloaded ? 'ui-btn--ghost' : 'ui-btn--primary'}`} onClick={downloadChanges}>
                {downloaded ? (
                  <>
                    <CheckCircle size={14} weight="fill" /> Downloaded
                  </>
                ) : (
                  <>
                    <DownloadSimple size={14} weight="bold" /> Download
                  </>
                )}
              </button>
            ) : null}
          </div>
          <ol className="wiz-steps">
            <li>
              Open{' '}
              {fileKey ? (
                <a href={info.figmaUrl} target="_blank" rel="noreferrer">
                  your Figma file
                </a>
              ) : (
                'your Figma file'
              )}{' '}
              in Figma Desktop, then <b>Plugins → Development → DS Configurator</b>.
            </li>
            <li>
              Choose <b>Import changes</b> and drop in the file you downloaded.
            </li>
            <li>
              Check the list of changes, then click <b>Apply</b>.
            </li>
          </ol>
          <p className="wiz-hint">
            First time? A developer installs the plugin once with <code>npm run plugin:install</code>. You can do the import later: the steps stay on the docs page “Keep Figma in
            sync”.
          </p>
        </>
      ),
      art: <PluginIllustration fileName={info.name.trim() || DEFAULT_NAME} />,
    },
  }

  const b = body[id]
  const last = page === PAGES.length - 1

  // One thin line of steps: hover for a step's name, click to go there; "All steps" lists them.
  const dots = (
    <nav className="wiz-progress" aria-label="Set up system: progress">
      <ol className="wiz-progress__bar">
        {PAGES.map((p, i) => (
          <li key={p.key}>
            <button
              type="button"
              className={i === page ? 'is-current' : i < page ? 'is-done' : ''}
              onClick={() => commit(i)}
              aria-current={i === page ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${p.title}`}
              data-label={`${i + 1} · ${p.title}`}
              data-align={i < 2 ? 'start' : i > PAGES.length - 3 ? 'end' : undefined}
              disabled={(blocked && i > page) || shipping}
            />
          </li>
        ))}
      </ol>
      <details className="wiz-progress__all">
        <summary>All steps</summary>
        <ol>
          {PAGES.map((p, i) => (
            <li key={p.key}>
              <button
                type="button"
                className={i === page ? 'is-current' : i < page ? 'is-done' : ''}
                onClick={(e) => {
                  ;(e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open')
                  commit(i)
                }}
                disabled={(blocked && i > page) || shipping}
              >
                <span>{i < page ? <Check size={10} weight="bold" /> : i + 1}</span>
                {p.title}
              </button>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  )
  const eyebrow = (
    <p className="wiz__eyebrow">
      Set up system · {page + 1} of {PAGES.length}
    </p>
  )
  const back =
    page > 0 ? (
      <button type="button" className="ui-btn ui-btn--ghost" onClick={() => commit(page - 1)} disabled={shipping}>
        <ArrowLeft size={14} weight="bold" /> Back
      </button>
    ) : (
      <span />
    )
  const primary = last ? (
    <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg" disabled={!exported || shipping || writable === null}>
      {shipping ? (
        'Saving…'
      ) : (
        <>
          <RocketLaunch size={14} weight="fill" /> Save v{version} and open the site
        </>
      )}
    </button>
  ) : (
    <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg" disabled={blocked}>
      Continue <ArrowRight size={14} weight="bold" />
    </button>
  )
  const onSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (blocked || shipping) return
    if (last) {
      if (exported) finish()
    } else commit(page + 1)
  }

  if (id === 'look' || id === 'review') {
    return (
      <div className="wiz-look">
        <form className="wiz-look__bar" onSubmit={onSubmit} noValidate>
          {dots}
          <div className="wiz-look__row">
            <div className="wiz-look__head">
              {eyebrow}
              <h1>{b.title}</h1>
              <p>{b.lede}</p>
            </div>
            <div className="wiz__foot-right">
              <button type="button" className={`ask-btn${agentOpen ? ' is-on' : ''}`} aria-pressed={agentOpen} onClick={() => setAgentOpen(!agentOpen)}>
                <Sparkle size={14} weight="fill" /> Style with agent
              </button>
              {back}
              {primary}
            </div>
          </div>
        </form>
        <div className="wiz-look__editor">
          <ConfigureView toolbar={false} />
        </div>
      </div>
    )
  }

  return (
    <div className="wiz">
      <div className="wiz__main">
        {dots}
        <form className="wiz__form" onSubmit={onSubmit} noValidate>
          <header className="wiz__head">
            {eyebrow}
            <h1>{b.title}</h1>
            <p>{b.lede}</p>
          </header>
          <div className="wiz__fields">{b.form}</div>
          {last && shipError ? <p className="agent-error">{shipError}</p> : null}
          {last && !exported ? <p className="wiz-hint">Download the Figma changes to finish.</p> : null}
          {last && writable === false ? <p className="wiz-hint">This copy can’t write to the repo, so saving opens the save dialog to download the project file instead.</p> : null}
          <footer className="wiz__foot">
            {back}
            <div className="wiz__foot-right">
              {(id === 'code' || id === 'design') && !blocked ? (
                <button type="button" className="ui-btn ui-btn--ghost" onClick={() => commit(page + 1)}>
                  I’ll do this later
                </button>
              ) : null}
              {primary}
            </div>
          </footer>
        </form>
      </div>
      <div className="wiz__art" aria-hidden="true">
        <div className="wiz__art-inner" key={id}>
          {b.art}
        </div>
      </div>
    </div>
  )
}
