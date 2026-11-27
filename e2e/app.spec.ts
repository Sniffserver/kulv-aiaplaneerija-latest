import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Deterministic mock for weather APIs preventing network flakiness and rate limits in E2E tests
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

  await page.route('**/api.open-meteo.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: {
          temperature_2m: 14.5,
          relative_humidity_2m: 68,
          apparent_temperature: 13.8,
          precipitation: 0,
          weather_code: 2,
          wind_speed_10m: 3.2
        },
        daily: {
          time: ['2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21'],
          weather_code: [2, 1, 0, 2, 1, 2, 1],
          temperature_2m_max: [18, 19, 20, 17, 16, 17, 19],
          temperature_2m_min: [7, 8, 9, 5, 4, 6, 8],
          apparent_temperature_min: [6, 7, 8, 4, 3, 5, 7],
          precipitation_sum: [0, 0, 0, 0.2, 0, 0, 0],
          precipitation_probability_max: [10, 5, 5, 20, 10, 15, 5]
        },
        hourly: {
          time: ['2026-05-15T09:00', '2026-05-15T12:00', '2026-05-15T15:00'],
          temperature_2m: [12.1, 14.2, 14.5]
        }
      })
    });
  });
});

test('loads home and navigates to garden', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('KÜLV').first()).toBeVisible();

  await page
    .locator('[data-testid="desktop_nav_item_garden"]:visible, [data-testid="nav_item_garden"]:visible')
    .first()
    .click();

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
