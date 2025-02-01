import { expect, test } from '@playwright/test'

test.describe('advanced marker', async () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advanced-marker')
  })

  test('click events work and will bubble correctly', async ({ page }) => {
    const item = page.getByText('Click here to Expand')
    await expect(item).toBeVisible()
    const toggled = page.getByTestId('toggled')
    await expect(toggled).not.toBeVisible()
    await item.click()
    const count = page.getByTestId('count')
    await expect(toggled).toBeVisible()
    await expect(count).toHaveText('Count: 0')
    const add = page.getByTestId('add')
    await add.click()
    await expect(toggled).toBeVisible()
    await expect(count).toHaveText('Count: 1')
    await item.click()
    await expect(toggled).not.toBeVisible()
  })
})
