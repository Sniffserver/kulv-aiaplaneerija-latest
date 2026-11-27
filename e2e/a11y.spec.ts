import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const MOCK_OPEN_METEO_RESPONSE = {
  current: {
    temperature_2m: 15.6,
    relative_humidity_2m: 64,
    apparent_temperature: 14.9,
    precipitation: 0,
    weather_code: 2,
    wind_speed_10m: 3.4
  },
  daily: {
    time: [
      '2026-05-15',
      '2026-05-16',
      '2026-05-17',
      '2026-05-18',
      '2026-05-19',
      '2026-05-20',
      '2026-05-21'
    ],
    weather_code: [2, 1, 61, 2, 0, 2, 1],
    temperature_2m_max: [19, 20, 18, 15, 14, 17, 21],
    temperature_2m_min: [8, 9, 7, 2, -1, 4, 10],
    apparent_temperature_min: [7, 8, 6, 1, -2, 3, 9],
    precipitation_sum: [0, 0, 3.2, 0.5, 0, 0, 0],
    precipitation_probability_max: [10, 5, 60, 20, 0, 15, 5]
  },
  hourly: {
    time: ['2026-05-15T09:00', '2026-05-15T12:00', '2026-05-15T15:00'],
    temperature_2m: [13.2, 16.4, 19.0]
  }
};

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
  test.beforeEach(async ({ page }) => {
    await page.route('**/api.open-meteo.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_OPEN_METEO_RESPONSE)
      });
    });
  });

  test('avaleht ja pildid on ligipääsetavad', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await assertAllVisibleImagesLoaded(page, 'home');
    await assertNoCriticalOrSeriousViolations(page, 'home');
  });

  test('2D aiakrundiplaan, soojuskaart ja peenra sahtel on ligipääsetavad', async ({ page }) => {
    await page.goto('/');
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
  });

  test('taimede kataloog ja kalender on ligipääsetavad', async ({ page }) => {
    await page.goto('/');
    await navigateToTab(page, 'plants');
    await expect(page.getByTestId('plant_search_field')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'plants');

    await page.getByTestId('toggle_advanced_filters').click();
    await expect(page.locator('#plant-filter-sun')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'plants-advanced-filters');

    await navigateToTab(page, 'calendar');
    await expect(page.getByTestId('weather_calendar_section')).toBeVisible();
    await assertNoCriticalOrSeriousViolations(page, 'calendar-gantt');

    await page.getByRole('tab', { name: /Kaardid/i }).click();
    await assertNoCriticalOrSeriousViolations(page, 'calendar-cards');
  });

  test('aiapäevik ja blogi on ligipääsetavad', async ({ page }) => {
    await page.goto('/');
    await navigateToTab(page, 'journal');
    await expect(page.getByTestId('fab_add_journal')).toBeVisible();
    await assertAllVisibleImagesLoaded(page, 'journal');
    await assertNoCriticalOrSeriousViolations(page, 'journal');

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
