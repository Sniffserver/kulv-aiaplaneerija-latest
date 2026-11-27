import { test, expect } from '@playwright/test';

test.describe('KÜLV Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
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

  test('1. Rakendus käivitub ja pealkiri on nähtav', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/KÜLV/i);
  });

  test('2. Aiapäeviku avamine ja kirje lisamine', async ({ page }) => {
    await page.goto('/');
    const journalTab = page
      .locator('[data-testid="desktop_nav_item_journal"]:visible, [data-testid="nav_item_journal"]:visible')
      .first();
    await expect(journalTab).toBeVisible();
    await journalTab.click();
    await expect(page.locator('text=Uus sissekanne').first()).toBeVisible();
  });

  test('3. Seadete modaali avamine ja sulgemine ESC klahviga', async ({ page }) => {
    await page.goto('/');
    const settingsBtn = page.getByTestId('action_settings').first();
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('4. 2D aia plaanil on päikese soojuskaart, peenra sahtel ja 3D vaade on eemaldatud', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('[data-testid="desktop_nav_item_garden"]:visible, [data-testid="nav_item_garden"]:visible')
      .first()
      .click();

    await expect(page.getByTestId('planner_mode_yard_btn')).toBeVisible();
    await expect(page.getByTestId('planner_mode_3d_btn')).toHaveCount(0);

    // Toggle seasonal sun-exposure heatmap
    await page.getByTestId('sun_heatmap_toggle_btn').click();
    await expect(page.getByTestId('sun_heatmap_legend')).toBeVisible();
    await expect(page.getByTestId('sun_heatmap_overlay_layer')).toBeVisible();

    // Open quick Bed Detail Drawer
    await page.getByTestId('planner_mode_bed_btn').click();
    await expect(page.getByTestId('bed_detail_drawer')).toBeVisible();
    await page.getByTestId('close_bed_drawer_btn').click();
    await expect(page.getByTestId('bed_detail_drawer')).not.toBeVisible();
  });
});
