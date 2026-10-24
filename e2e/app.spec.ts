import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Deterministic mock for weather API preventing network flakiness in E2E tests
  await page.route('**/api/weather**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        temperature: 14.5,
        humidity: 68,
        description: 'Vahelduv pilvisus',
        windSpeed: 3.2,
        isFrostWarning: false
      })
    });
  });
});

test('loads home and navigates to garden', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('KÜLV').first()).toBeVisible();

  await page.locator('[data-testid="nav_item_garden"]:visible').first().click();

  await expect(page).toHaveURL(/#garden/);
});

test('opens and closes settings dialog', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('action_settings').click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(dialog).toBeHidden();
});
