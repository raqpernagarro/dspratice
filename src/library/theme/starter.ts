// Maps the project's theme intents to the DS Starter Pack's own configurator engine
// (stories/base-ui/tokens/theme-generator). `type.body/heading` stay null so applyTheme never
// requests a Google font; the font families are set as plain custom properties instead.

import { applyTheme, generateTokens } from '@starter/tokens/theme-generator'
import { DEFAULT_EXTRAS, withDefaults, type ThemeConfig as StarterConfig } from '@starter/tokens/theme-config'
import { exportTheme, themeToCss } from '@starter/tokens/theme-export'
import { toOklch } from '@starter/tokens/color-math'
import type { ThemeIntents } from './intents'

export const STARTER_FONT_PROPS = ['--font-family-primary', '--font-family-secondary'] as const

export function starterConfig(i: ThemeIntents): StarterConfig {
  const main = toOklch(i.brand.main)
  return withDefaults({
    name: i.brand.name,
    modes: ['light', 'dark'],
    appearance: i.mode,
    color: {
      main: main ? { h: main.h, c: main.c, l: main.l } : null,
      accent: i.brand.accent,
      neutralTint: i.neutralTint,
      neutralHue: null,
      background: null,
      rampContrast: null,
      status: { info: null, success: null, warning: null, error: null },
      tertiary: false,
    },
    type: { body: null, heading: null, baseSize: i.type.baseSize, scale: null },
    radius: i.radius,
    density: i.density,
    grid: true,
    depth: i.depth,
    extras: { ...DEFAULT_EXTRAS, buttonShape: i.buttonShape, headingWeight: i.type.headingWeight },
  })
}

const stack = (family: string, fallback = 'system-ui, sans-serif') => (family ? `'${family}', ${fallback}` : fallback)

/** Applies the theme to an element (the frame's <html>) and sets the font families. Idempotent. */
export function applyStarterTheme(el: HTMLElement, i: ThemeIntents) {
  const cfg = starterConfig(i)
  const generated = applyTheme(el, cfg)
  el.style.setProperty('--font-family-primary', stack(i.type.body || 'Hanken Grotesk'))
  el.style.setProperty('--font-family-secondary', stack(i.type.heading || i.type.body || 'Hanken Grotesk'))
  el.style.setProperty('--font-family-mono', "'JetBrains Mono', ui-monospace, monospace")
  return generated
}

/** The generated tokens without touching a document (for tests and the token explorer). */
export function starterTokens(i: ThemeIntents) {
  return generateTokens(starterConfig(i))
}

export function starterExportCss(i: ThemeIntents) {
  const css = themeToCss(exportTheme(starterConfig(i)))
  return `${css}\n:root{--font-family-primary:${stack(i.type.body || 'Hanken Grotesk')};--font-family-secondary:${stack(i.type.heading || i.type.body || 'Hanken Grotesk')}}\n`
}

export function starterExportJson(i: ThemeIntents) {
  return exportTheme(starterConfig(i))
}

export const STARTER_PROBE_TOKENS = ['--color-background-interactive-primary-default', '--color-background-neutral-primary', '--space-md', '--shape-radius-md', '--font-family-primary', '--size-lg']
