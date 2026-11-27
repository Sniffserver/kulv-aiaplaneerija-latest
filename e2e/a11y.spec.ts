import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function assertNoCriticalOrSeriousViolations(page: Page, viewLabel: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const violations = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  if (violations.length > 0) {
    console.warn(
      `Axe Accessibility Violations on "${viewLabel}":`,
      JSON.stringify(
        violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary }))
        })),
        null,
        2
      )
    );
  }

  expect(violations, `Expected 0 critical/serious axe violations on "${viewLabel}"`).toHaveLength(0);
}

async function assertAllVisibleImagesLoaded(page: Page, viewLabel: string) {
  const brokenImages = await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const broken: string[] = [];
    for (const img of imgs) {
      const style = window.getComputedStyle(img);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      img.scrollIntoView({ block: 'nearest' });
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 2500);
          img.addEventListener('load', () => { clearTimeout(timer); resolve(); }, { once: true });
          img.addEventListener('error', () => { clearTimeout(timer); resolve(); }, { once: true });
        });
      }
      if (!img.complete || img.naturalWidth === 0) {
        broken.push(img.getAttribute('src') || 'unknown-src');
      }
    }
    return broken;
  });

  expect(brokenImages, `Expected 0 broken images on "${viewLabel}"`).toHaveLength(0);
}

async function navigateToTab(page: Page, tabId: 'home' | 'garden' | 'plants' | 'calendar' | 'journal' | 'blog') {
  const navBtn = page
    .locator(`[data-testid="desktop_nav_item_${tabId}"]:visible, [data-testid="nav_item_${tabId}"]:visible`)
    .first();
  await expect(navBtn).toBeVisible();
  await navBtn.click();
}

test.describe('KÜLV Accessibility Audit (axe-core WCAG 2.1 AA)', () => {
  test('kõik vaated on ligipääsetavad ilma kriitiliste või tõsiste vigadeta', async ({ page }) => {
    await page.goto('/');

    // 1. Home view
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await assertAllVisibleImagesLoaded(page, 'home');
    await assertNoCriticalOrSeriousViolations(page, 'home');

    // 2. Garden 2D Yard Plan + Sun Heatmap + Bed Detail Drawer
    await navigateToTab(page, 'garden');
    await expect(page.getByTestId('planner_mode_yard_btn')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'garden-yard-plan');

    await page.getByTestId('sun_heatmap_toggle_btn').click();
    await expect(page.getByTestId('sun_heatmap_legend')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'garden-sun-heatmap');

    await page.getByTestId('planner_mode_bed_btn').click();
    await expect(page.getByTestId('bed_detail_drawer')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'garden-bed-detail-drawer');
    await page.getByTestId('close_bed_drawer_btn').click();
    await expect(page.getByTestId('bed_detail_drawer')).not.toBeVisible();

    // 3. Plants Catalog + Advanced Filters
    await navigateToTab(page, 'plants');
    await expect(page.getByTestId('plant_search_field')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'plants');

    await page.getByTestId('toggle_advanced_filters').click();
    await expect(page.locator('#plant-filter-sun')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'plants-advanced-filters');

    // 4. Calendar (Gantt + Cards view)
    await navigateToTab(page, 'calendar');
    await expect(page.getByTestId('weather_calendar_section')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'calendar-gantt');

    await page.getByRole('tab', { name: /Kaardid/i }).click();
    await assertNoCriticalOrSeriousViolations(page, 'calendar-cards');

    // 5. Journal
    await navigateToTab(page, 'journal');
    await expect(page.getByTestId('fab_add_journal')).toBeVisible();
    await assertAllVisibleImagesLoaded(page, 'journal');
    await assertNoCriticalOrSeriousViolations(page, 'journal');

    // 6. Blog (list + article view)
    await navigateToTab(page, 'blog');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'blog-list');

    await page.locator('button:has-text("Loe edasi"), button:has-text("Read article")').first().click();
    await expect(page.locator('article')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'blog-article');
  });

  test('tume režiim ja pildid on ligipääsetavad kõigis põhivaadetes', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => document.documentElement.classList.add('dark'));

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await assertAllVisibleImagesLoaded(page, 'home-dark');
    await assertNoCriticalOrSeriousViolations(page, 'home-dark');

    await navigateToTab(page, 'garden');
    await expect(page.getByTestId('planner_mode_yard_btn')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'garden-dark');

    await navigateToTab(page, 'plants');
    await expect(page.getByTestId('plant_search_field')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'plants-dark');
  });
});
