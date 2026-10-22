// The AI-readiness scorecard: ten plain questions in five dimensions, adapted from the battle
// card. Pure scoring so it is testable and identical in the hub, the client workspace and the
// public demo. Nothing is sent anywhere.

export type Dimension = 'foundations' | 'parity' | 'guidance' | 'governance' | 'adoption'
export interface Question { id: string; dimension: Dimension; text: string; answers: [string, string, string, string] }

export const DIMENSIONS: Record<Dimension, { label: string; advice: string }> = {
  foundations: { label: 'Foundations and tokens', advice: 'Name your colours, type and spacing once, as tokens, and use the same names in Figma and code.' },
  parity: { label: 'Figma and code agree', advice: 'Make one side lead, and let a check flag every difference instead of finding it by eye.' },
  guidance: { label: 'Guidance AI can read', advice: 'Turn guidelines into structured metadata and agent files (usage, anti-patterns, composition) so AI tools stop guessing.' },
  governance: { label: 'Governance of changes', advice: 'Name an owner, version the system, and decide which AI-proposed changes are automatic and which need review.' },
  adoption: { label: 'Teams and AI tools', advice: 'Give every team that builds UI with AI the same system access and the same written rules.' },
}

export const QUESTIONS: Question[] = [
  { id: 'q1', dimension: 'foundations', text: 'Do you have one design system that people trust?', answers: ['No system, or it is too broken to use', 'Several, used inconsistently', 'One, partly used', 'One, used everywhere'] },
  { id: 'q2', dimension: 'foundations', text: 'Are colours, type and spacing defined as named tokens in both Figma and code?', answers: ['No', 'In one place only', 'In both, but they drifted', 'In both, in sync'] },
  { id: 'q3', dimension: 'parity', text: 'Do Figma and code agree today?', answers: ['Rarely', 'Sometimes', 'Mostly, checked by hand', 'Yes, checked automatically'] },
  { id: 'q4', dimension: 'parity', text: 'When a shared component changes, how does the other side find out?', answers: ['It does not', 'Someone tells them', 'A ticket', 'A check flags it'] },
  { id: 'q5', dimension: 'guidance', text: 'Could an AI tool read your design guidelines today?', answers: ['They are PDFs or wiki pages', 'A docs site written for people', 'Docs plus a few structured files', 'Structured metadata, agent files and an MCP server'] },
  { id: 'q6', dimension: 'guidance', text: 'When AI produces a screen, how do you know it follows your system?', answers: ['We do not', 'Review by eye', 'Some lint rules', 'Automated checks against the system'] },
  { id: 'q7', dimension: 'governance', text: 'Who approves changes to shared components?', answers: ['Nobody in particular', 'Whoever has time', 'A named owner', 'An owner, with review and versioning'] },
  { id: 'q8', dimension: 'governance', text: 'Who approves changes an AI tool proposes?', answers: ['Not decided', 'Same as any change, informally', 'A reviewer', 'Rules by risk: some automatic, some reviewed'] },
  { id: 'q9', dimension: 'adoption', text: 'Do teams that build UI with AI tools have guidance for using your system?', answers: ['No', 'Informal tips', 'Written guidance', 'Guidance plus tooling (agent files, MCP)'] },
  { id: 'q10', dimension: 'adoption', text: 'If a brand or accessibility rule changes, how long until every product follows?', answers: ['We cannot tell', 'Months', 'Weeks', 'One release'] },
]

export const LEVELS = ['Starting', 'Emerging', 'Structured', 'AI-ready', 'AI-native'] as const

export interface ScoreResult {
  answered: number
  level: number
  label: (typeof LEVELS)[number]
  byDimension: Record<Dimension, number>
  weakest: Dimension[]
  first: '2-week AI audit'
  then: 'DS Build' | 'DS Accelerate' | 'DS Scale' | 'Support'
  why: string
}

export function score(answers: Record<string, number>): ScoreResult {
  const byDimension = { foundations: 0, parity: 0, guidance: 0, governance: 0, adoption: 0 } as Record<Dimension, number>
  const counts = { ...byDimension }
  for (const q of QUESTIONS) {
    const a = answers[q.id]
    if (a === undefined) continue
    byDimension[q.dimension] += a
    counts[q.dimension] += 1
  }
  for (const d of Object.keys(byDimension) as Dimension[]) byDimension[d] = counts[d] ? byDimension[d] / counts[d] : 0
  const answered = Object.keys(answers).filter((k) => answers[k] !== undefined).length
  const avg = Object.values(byDimension).reduce((a, b) => a + b, 0) / 5
  const level = Math.min(5, Math.max(1, 1 + Math.round((avg / 3) * 4)))
  const weakest = (Object.keys(byDimension) as Dimension[]).sort((a, b) => byDimension[a] - byDimension[b]).slice(0, 3)
  const q1 = answers.q1
  let then: ScoreResult['then'] = 'DS Accelerate'
  let why = 'A system exists, but AI tools cannot read it reliably yet: DS Accelerate makes it machine-readable without rebuilding it.'
  if (q1 === 0 || byDimension.foundations < 1) {
    then = 'DS Build'
    why = 'There is no system the teams can rely on yet: DS Build creates one with the AI-ready structure in from day one.'
  } else if (q1 === 1) {
    then = 'DS Scale'
    why = 'Several systems are used inconsistently: DS Scale brings them onto one governed foundation.'
  } else if (avg >= 2.5) {
    then = 'Support'
    why = 'The system is already in good shape: Support keeps governance, evals and enablement running.'
  }
  return { answered, level, label: LEVELS[level - 1], byDimension, weakest, first: '2-week AI audit', then, why }
}
