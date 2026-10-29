import { committedProject } from './committed-project'
import { DEFAULT_THEME_CONFIG, withDefaults, type ThemeConfig } from './theme-config'

/**
 * localStorage key for the theme edited in the configurator (also read by Storybook when it
 * runs on the same origin). Bumped when the config shape changes incompatibly.
 */
export const THEME_STORAGE_KEY = 'ds-configurator:theme-config'

export function loadStoredTheme(): ThemeConfig {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (raw) return withDefaults(JSON.parse(raw) as Partial<ThemeConfig>)
  } catch {
    // Storage unavailable or corrupt — fall through to defaults.
  }
  // Nothing edited in this browser yet: the project committed to the repo, else the system default.
  return committedProject()?.theme ?? DEFAULT_THEME_CONFIG
}

export function saveStoredTheme(theme: ThemeConfig) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme))
  } catch {
    // Ignore quota / privacy-mode failures.
  }
}
