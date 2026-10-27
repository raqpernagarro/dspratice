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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What do you need to do?')
  await expect(page.getByTestId('group-clients')).toContainText('Client conversations')
  await expect(page.getByTestId('group-projects')).toContainText('Project work')
  await expect(page.locator('.jgroup .jrow')).toHaveCount(8)
  // the lead fits on one line at desktop width
  expect(await page.locator('.home__lead').evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)))).toBe(1)
  await expect(page.locator('.shell__side .nav__label')).toHaveText(['Home', 'Projects', 'Demos', 'Engagement', 'Settings'])
  await expect(page.getByTestId('home-in-progress')).toContainText('in progress')
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

  // the prompt routes plain words to a journey, with no model call, and says why
  const routes: [string, string, RegExp][] = [
    ['We got an RFP from a bank', 'respond-request', /\/nagarro\/opportunities\/new$/],
    ['Jane needs a prototype on the ASSA ABLOY design system', 'prototype', /\/nagarro\/tools\/assa-prototyping$/],
    ['set up a new design system from scratch', 'new-system', /\/nagarro\/start\?journey=new$/],
  ]
  for (const [text, id, url] of routes) {
    await page.goto('/nagarro')
    await page.getByTestId('home-ask').fill(text)
    await page.getByTestId('home-ask').press('Enter')
    const answer = page.getByTestId('home-answer')
    await expect(answer.locator('.jrow').first()).toHaveAttribute('data-testid', `journey-${id}`)
    await expect(answer).toContainText('Because you wrote')
    await answer.locator('.jrow').first().click()
    await expect(page).toHaveURL(url)
  }
  await shot(page, '22-home-routed')

  // a set-up guide says it has no tool yet and starts with its question
  await page.goto('/nagarro/journeys/product-design')
  await expect(main).toContainText('Set-up guide · no tool yet')
  await expect(page.getByTestId('guide-branch-option')).toHaveCount(3)
  await expect(page.locator('.shell__side [aria-current="page"]')).toHaveText('Home')

  // every journey is one click away from the sheet
  await page.goto('/nagarro')
  await page.getByTestId('group-projects').getByRole('button', { name: /All \d+ journeys/ }).click()
  await expect(page.getByRole('dialog')).toBeInViewport()
  await expect(page.getByRole('dialog').locator('.jrow')).toHaveCount(7)
  await page.keyboard.press('Escape')

  // the old conversations page now lands on Home; Start a project still asks new or existing
  await page.goto('/nagarro/conversations')
  await expect(page).toHaveURL(/\/nagarro$/)
  for (const kind of ['new', 'improve']) {
    await page.goto('/nagarro/start')
    await page.getByTestId(`start-choice-${kind}`).click()
    await expect(page).toHaveURL(new RegExp(`/nagarro/start\\?journey=${kind}$`))
  }

  // practice pages show no client selector; the parent stays selected on detail pages
  await page.goto('/nagarro/knowledge')
  await expect(page).toHaveURL(/\/nagarro\/settings\/sources$/)
  await expect(page.locator('select[aria-label="Project"]')).toHaveCount(0)
  await expect(page.locator('.shell__side [aria-current="page"]')).toHaveText('Settings')
  await page.goto('/nagarro/opportunities/opp-northwind-rfp/response')
  await expect(page.locator('.shell__side [aria-current="page"]')).toHaveText('Projects')
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
  await expect(page.getByTestId('home-in-progress')).toContainText('Nothing in progress yet')
  await page.goto('/nagarro/work')
  await expect(page.getByTestId('continue-empty')).toContainText('Nothing in progress yet')

  expect(errors).toEqual([])
})
