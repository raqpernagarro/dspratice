// Northwind, end to end in Edge: context → requirements → evidence → rule-based draft → checks and
// edits kept on redraft → the original request from any step → exports → a summary in the client
// demo → deck on Carolina's engine → live demo from a slide and back → out-of-date flag.
import { expect, test, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { shot } from './shots'

const OPP = '/nagarro/opportunities/opp-northwind-rfp'
const main = (page: Page) => page.locator('main')

async function download(page: Page, click: () => Promise<void>) {
  const [d] = await Promise.all([page.waitForEvent('download'), click()])
  const path = await d.path()
  return { name: d.suggestedFilename(), text: readFileSync(path!, 'utf8') }
}

test('Northwind RFP: from request to a checked draft, the client demo and a deck', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto('/nagarro')
  await expect(page.getByRole('heading', { name: /Use what the practice/ })).toBeVisible()
  await shot(page, '01-home')

  // 3 · context
  await page.goto(`${OPP}/context`)
  await page.getByTestId('confirm-context').click()
  await page.getByTestId('opp-continue').click()

  // 4 · requirements: analyse, edit one, restore it
  await expect(page).toHaveURL(/\/requirements$/)
  await page.getByTestId('analyze-request').click()
  await expect(main(page).getByText('15 requirements')).toBeVisible()
  await expect(main(page).getByText('Not from documents · Pricing')).toBeVisible()
  const first = main(page).locator('[data-testid^="req-text-"]').first()
  const original = await first.inputValue()
  await first.fill('Describe how you would assess our design system for AI tools.')
  await first.blur()
  const reqId = (await first.getAttribute('data-testid'))!.replace('req-text-', '')
  await page.getByTestId(`restore-${reqId}`).click()
  await expect(first).toHaveValue(original)
  await shot(page, '02-requirements')
  await page.getByTestId('opp-continue').click()

  // 5 · sources: Contoso's questionnaire never appears, its approved reusable note does
  await page.getByTestId('find-evidence').click()
  await expect(main(page).getByText('Recommended for this request')).toBeVisible()
  await expect(main(page).getByText('Design Systems offer deck').first()).toBeVisible()
  await expect(main(page).getByText('Three brands on one foundation (reusable note, sample)').first()).toBeVisible()
  await expect(main(page).getByText('Contoso Bank: vendor questionnaire (sample)')).toHaveCount(0)
  await shot(page, '03-sources')
  await page.getByTestId('opp-continue').click()

  // draft: rule-based label, open questions, conflict, evidence; checks; an edit survives a redraft
  await page.getByTestId('draft-template').click()
  await expect(main(page).getByText('Drafted by rules (no AI)').first()).toBeVisible()
  await expect(page.getByTestId('conflicts')).toContainText('Package names')
  await expect(page.getByTestId('approach-card')).toContainText('2-week AI audit')
  await expect(page.getByTestId('coverage-summary')).toContainText('open')
  await expect(page.getByTestId('to-review')).toContainText('15 answers to check')
  await main(page).locator('[data-testid^="check-"]').first().check()
  await expect(page.getByTestId('to-review')).toContainText('14 answers to check')
  await expect(page.getByTestId('opp-step-response')).not.toHaveClass(/is-done/)

  // the original request is one click away from the draft
  await page.getByTestId('view-request').click()
  await expect(page.getByRole('dialog')).toContainText('The request, as received')
  await expect(page.getByTestId('request-view')).toContainText('Northwind')
  await page.getByRole('dialog').getByRole('button', { name: /close/i }).click()
  const section = main(page).locator('article[data-testid^="draft-"]').nth(1)
  await section.locator('[data-testid^="edit-"]').click()
  const edited = 'Edited by the bid team: we start with a two-week read of Figma and code.'
  await section.locator('[data-testid^="body-"]').fill(edited)
  await page.getByTestId('draft-template').click()
  await page.getByTestId('regenerate-confirm').click()
  await expect(main(page).getByText('v2 ·').first()).toBeVisible()
  await expect(main(page).locator('article[data-testid^="draft-"]').nth(1)).toContainText(edited)
  await expect(main(page).locator('article[data-testid^="draft-"]').nth(1)).toContainText('kept from v1')
  await shot(page, '04-response', true)
  await page.getByTestId('opp-continue').click()

  // share and present: exports, then a summary in the client demo
  const md = await download(page, () => page.getByTestId('export-response-md').click())
  expect(md.name).toMatch(/\.md$/)
  expect(md.text).toContain('Northwind Retail')
  const csv = await download(page, () => page.getByTestId('export-requirements-csv').click())
  expect(csv.name).toMatch(/\.csv$/)
  const packet = await download(page, () => page.getByTestId('export-packet').click())
  expect(packet.text).toMatch(/reference material/i)
  expect(packet.text).not.toContain('CONTOSO-ISOLATION-MARKER')

  await page.getByTestId('publish-open').click()
  await expect(page.getByRole('dialog')).toContainText('still quotes internal-only material')
  await page.getByTestId('publish-confirm').click()
  await expect(main(page).getByText('In the client demo · summary of v2')).toBeVisible()
  await shot(page, '05-export')

  // create Northwind's first client demo version, then preview the summary in the client demo
  await page.goto('/nagarro/clients/northwind')
  await page.getByTestId('update-demo').click()
  await expect(page.locator('.version-pill')).toContainText('Client demo shows v1')
  await page.goto(`${OPP}/export`)
  await page.getByTestId('see-as-client').click()
  await expect(page).toHaveURL(/\/client\/northwind\/evidence\/proposal$/)
  const summary = page.getByTestId('client-published-summary')
  await expect(summary).toContainText('Our understanding')
  await expect(summary).toContainText(edited)
  for (const internal of ['Battle card', 'Case studies', 'practice documents', 'Pricing is not part']) await expect(summary).not.toContainText(internal)
  await shot(page, '06-client-proposal-summary', true)

  // deck on Carolina's engine
  await page.goto(`${OPP}/export`)
  await page.getByTestId('prepare-presentation').click()
  await page.getByTestId('build-deck').click()
  await page.getByTestId('approve-plan').click()
  const frame = page.frameLocator('[data-testid="slides-frame"]')
  await expect(frame.locator('section')).toHaveCount(13)
  await expect(frame.locator('body')).toContainText('Prepared for Northwind Retail')
  await shot(page, '07-deck-slides')
  await main(page).getByRole('tab', { name: 'Share' }).or(main(page).getByRole('button', { name: 'Share', exact: true })).first().click()
  await expect(main(page)).toContainText('does not produce PowerPoint')
  const deckJson = await download(page, () => page.getByTestId('export-deck-json').click())
  expect(JSON.parse(deckJson.text).slides).toHaveLength(13)
  const html = await download(page, () => page.getByTestId('export-deck-html').click())
  expect(html.text).toContain('NagarroSlides')
  const deckUrl = page.url()

  await page.getByTestId('present-deck').click()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.present-bar')).toContainText('2 / 13')
  await shot(page, '08-present')

  // from the demo slide into the live demo, then back to the same slide
  const demoSlide = await page.evaluate(() => {
    const raw = localStorage.getItem('unified-ds-tool:v1')
    const deck = Object.values(JSON.parse(raw!).state.projects.northwind.decks)[0] as { slides: { demoLink?: unknown }[] }
    return deck.slides.findIndex((s) => s.demoLink)
  })
  for (let i = 1; i < demoSlide; i++) await page.keyboard.press('ArrowRight')
  await expect(page.locator('.present-bar')).toContainText(`${demoSlide + 1} / 13`)
  await page.getByTestId('present-open-demo').click()
  await expect(page).toHaveURL(/\/client\/demo-brand/)
  await expect(page.locator('.demobar__headline')).toBeVisible()
  await page.getByTestId('back-to-preparation').click()
  await expect(page).toHaveURL(deckUrl.split('?')[0])
  await expect(page.locator('.present-bar')).toContainText(`${demoSlide + 1} / 13`)
  await page.keyboard.press('Escape')

  // a source changes approval → the deck says it is out of date and offers a rebuild
  await page.goto('/nagarro/knowledge/src-offer-deck')
  await main(page).getByRole('button', { name: 'Mark out of date' }).click()
  await page.goto(deckUrl)
  await expect(page.getByTestId('rebuild-deck')).toBeVisible()
  await shot(page, '09-deck-outdated')

  expect(errors.filter((e) => !/favicon|ResizeObserver/.test(e))).toEqual([])
})
