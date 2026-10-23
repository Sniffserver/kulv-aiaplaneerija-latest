import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('KÜLV Accessibility (axe-core)', () => {
  test('peamine leht on ligipääsetav ilma kriitiliste vigadeta', async ({ page }) => {
    await page.goto('/');
    // Analyze page accessibility
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    // Document violations in test output
    if (criticalViolations.length > 0) {
      console.warn('Axe Accessibility Violations:', JSON.stringify(criticalViolations, null, 2));
    }

    expect(criticalViolations).toHaveLength(0);
  });
});
