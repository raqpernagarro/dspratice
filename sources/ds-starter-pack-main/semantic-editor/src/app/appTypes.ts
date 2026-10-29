import type { AppTypeId } from '../../../stories/base-ui/tokens/project-file'

export interface AppType {
  id: AppTypeId
  name: string
  description: string
  /** Example screens this type previews in Edit theme and offers in Prototype. */
  screens: string[]
  /** Prototype prompt ideas for this kind of product. */
  ideas: string[]
}

export const APP_TYPES: AppType[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Data-dense views, charts and KPIs.',
    screens: ['Overview'],
    ideas: ['A revenue overview with KPIs, a trend chart and top accounts', 'A team activity feed with filters', 'A usage report for the last 30 days'],
  },
  {
    id: 'admin',
    name: 'Admin panel',
    description: 'Tables, filters and edit forms.',
    screens: ['Users'],
    ideas: ['A user list with search, role filters and bulk actions', 'An edit form for a customer record', 'An audit log with status badges'],
  },
  {
    id: 'marketing',
    name: 'Marketing website',
    description: 'Expressive type, big imagery, calls to action.',
    screens: ['Landing page'],
    ideas: ['A landing page hero with three feature cards', 'A pricing page with three plans', 'A contact page with a short form'],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Product grids, cart and checkout.',
    screens: ['Product list'],
    ideas: ['A product grid with filters and sorting', 'A checkout page with order summary', 'A product detail page with size options'],
  },
  {
    id: 'internal-tool',
    name: 'Internal tool',
    description: 'Forms-heavy workflows and approvals.',
    screens: ['Request form'],
    ideas: ['An expense request form with approvals', 'An approval queue with status and actions', 'A settings page with notification switches'],
  },
  {
    id: 'content',
    name: 'Content or docs site',
    description: 'Long-form reading and navigation.',
    screens: ['Article'],
    ideas: ['A help article with breadcrumbs and related links', 'A blog index with featured posts', 'A search results page'],
  },
  {
    id: 'mobile',
    name: 'Mobile-first app',
    description: 'Touch targets, bottom navigation, cards.',
    screens: ['Home feed'],
    ideas: ['A mobile home feed with cards and a bottom bar', 'A mobile profile screen', 'A mobile onboarding step'],
  },
]

export const appType = (id: AppTypeId) => APP_TYPES.find((t) => t.id === id) ?? APP_TYPES[0]

/** owner/repo from a GitHub URL, or null. */
export function githubRepo(url: string): string | null {
  const match = url.trim().match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/)
  return match ? `${match[1]}/${match[2]}` : null
}

/** The file key in a Figma URL (figma.com/design/<KEY>/… or /file/<KEY>/…), or null. */
export function figmaFileKey(url: string): string | null {
  const match = url.trim().match(/figma\.com\/(?:design|file)\/([A-Za-z0-9]+)/)
  return match ? match[1] : null
}
