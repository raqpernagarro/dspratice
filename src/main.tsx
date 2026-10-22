// Internal seed data first, before the store is created (swapped for a no-op in the demo build).
import '@/internal/register'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import './styles/fonts.css'
import './styles/brand-tokens.css'
import './styles/base.css'
import './styles/motion.css'
import './styles/shell.css'
import './styles/fi.css'
import './styles/pages.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
