// The client demo's routes, shared by the internal hub (router.tsx) and the client-safe
// demo build (router.demo.tsx). Client pages only: nothing here reaches internal material.
import { Navigate } from 'react-router'
import { ClientLayout } from '@/shell/layouts'
import { ClientHome } from '@/features/client/ClientHome'
import { DemoOutcome } from '@/features/demo/DemoOutcome'
import { Scan } from '@/features/start/Scan'
import { Handover } from '@/features/start/Handover'
import { ComponentsIndex } from '@/features/system/ComponentsIndex'
import { ComponentPage } from '@/features/system/ComponentPage'
import { TokensExplorer } from '@/features/system/TokensExplorer'
import { GuidanceEditor } from '@/features/system/GuidanceEditor'
import { Foundations } from '@/features/system/Foundations'
import { ChangesList } from '@/features/changes/ChangesList'
import { FindingPage } from '@/features/changes/FindingPage'
import { ImpactPage } from '@/features/changes/ImpactPage'
import { PullRequestPage } from '@/features/changes/PullRequestPage'
import { FigmaReviewPage } from '@/features/changes/FigmaReviewPage'
import { ChannelsPage } from '@/features/ai/ChannelsPage'
import { EvalsPage } from '@/features/ai/EvalsPage'
import { PrototypePage } from '@/features/ai/PrototypePage'
import { ReportPage } from '@/features/share/ReportPage'
import { HandbookPage } from '@/features/handbook/HandbookPage'
import { lazyPage } from './lazy'

export const systemRoutes = (prefix: string) => [
  { path: `${prefix}/components`, element: <ComponentsIndex /> },
  { path: `${prefix}/components/:id`, element: <ComponentPage /> },
  { path: `${prefix}/components/:id/guidance`, element: <GuidanceEditor /> },
  { path: `${prefix}/tokens`, element: <TokensExplorer /> },
  { path: `${prefix}/tokens/:id`, element: <TokensExplorer /> },
  { path: `${prefix}/foundations`, element: <Foundations /> },
]

export const changeRoutes = (prefix: string) => [
  { path: prefix, element: <ChangesList /> },
  { path: `${prefix}/findings/:id`, element: <FindingPage /> },
  { path: `${prefix}/:changeId/impact`, element: <ImpactPage /> },
  { path: `${prefix}/pr/:n`, element: <PullRequestPage /> },
  { path: `${prefix}/pr/:n/figma`, element: <FigmaReviewPage /> },
  { path: `${prefix}/figma/:id`, element: <FigmaReviewPage /> },
]


export const clientRoute =
{
    path: '/client/:slug',
    element: <ClientLayout />,
    children: [
      { index: true, element: <ClientHome /> },
      { path: 'explore', element: <Navigate to="components" replace /> },
      ...systemRoutes('explore'),
      ...changeRoutes('improve'),
      { path: 'ai', element: <PrototypePage /> },
      { path: 'ai/channels', element: <ChannelsPage /> },
      { path: 'ai/channels/:id', element: <ChannelsPage /> },
      { path: 'ai/evals', element: <EvalsPage /> },
      { path: 'evidence', element: <ReportPage /> },
      { path: 'evidence/assessment', element: <Scan /> },
      { path: 'evidence/handover', element: <Handover /> },
      { path: 'evidence/outcome', element: <DemoOutcome /> },
      { path: 'evidence/proposal', element: lazyPage(() => import('@/features/client/ProposalSummary'), 'ProposalSummary') },
      { path: 'scorecard', element: lazyPage(() => import('@/features/scorecard'), 'ScorecardPage') },
      { path: 'evidence/method', element: <HandbookPage /> },
      { path: 'evidence/method/:slug', element: <HandbookPage /> },
      { path: '*', element: <Navigate to="." replace /> },
    ],
  }
