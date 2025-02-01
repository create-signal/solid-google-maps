import { expect, test } from '@playwright/test'

test.describe('basic behavior', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/basic')
  })

  test('loads google map', async ({ page }) => {
    await expect(
      page
        .locator('div')
        .filter({ hasText: /^To navigate, press the arrow keys\.$/ })
        .nth(1),
    ).toBeAttached()
  })
})
