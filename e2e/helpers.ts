/**
 * Browser fixtures reject external requests and retain actionable axe/error diagnostics.
 * How this file was built: Playwright fixture APIs and the official axe adapter.
 * Why: a green screenshot cannot establish keyboard behavior or accessibility compliance.
 */
import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, Page, TestInfo } from '@playwright/test';

export const test = base.extend<{ checkedPage: Page }>({
  checkedPage: async ({ page }, use) => {
    const external: string[] = [];
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'http://127.0.0.1:4173') {
        external.push(url.href);
        return route.abort();
      }
      return route.continue();
    });
    await use(page);
    expect(external, 'No render-time external/CDN requests').toEqual([]);
    expect(errors, 'No uncaught browser errors').toEqual([]);
  },
});
export { expect };

export async function login(page: Page, route = 'dashboard') {
  await page.goto(route);
  await expect(page.locator('app-login')).toBeVisible();
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.locator('app-admin-layout')).toBeVisible();
  await expect(page.locator('#globalLoader')).toHaveCount(0);
}

export async function accessible(page: Page, info: TestInfo) {
  await expect(page.locator('#globalLoader')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const animations = document.getAnimations().filter(animation => {
      const timing = animation.effect?.getComputedTiming();
      return timing && Number.isFinite(timing.endTime);
    });
    await Promise.all(animations.map(animation => animation.finished.catch(() => undefined)));
  });
  const results = await new AxeBuilder({ page }).analyze();
  await info.attach('axe', {
    body: JSON.stringify(
      { violations: results.violations, incomplete: results.incomplete },
      null,
      2
    ),
    contentType: 'application/json',
  });
  expect(results.violations, 'All enabled axe rules').toEqual([]);
}
