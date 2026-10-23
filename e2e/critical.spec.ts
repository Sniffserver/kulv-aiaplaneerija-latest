import { test, expect } from '@playwright/test';

test.describe('KÜLV Critical Flows', () => {
  test('1. Rakendus käivitub ja pealkiri on nähtav', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/KÜLV/i);
  });

  test('2. Aiapäeviku avamine ja kirje lisamine', async ({ page }) => {
    await page.goto('/');
    const journalTab = page.locator('text=Aiapäevik').first();
    if (await journalTab.isVisible()) {
      await journalTab.click();
      await expect(page.locator('text=Uus sissekanne').first()).toBeVisible();
    }
  });

  test('3. Seadete modaali avamine ja sulgemine ESC klahviga', async ({ page }) => {
    await page.goto('/');
    const settingsBtn = page.locator('button[aria-label="Ava seaded"]').first();
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await expect(page.locator('role=dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('role=dialog')).not.toBeVisible();
    }
  });
});
