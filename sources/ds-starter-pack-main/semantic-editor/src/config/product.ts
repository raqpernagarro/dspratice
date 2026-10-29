/**
 * Product identity — the single place to rename the app.
 * Used by the top bar, the document <title> (via vite.config.ts) and storage keys.
 */
export const PRODUCT = {
  /** Full name shown in the top bar and browser tab. */
  name: 'DS Configurator',
  /** One or two characters for the logo mark. */
  mark: 'DS',
  /** Short line used in the browser tab after the name. */
  tagline: 'Design system configurator',
} as const
