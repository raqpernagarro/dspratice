import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// DS-Ngr CSS — keep this order. The theme loads right after tokens.css, your overrides after the theme.
import 'ds-ngr/tokens.css';
import './styles/{{themeFile}}';
import './styles/overrides.css';
import 'ds-ngr/global.css';
import 'ds-ngr/style.css';
import './styles/app.css';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
