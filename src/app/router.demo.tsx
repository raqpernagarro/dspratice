// The client-safe demo build's router (vite build --mode demo). Only the demo landing, the
// scorecard and the client demo on Demo Brand: no hub pages, no knowledge library,
// no opportunities. scripts/check-demo-build.mjs fails the build if internal text leaks in.
import { createBrowserRouter, Navigate } from 'react-router'
import { ClientEntry } from '@/shell/layouts'
import { DemoLanding, DemoTop } from '@/features/demo-site/DemoLanding'
import { ScorecardPage } from '@/features/scorecard'
import { clientRoute } from './clientRoutes'

export const router = createBrowserRouter([
  { path: '/', element: <DemoLanding /> },
  {
    path: '/scorecard',
    element: (
      <div className="demo-site">
        <DemoTop />
        <ScorecardPage />
      </div>
    ),
  },
  { path: '/client', element: <ClientEntry /> },
  clientRoute,
  { path: '*', element: <Navigate to="/" replace /> },
])
