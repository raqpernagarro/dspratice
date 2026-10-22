// Carolina Baptista's template registry (generated from the vendored engine by
// scripts/sync-nagarro-slides.mjs). Used to validate every slide spec before it is rendered.
import catalog from './catalog.generated.json'
import engine from './engine.generated.json'

export interface TemplateInfo { name: string; family: string; role: string; category: string; shape: string; theme: string; capacity: { items: number; min: number; max: number }; slots: Record<string, number>; use: string; schema: Record<string, string> | null }

export const TEMPLATES = (catalog as unknown as { templates: TemplateInfo[] }).templates
export const TEMPLATE_BY_NAME = new Map(TEMPLATES.map((t) => [t.name, t]))
export const ENGINE = engine as { name: string; owner: string; artifact: string; artifactVersion: string; upstream: string; templates: number; syncedAt: string }

export function templateInfo(name: string) {
  return TEMPLATE_BY_NAME.get(name)
}
