import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/hanken-grotesk/400.css'
import '@fontsource/hanken-grotesk/500.css'
import '@fontsource/hanken-grotesk/600.css'
import '@fontsource/hanken-grotesk/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'

import '../../stories/base-ui/tokens/ds-aliases.css'
import '../../stories/base-ui/tokens/figma-semantic.css'

import { App } from './App'
import { resetIfAsked } from './app/reset'
import './styles/editor.css'
import './styles/app.css'
import './styles/screens.css'
import './styles/site.css'

// After `npm run ds:reset`, forget what this browser saved before anything reads it.
resetIfAsked().finally(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
