import type { AppTypeId } from '../../../stories/base-ui/tokens/project-file'
import type { UiNode } from './schema'

/** One example screen per product type, written in the same vocabulary the agent uses. */

const h = (type: string, props: Record<string, unknown> = {}, children: (UiNode | string)[] = []): UiNode => ({ type, props, children })

const dashboard: UiNode = h(
  'appShell',
  {
    brand: 'Pulse',
    user: 'MR',
    nav: [
      { label: 'Overview', icon: 'house', active: true },
      { label: 'Reports', icon: 'chart' },
      { label: 'Customers', icon: 'users' },
      { label: 'Billing', icon: 'credit-card' },
      { label: 'Settings', icon: 'gear' },
    ],
  },
  [
    h('pageHeader', { eyebrow: 'October', title: 'Good morning, Maya', subtitle: 'Here’s how the business is doing this month.' }, [
      h('button', { label: 'Export', variant: 'secondary', icon: 'download' }),
      h('button', { label: 'New report', icon: 'plus' }),
    ]),
    h('grid', { columns: 4, gap: 'md' }, [
      h('stat', { label: 'Revenue', value: '€128.4k', delta: '+12.4%', trend: 'up' }),
      h('stat', { label: 'Active customers', value: '2,318', delta: '+4.1%', trend: 'up' }),
      h('stat', { label: 'Churn', value: '1.8%', delta: '−0.3%', trend: 'up' }),
      h('stat', { label: 'Open tickets', value: '42', delta: '+9', trend: 'down' }),
    ]),
    h('grid', { columns: 3, gap: 'md' }, [
      h('box', { surface: 'primary', border: true, radius: 'lg', padding: 'lg' }, [
        h('stack', { direction: 'row', justify: 'between', align: 'center' }, [
          h('heading', { text: 'Revenue', level: 3 }),
          h('badge', { label: 'Live', tone: 'success' }),
        ]),
        h('chart', { kind: 'bar', values: [42, 51, 47, 58, 62, 55, 70, 74, 68, 81, 86, 92], labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'], height: 180 }),
      ]),
      h('box', { surface: 'primary', border: true, radius: 'lg', padding: 'lg' }, [
        h('heading', { text: 'Goals', level: 3 }),
        h('stack', { gap: 'lg' }, [
          h('progress', { label: 'Quarterly revenue', value: 72 }),
          h('progress', { label: 'New customers', value: 54 }),
          h('meter', { label: 'Support load', value: 38 }),
        ]),
      ]),
      h('box', { surface: 'primary', border: true, radius: 'lg', padding: 'lg' }, [
        h('heading', { text: 'Top accounts', level: 3 }),
        h('list', {
          items: [
            { title: 'Northwind', subtitle: 'Enterprise', meta: '€24k', initials: 'NW' },
            { title: 'Contoso', subtitle: 'Growth', meta: '€18k', initials: 'CO' },
            { title: 'Fabrikam', subtitle: 'Growth', meta: '€12k', initials: 'FA' },
          ],
        }),
      ]),
    ]),
  ],
)

const admin: UiNode = h(
  'appShell',
  {
    brand: 'Console',
    user: 'JS',
    nav: [
      { label: 'Users', icon: 'users', active: true },
      { label: 'Roles', icon: 'shield' },
      { label: 'Audit log', icon: 'clock' },
      { label: 'Settings', icon: 'gear' },
    ],
  },
  [
    h('breadcrumb', { items: ['Admin', 'Users'] }),
    h('pageHeader', { title: 'Users', subtitle: '128 people have access to this workspace.' }, [h('button', { label: 'Invite user', icon: 'plus' })]),
    h('alert', { tone: 'info', title: 'Single sign-on is on.', text: 'New users join through your identity provider.' }),
    h('stack', { direction: 'row', gap: 'sm', align: 'end', wrap: true }, [
      h('input', { placeholder: 'Search by name or email', search: true }),
      h('select', { label: 'Role', placeholder: 'All roles', options: ['Admin', 'Editor', 'Viewer'] }),
      h('select', { label: 'Status', placeholder: 'Any status', options: ['Active', 'Invited', 'Suspended'] }),
    ]),
    h('table', {
      columns: ['Name', 'Email', 'Role', 'Status', 'Last active'],
      rows: [
        [{ avatar: 'AL', text: 'Ana Lopes' }, 'ana@acme.com', 'Admin', { badge: 'Active', tone: 'success' }, '2 min ago'],
        [{ avatar: 'BK', text: 'Ben Kraus' }, 'ben@acme.com', 'Editor', { badge: 'Active', tone: 'success' }, '1 h ago'],
        [{ avatar: 'CN', text: 'Chloé Nguyen' }, 'chloe@acme.com', 'Viewer', { badge: 'Invited', tone: 'info' }, '—'],
        [{ avatar: 'DO', text: 'Dev Okafor' }, 'dev@acme.com', 'Editor', { badge: 'Suspended', tone: 'warning' }, '3 weeks ago'],
        [{ avatar: 'EM', text: 'Eva Mills' }, 'eva@acme.com', 'Viewer', { badge: 'Active', tone: 'success' }, 'Yesterday'],
      ],
    }),
    h('stack', { direction: 'row', justify: 'between', align: 'center' }, [h('text', { text: 'Showing 1–5 of 128', size: 'sm' }), h('pagination', { pageCount: 26, page: 1 })]),
  ],
)

const marketing: UiNode = h('stack', { gap: '2xl' }, [
  h('topNav', { brand: 'Lumen', links: ['Product', 'Pricing', 'Customers', 'Docs'], cta: 'Start free' }),
  h('box', { padding: 'xl', maxWidth: 760 }, [
    h('stack', { gap: 'lg', align: 'center' }, [
      h('badge', { label: 'New · Lumen 3.0', tone: 'info' }),
      h('heading', { text: 'Ship beautiful products, faster', level: 1 }),
      h('text', { text: 'Lumen gives your team one place to plan, design and launch. No more lost files or endless threads.', size: 'lg', align: 'center' }),
      h('stack', { direction: 'row', gap: 'sm' }, [h('button', { label: 'Start for free', size: 'lg', trailIcon: 'arrow-right' }), h('button', { label: 'Watch demo', size: 'lg', variant: 'outline', icon: 'play' })]),
    ]),
  ]),
  h('image', { label: 'Product screenshot', ratio: '16:9' }),
  h('grid', { columns: 3, gap: 'lg' }, [
    h('card', { title: 'Plan together', description: 'Roadmaps everyone can read.' }, [h('icon', { name: 'calendar', tone: 'accent' })]),
    h('card', { title: 'Design in context', description: 'Specs linked to every task.' }, [h('icon', { name: 'pencil', tone: 'accent' })]),
    h('card', { title: 'Launch with confidence', description: 'Checklists and approvals built in.' }, [h('icon', { name: 'rocket', tone: 'accent' })]),
  ]),
])

const ecommerce: UiNode = h('stack', { gap: 'lg' }, [
  h('topNav', { brand: 'Fieldnote', links: ['New', 'Men', 'Women', 'Sale'], cta: 'Cart (2)' }),
  h('breadcrumb', { items: ['Home', 'Women', 'Jackets'] }),
  h('pageHeader', { title: 'Jackets', subtitle: '48 products' }, [h('select', { label: 'Sort by', value: 'Featured', options: ['Featured', 'Newest', 'Price: low to high', 'Price: high to low'] })]),
  h('grid', { columns: 4, gap: 'lg' }, [
    h('stack', { gap: 'md' }, [
      h('heading', { text: 'Filters', level: 4 }),
      h('checkbox', { label: 'Waterproof', checked: true }),
      h('checkbox', { label: 'Recycled materials' }),
      h('checkbox', { label: 'On sale' }),
      h('separator'),
      h('radioGroup', { label: 'Size', options: ['S', 'M', 'L', 'XL'], value: 'M' }),
    ]),
    ...[
      ['Harbour rain jacket', '€189', 'Bestseller'],
      ['Fell softshell', '€149', ''],
      ['Coastline parka', '€249', 'New'],
      ['Ridge wind shell', '€119', ''],
      ['Moor quilted jacket', '€169', 'Sale'],
      ['Tide anorak', '€139', ''],
    ].map(([name, price, tag]) =>
      h('stack', { gap: 'xs' }, [
        h('image', { label: name, ratio: '3:4' }),
        h('stack', { direction: 'row', justify: 'between', align: 'center' }, [h('text', { text: name, tone: 'primary', strong: true }), tag ? h('badge', { label: tag, tone: tag === 'Sale' ? 'error' : 'neutral' }) : h('text', { text: '' })]),
        h('text', { text: price }),
      ]),
    ),
  ]),
])

const internalTool: UiNode = h(
  'appShell',
  {
    brand: 'Helpdesk',
    user: 'TP',
    nav: [
      { label: 'My requests', icon: 'file', active: true },
      { label: 'Approvals', icon: 'check' },
      { label: 'Team', icon: 'users' },
    ],
  },
  [
    h('breadcrumb', { items: ['My requests', 'New expense'] }),
    h('pageHeader', { title: 'New expense request', subtitle: 'Most requests are approved within one working day.' }),
    h('grid', { columns: 3, gap: 'xl' }, [
      h('box', { surface: 'primary', border: true, radius: 'lg', padding: 'xl' }, [
        h('stack', { gap: 'lg' }, [
          h('input', { label: 'Title', placeholder: 'Client dinner in Lisbon' }),
          h('grid', { columns: 2, gap: 'md' }, [h('input', { label: 'Amount (€)', placeholder: '0.00' }), h('select', { label: 'Category', placeholder: 'Choose', options: ['Travel', 'Meals', 'Software', 'Equipment'] })]),
          h('input', { label: 'Cost centre', placeholder: 'e.g. CC-1042', description: 'Ask your manager if you are not sure.' }),
          h('radioGroup', { label: 'Paid with', options: ['Company card', 'Personal card (reimburse me)'], value: 'Company card' }),
          h('switch', { label: 'Notify me when it’s approved', checked: true }),
          h('separator'),
          h('stack', { direction: 'row', justify: 'end', gap: 'sm' }, [h('button', { label: 'Save draft', variant: 'secondary' }), h('button', { label: 'Submit request' })]),
        ]),
      ]),
      h('stack', { gap: 'md' }, [
        h('alert', { tone: 'warning', title: 'Receipt needed', text: 'Expenses over €50 need a receipt.' }),
        h('card', { title: 'Approval path', description: 'Who will review this request.' }, [
          h('list', {
            items: [
              { title: 'Rita Pires', subtitle: 'Team lead', meta: 'Step 1', initials: 'RP' },
              { title: 'Finance', subtitle: 'Shared inbox', meta: 'Step 2', initials: 'FI' },
            ],
          }),
        ]),
      ]),
    ]),
  ],
)

const content: UiNode = h('stack', { gap: 'xl' }, [
  h('topNav', { brand: 'Docs', links: ['Guides', 'API', 'Changelog'], cta: 'Sign in' }),
  h('grid', { columns: 4, gap: 'xl' }, [
    h('stack', { gap: 'sm' }, [
      h('input', { placeholder: 'Search the docs', search: true }),
      h('text', { text: 'Getting started', tone: 'primary', strong: true }),
      h('link', { text: 'Install' }),
      h('link', { text: 'Your first project' }),
      h('link', { text: 'Inviting your team' }),
      h('text', { text: 'Guides', tone: 'primary', strong: true }),
      h('link', { text: 'Permissions' }),
      h('link', { text: 'Billing' }),
    ]),
    h('box', { padding: 'none' }, [
      h('stack', { gap: 'lg' }, [
        h('breadcrumb', { items: ['Docs', 'Getting started', 'Your first project'] }),
        h('heading', { text: 'Create your first project', level: 1 }),
        h('text', { text: 'Projects keep your work, your files and your team in one place. This guide takes about five minutes.', size: 'lg' }),
        h('alert', { tone: 'info', title: 'Before you start', text: 'You need an account with editor access.' }),
        h('heading', { text: '1. Name your project', level: 3 }),
        h('text', { text: 'Choose a short name your team will recognise. You can rename it at any time from the project settings.' }),
        h('image', { label: 'The new project dialog', ratio: '16:9' }),
        h('heading', { text: '2. Invite your team', level: 3 }),
        h('text', { text: 'Add people by email. They get an invite and can join with one click.' }),
        h('stack', { direction: 'row', justify: 'between' }, [h('button', { label: 'Install', variant: 'ghost', icon: 'arrow-left' }), h('button', { label: 'Inviting your team', variant: 'ghost', trailIcon: 'arrow-right' })]),
      ]),
    ]),
    h('stack', { gap: 'sm' }, [h('text', { text: 'On this page', tone: 'primary', strong: true }), h('link', { text: 'Name your project' }), h('link', { text: 'Invite your team' })]),
  ]),
])

const mobile: UiNode = h(
  'mobileShell',
  {
    title: 'Today',
    tabs: [
      { label: 'Home', icon: 'house', active: true },
      { label: 'Search', icon: 'search' },
      { label: 'Saved', icon: 'heart' },
      { label: 'Profile', icon: 'user' },
    ],
  },
  [
    h('stack', { direction: 'row', gap: 'sm', align: 'center' }, [h('avatar', { initials: 'LS' }), h('stack', { gap: '2xs' }, [h('text', { text: 'Hi Lena', tone: 'primary', strong: true }), h('text', { text: '3 workouts this week', size: 'sm' })])]),
    h('card', { title: 'Morning run', description: '5 km · easy pace', elevated: true }, [h('progress', { label: 'Weekly goal', value: 60 }), h('button', { label: 'Start', icon: 'play' })]),
    h('tabs', { items: ['For you', 'Following'], value: 'For you' }, [
      h('list', {
        items: [
          { title: 'Mobility in 10 minutes', subtitle: 'Video · Beginner', meta: '10′', initials: 'MO' },
          { title: 'Fuel for long runs', subtitle: 'Article', meta: '4′', initials: 'FU' },
          { title: 'Sleep and recovery', subtitle: 'Podcast', meta: '28′', initials: 'SL' },
        ],
      }),
    ]),
  ],
)

export const EXAMPLE_SCREENS: Record<AppTypeId, { title: string; tree: UiNode }> = {
  dashboard: { title: 'Overview', tree: dashboard },
  admin: { title: 'Users', tree: admin },
  marketing: { title: 'Landing page', tree: marketing },
  ecommerce: { title: 'Product list', tree: ecommerce },
  'internal-tool': { title: 'Request form', tree: internalTool },
  content: { title: 'Article', tree: content },
  mobile: { title: 'Home feed', tree: mobile },
}
