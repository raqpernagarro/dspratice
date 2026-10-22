import { createBrowserRouter, Navigate, useParams, useSearchParams } from 'react-router'
import { useEffect } from 'react'
import { useStore } from '@/state/store'
import { practice } from './routes'
import { LegacyRedirect } from './LegacyRedirect'
import { ClientEntry, NagarroLayout, ProjectRouteSync } from '@/shell/layouts'
import { WelcomePage } from '@/features/welcome/WelcomePage'
import { LandingPage } from '@/features/landing/LandingPage'
import { HandbookPage } from '@/features/handbook/HandbookPage'
import { NagarroHome } from '@/features/nagarro/NagarroHome'
import { ClientPortfolio } from '@/features/nagarro/ClientPortfolio'
import { PresenterGuide } from '@/features/nagarro/PresenterGuide'
import { EngagementHome } from '@/features/nagarro/EngagementHome'
import { PracticeLibrary, PracticeSettings, JourneyStepPlaceholder } from '@/features/nagarro/PracticePages'
import { lazyPage } from './lazy'
import { changeRoutes, clientRoute, systemRoutes } from './clientRoutes'

const knowledge = () => import('@/features/knowledge')
const opportunity = () => import('@/features/opportunity')
const decks = () => import('@/features/presentations')
const hub = () => import('@/features/hub')
const scorecard = () => import('@/features/scorecard')
import { Wizard } from '@/features/start/Wizard'
import { Connect } from '@/features/start/Connect'
import { Scan } from '@/features/start/Scan'
import { Readout } from '@/features/start/Readout'
import { Mapping } from '@/features/start/Mapping'
import { DriftList } from '@/features/start/DriftList'
import { Handover } from '@/features/start/Handover'
import { ChannelsPage } from '@/features/ai/ChannelsPage'
import { EvalsPage } from '@/features/ai/EvalsPage'
import { InboxPage } from '@/features/ai/InboxPage'
import { PrototypePage } from '@/features/ai/PrototypePage'
import { ContractPage } from '@/features/govern/ContractPage'
import { PeoplePage } from '@/features/govern/PeoplePage'
import { BrandsPage } from '@/features/govern/BrandsPage'
import { TrustPage } from '@/features/govern/TrustPage'
import { AuditPage } from '@/features/govern/AuditPage'
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

/** Improve-journey steps: the ported pages for 2/4/5/6/7/9, placeholders for the rest until the journey shell lands. */
function ImproveStep() {
  const { step } = useParams()
  switch (step) {
    case '2':
      return <Connect />
    case '4':
      return <Scan />
    case '5':
      return <DriftList />
    case '6':
      return <Readout />
    case '7':
      return <Mapping />
    case '9':
      return <Handover />
    default:
      return <JourneyStepPlaceholder journey="improve" step={Number(step) || 1} />
  }
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <>
        <ResetGate />
        <WelcomePage />
      </>
    ),
  },
  { path: '/landing', element: <LandingPage /> },
  { path: '/share/:slug', element: <ShareView /> },
  {
    path: '/nagarro',
    element: <NagarroLayout />,
    children: [
      { index: true, element: <NagarroHome /> },
      { path: 'clients', element: <ClientPortfolio /> },
      { path: 'library', element: <PracticeLibrary /> },
      { path: 'library/:id', element: <PracticeLibrary /> },
      { path: 'guides', element: <HandbookPage /> },
      { path: 'guides/:slug', element: <HandbookPage /> },
      { path: 'presentations', element: lazyPage(decks, 'DecksPractice') },
      { path: 'knowledge', element: lazyPage(knowledge, 'KnowledgeLibrary') },
      { path: 'knowledge/add', element: lazyPage(knowledge, 'KnowledgeLibrary') },
      { path: 'knowledge/:id', element: lazyPage(knowledge, 'SourceDetail') },
      { path: 'opportunities', element: lazyPage(opportunity, 'OpportunitiesPractice') },
      { path: 'opportunities/new', element: lazyPage(opportunity, 'OpportunityNew') },
      { path: 'tools', element: lazyPage(hub, 'ToolsPage') },
      { path: 'demos', element: lazyPage(hub, 'DemosPage') },
      { path: 'scorecard', element: lazyPage(scorecard, 'ScorecardPage') },
      { path: 'settings/integrations', element: lazyPage(hub, 'IntegrationsPage') },
      { path: 'settings', element: <PracticeSettings /> },
      { path: 'settings/people', element: <PeoplePage /> },
      { path: 'settings/rules', element: <ContractPage /> },
      { path: 'settings/setup', element: <PracticeSettings /> },
      { path: 'presenter', element: <LegacyRedirect /> },
      {
        path: 'clients/:slug',
        element: <ProjectRouteSync />,
        children: [
          { index: true, element: <EngagementHome /> },
          { path: 'journey/new', element: <Wizard /> },
          { path: 'journey/new/:step', element: <Wizard /> },
          { path: 'journey/improve', element: <Navigate to="1" replace /> },
          { path: 'journey/improve/:step', element: <ImproveStep /> },
          { path: 'meeting', element: <PresenterGuide /> },
          { path: 'report', element: <ReportPage /> },
          { path: 'presentations', element: lazyPage(decks, 'DeckList') },
          { path: 'presentations/new', element: lazyPage(decks, 'DeckBuilder') },
          { path: 'presentations/:id', element: lazyPage(decks, 'DeckView') },
          { path: 'opportunities', element: lazyPage(opportunity, 'OpportunityList') },
          { path: 'opportunities/new', element: lazyPage(opportunity, 'OpportunityNew') },
          { path: 'opportunities/:id', element: lazyPage(opportunity, 'OpportunityEntry') },
          { path: 'opportunities/:id/:step', element: lazyPage(opportunity, 'OpportunityWizard') },
          { path: 'system', element: <Navigate to="components" replace /> },
          ...systemRoutes('system'),
          ...changeRoutes('changes'),
          { path: 'ai', element: <Navigate to="channels" replace /> },
          { path: 'ai/channels', element: <ChannelsPage /> },
          { path: 'ai/channels/:id', element: <ChannelsPage /> },
          { path: 'ai/evals', element: <EvalsPage /> },
          { path: 'ai/inbox', element: <InboxPage /> },
          { path: 'ai/prototype', element: <PrototypePage /> },
          { path: 'settings', element: <Navigate to="contract" replace /> },
          { path: 'settings/contract', element: <ContractPage /> },
          { path: 'settings/people', element: <PeoplePage /> },
          { path: 'settings/brands', element: <BrandsPage /> },
          { path: 'settings/trust', element: <TrustPage /> },
          { path: 'settings/audit', element: <AuditPage /> },
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
