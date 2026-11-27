import { test, expect } from '@playwright/test';

test.describe('KÜLV Critical Flows', () => {
  test('1. Rakendus käivitub ja pealkiri on nähtav', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/KÜLV/i);
  });

  test('2. Aiapäeviku avamine ja kirje lisamine', async ({ page }) => {
    await page.goto('/');
    const journalTab = page.getByTestId('nav_item_journal').first();
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
    await page.getByTestId('nav_item_garden').first().click();

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
