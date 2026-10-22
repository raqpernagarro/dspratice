// A new colleague's first minute, in Edge: / opens the hub home, which says what the tool is for,
// who it is for and where to start; every task leads somewhere useful; the header never overlaps
// the logo; the Nagarro fonts load; practice pages show no unrelated client selector.
import { expect, test, type Page } from '@playwright/test'
import { shot } from './shots'

async function headerOverlaps(page: Page) {
  return page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.shell__top > *')).filter((el) => (el as HTMLElement).offsetWidth > 0 && !el.classList.contains('shell__spacer'))
    const boxes = items.map((el) => el.getBoundingClientRect())
    const hits: string[] = []
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom && b.top < a.bottom) hits.push(`${items[i].className} × ${items[j].className}`)
      }
    const logo = document.querySelector('.shell__brand img')!.getBoundingClientRect()
    const brand = document.querySelector('.shell__brand')!.getBoundingClientRect()
    if (logo.right > brand.right + 1) hits.push('logo overflows the brand link')
    return hits
  })
}

test('a new colleague can tell what the hub is for and where to start', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/')
  await expect(page).toHaveURL(/\/nagarro$/)
  const main = page.locator('main')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Use what the practice already knows')
  await expect(main).toContainText('For Nagarro designers, consultants, delivery leads and sellers')
  await expect(main).toContainText('Where do you want to start?')
  for (const t of ['Respond to a client request', 'Start a new design system', 'Improve an existing system', 'Find reusable material', 'Prepare a presentation']) await expect(main).toContainText(t)
  await expect(page.getByTestId('continue-list')).toBeVisible()
  await expect(main).not.toContainText('System health')
  await shot(page, '20-home')

  // fonts: Equip for text, Equip Extended for display headings
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready
    return { equip: document.fonts.check('500 16px "Equip"'), extended: document.fonts.check('500 32px "Equip Extended"') }
  })
  expect(fonts).toEqual({ equip: true, extended: true })

  // the header never overlaps the logo, at 1280 and 1440
  for (const width of [1280, 1440]) {
    await page.setViewportSize({ width, height: 860 })
    await expect.poll(() => headerOverlaps(page)).toEqual([])
  }
  await page.setViewportSize({ width: 1280, height: 860 })
  await shot(page, '21-header-1280')

  // every task card leads to its page
  const tasks: [string, RegExp][] = [
    ['task-respond', /\/nagarro\/opportunities\/new$/],
    ['task-new', /\/nagarro\/start\?journey=new$/],
    ['task-improve', /\/nagarro\/start\?journey=improve$/],
    ['task-library', /\/nagarro\/knowledge$/],
    ['task-deck', /\/nagarro\/presentations$/],
  ]
  for (const [id, url] of tasks) {
    await page.goto('/nagarro')
    await page.getByTestId(id).click()
    await expect(page).toHaveURL(url)
  }

  // practice pages show no client selector; the parent stays selected on detail pages
  await page.goto('/nagarro/knowledge')
  await expect(page.locator('select[aria-label="Project"]')).toHaveCount(0)
  await expect(page.locator('.shell__side [aria-current="page"]')).toHaveText('Knowledge library')
  await page.goto('/nagarro/opportunities/opp-northwind-rfp/response')
  await expect(page.locator('.shell__side [aria-current="page"]')).toHaveText('Opportunities')
  await expect(page.locator('.crumbs')).toContainText('Opportunities')
  await page.goto('/nagarro/clients/northwind/system/tokens')
  await expect(page.locator('.shell__side [aria-current="page"]')).toHaveText('Projects')
  await expect(page.locator('.project-tabs [aria-current="page"]')).toHaveText('Design system')

  // with nothing in progress, the empty state offers a way in
  // edit the saved data from a static file on the same origin, so the running app cannot overwrite it
  await page.goto('/brand/nagarro-logo.svg')
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('unified-ds-tool:v1')!)
    type J = { new: object; improve: object; connect: { status: string }; scan: { status: string }; readout: object; handover: object; mapping: { decisions: object } }
    for (const p of Object.values(raw.state.projects) as { opportunities: object; decks: object; draft: { journey: J } }[]) {
      p.opportunities = {}
      p.decks = {}
      const j = p.draft.journey
      j.new = { currentStep: 1, visited: [], done: [], data: {} }
      j.improve = { currentStep: 1, visited: [], done: [], data: {} }
      j.connect.status = 'idle'
      j.scan.status = 'idle'
      j.readout = {}
      j.handover = {}
      j.mapping.decisions = {}
    }
    localStorage.setItem('unified-ds-tool:v1', JSON.stringify(raw))
  })
  await page.goto('/nagarro')
  await expect(page.getByTestId('continue-empty')).toContainText('Nothing in progress yet')

  expect(errors).toEqual([])
})
