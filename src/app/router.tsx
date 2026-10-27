import { createBrowserRouter, Navigate, useParams, useSearchParams } from 'react-router'
import { useEffect } from 'react'
import { useStore } from '@/state/store'
import { IMPROVE_LEGACY, IMPROVE_STEPS, practice, type ImproveStep as ImproveSlug, type OpportunityStep } from './routes'
import { LegacyRedirect } from './LegacyRedirect'
import { ClientEntry, NagarroLayout, OwnerRouteSync, ProjectRouteSync } from '@/shell/layouts'
import { NagarroHome } from '@/features/nagarro/NagarroHome'
import { MyWork } from '@/features/nagarro/MyWork'
import { PresenterGuide } from '@/features/nagarro/PresenterGuide'
import { EngagementHome } from '@/features/nagarro/EngagementHome'
import { StartSystem } from '@/features/nagarro/StartSystem'
import { JourneyGuide } from '@/features/nagarro/JourneyGuide'
import { AboutPage, PracticeSettings } from '@/features/nagarro/PracticePages'
import { NotesWindow } from '@/features/presenter/NotesWindow'
import { lazyPage } from './lazy'
import { changeRoutes, clientRoute, systemRoutes } from './clientRoutes'

const knowledge = () => import('@/features/knowledge')
const opportunity = () => import('@/features/opportunity')
const decks = () => import('@/features/presentations')
const hub = () => import('@/features/hub')
const tools = () => import('@/features/tools')
const scorecard = () => import('@/features/scorecard')
const engagement = () => import('@/features/engagement')
const demos = () => import('@/features/demos')
import { Wizard } from '@/features/start/Wizard'
import { NewSystem } from '@/features/start/NewSystem'
import { Connect } from '@/features/start/Connect'
import { Scan } from '@/features/start/Scan'
import { Readout } from '@/features/start/Readout'
import { Mapping } from '@/features/start/Mapping'
import { DriftList } from '@/features/start/DriftList'
import { Handover } from '@/features/start/Handover'
import { Goals } from '@/features/start/Goals'
import { ReviewShare } from '@/features/start/ReviewShare'
import { ImproveFrame } from '@/features/start/JourneyFrame'
import { ContractPage } from '@/features/govern/ContractPage'
import { PeoplePage } from '@/features/govern/PeoplePage'
import { BrandsPage } from '@/features/govern/BrandsPage'
import { TrustPage } from '@/features/govern/TrustPage'
import { ReportPage } from '@/features/share/ReportPage'
import { ShareView } from '@/features/share/ShareView'

function ResetGate() {
  const [params] = useSearchParams()
  const reset = useStore((s) => s.resetAll)
  useEffect(() => {
    if (params.get('reset') === '1') reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

/** The improve journey, in order. Old numeric steps (/journey/improve/4) redirect to their slug. */
function ImproveStep() {
  const { step = '' } = useParams()
  if (IMPROVE_LEGACY[step]) return <Navigate to={`../${IMPROVE_LEGACY[step]}`} relative="path" replace />
  if (!IMPROVE_STEPS.includes(step as ImproveSlug)) return <Navigate to={`../${IMPROVE_STEPS[0]}`} relative="path" replace />
  return (
    <ImproveFrame step={step as ImproveSlug} key={step}>
      <ImprovePage step={step as ImproveSlug} />
    </ImproveFrame>
  )
}

function ImprovePage({ step }: { step: ImproveSlug }) {
  switch (step) {
    case 'goals':
      return <Goals />
    case 'connect':
      return <Connect />
    case 'assess':
      return <Scan />
    case 'findings':
      return <DriftList />
    case 'plan':
      return <Readout />
    case 'mapping':
      return <Mapping />
    case 'review':
      return <ReviewShare />
    case 'handover':
      return <Handover />
  }
}

/** A path that moved: old project-level request and deck paths, old knowledge source pages. */
function MovedToPractice({ to }: { to: (p: { slug: string; id?: string; step?: string }) => string }) {
  const { slug = '', id, step } = useParams()
  return <Navigate to={to({ slug, id, step })} replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <>
        <ResetGate />
        <Navigate to={practice.home} replace />
      </>
    ),
  },
  { path: '/landing', element: <Navigate to={practice.home} replace /> },
  { path: '/presenter/:slug', element: <NotesWindow /> },
  { path: '/share/:slug', element: <ShareView /> },
  { path: '/cut/:id', element: lazyPage(demos, 'CutRecord') },
  {
    path: '/nagarro',
    element: <NagarroLayout />,
    children: [
      { index: true, element: <NagarroHome /> },
      { path: 'clients', element: <Navigate to={practice.myWork} replace /> },
      { path: 'work', element: <MyWork /> },
      { path: 'start', element: <StartSystem /> },
      { path: 'journeys/:id', element: <JourneyGuide /> },
      { path: 'library', element: <Navigate to={practice.projects} replace /> },
      { path: 'library/:id', element: <Navigate to={practice.projects} replace /> },
      // The handbook lives in the client demo (How we work) and as AI context (src/knowledge/handbook.md), not in the workspace.
      { path: 'guides', element: <Navigate to={practice.about} replace /> },
      { path: 'guides/:slug', element: <Navigate to={practice.about} replace /> },
      { path: 'presentations', element: <Navigate to={practice.myWork} replace /> },
      { path: 'presentations/new', element: lazyPage(decks, 'DeckBuilder') },
      { path: 'presentations/:id', element: <OwnerRouteSync kind="deck" />, children: [{ index: true, element: lazyPage(decks, 'DeckView') }] },
      { path: 'settings/sources', element: lazyPage(knowledge, 'KnowledgeLibrary') },
      { path: 'settings/sources/add', element: lazyPage(knowledge, 'KnowledgeLibrary') },
      { path: 'settings/sources/:id', element: lazyPage(knowledge, 'SourceDetail') },
      { path: 'knowledge', element: <Navigate to={practice.knowledge} replace /> },
      { path: 'knowledge/add', element: <Navigate to={practice.knowledgeAdd} replace /> },
      { path: 'knowledge/:id', element: <MovedToPractice to={({ id }) => practice.knowledgeSource(id!)} /> },
      { path: 'opportunities', element: <Navigate to={practice.myWork} replace /> },
      { path: 'opportunities/new', element: lazyPage(opportunity, 'OpportunityNew') },
      {
        path: 'opportunities/:id',
        element: <OwnerRouteSync kind="opportunity" />,
        children: [
          { index: true, element: lazyPage(opportunity, 'OpportunityEntry') },
          { path: ':step', element: lazyPage(opportunity, 'OpportunityWizard') },
        ],
      },
      { path: 'conversations', element: <Navigate to={practice.home} replace /> },
      { path: 'tools', element: <Navigate to={practice.home} replace /> },
      { path: 'tools/:id', element: lazyPage(tools, 'ToolPage') },
      { path: 'demos', element: lazyPage(demos, 'DemosStage') },
      { path: 'demos/cut/:id', element: lazyPage(demos, 'CutPage') },
      { path: 'demos/prepare', element: <PresenterGuide /> },
      { path: 'scorecard', element: lazyPage(scorecard, 'ScorecardPage') },
      { path: 'engagement', element: lazyPage(engagement, 'EngagementPage') },
      { path: 'settings/integrations', element: lazyPage(hub, 'IntegrationsPage') },
      { path: 'settings', element: <PracticeSettings /> },
      { path: 'settings/people', element: <PeoplePage /> },
      { path: 'settings/rules', element: <ContractPage /> },
      { path: 'settings/setup', element: <PracticeSettings /> },
      { path: 'settings/about', element: <AboutPage /> },
      { path: 'presenter', element: <LegacyRedirect /> },
      {
        path: 'clients/:slug',
        element: <ProjectRouteSync />,
        children: [
          { index: true, element: <EngagementHome /> },
          { path: 'journey/new', element: <NewSystem /> },
          { path: 'journey/new/:step', element: <Wizard /> },
          { path: 'journey/improve', element: <Navigate to={IMPROVE_STEPS[0]} replace /> },
          { path: 'journey/improve/:step', element: <ImproveStep /> },
          { path: 'meeting', element: <MovedToPractice to={({ slug }) => practice.meetingPrep(slug)} /> },
          { path: 'report', element: <ReportPage /> },
          { path: 'requests', element: <MovedToPractice to={({ slug }) => `/nagarro/clients/${slug}`} /> },
          { path: 'presentations', element: <MovedToPractice to={({ slug }) => practice.presentationsFor(slug)} /> },
          { path: 'presentations/new', element: <MovedToPractice to={({ slug }) => `${practice.deckNew}?project=${slug}`} /> },
          { path: 'presentations/:id', element: <MovedToPractice to={({ id }) => practice.deck(id!)} /> },
          { path: 'opportunities', element: <MovedToPractice to={({ slug }) => practice.opportunitiesFor(slug)} /> },
          { path: 'opportunities/new', element: <MovedToPractice to={({ slug }) => `${practice.opportunityStart}?project=${slug}`} /> },
          { path: 'opportunities/:id', element: <MovedToPractice to={({ id }) => practice.opportunityEntry(id!)} /> },
          { path: 'opportunities/:id/:step', element: <MovedToPractice to={({ id, step }) => practice.opportunity(id!, step as OpportunityStep)} /> },
          { path: 'system', element: <Navigate to="components" replace /> },
          ...systemRoutes('system'),
          ...changeRoutes('changes'),
          // The AI tab merged into Overview (round 8): agent suggestions, AI files and the release check are there.
          { path: 'ai', element: <MovedToPractice to={({ slug }) => `/nagarro/clients/${slug}`} /> },
          { path: 'ai/*', element: <MovedToPractice to={({ slug }) => `/nagarro/clients/${slug}`} /> },
          { path: 'settings', element: <Navigate to="contract" replace /> },
          { path: 'settings/contract', element: <ContractPage /> },
          { path: 'settings/people', element: <PeoplePage /> },
          { path: 'settings/brands', element: <BrandsPage /> },
          { path: 'settings/trust', element: <TrustPage /> },
          { path: 'settings/audit', element: <MovedToPractice to={({ slug }) => `/nagarro/clients/${slug}/settings/trust`} /> },
        ],
      },
      { path: '*', element: <Navigate to={practice.home} replace /> },
    ],
  },
  { path: '/client', element: <ClientEntry /> },
  clientRoute,
  { path: '/panel/*', element: <LegacyRedirect /> },
  { path: '/demo', element: <LegacyRedirect /> },
  { path: '/demo/*', element: <LegacyRedirect /> },
  { path: '/handbook', element: <LegacyRedirect /> },
  { path: '/handbook/*', element: <LegacyRedirect /> },
  { path: '*', element: <LegacyRedirect /> },
])
