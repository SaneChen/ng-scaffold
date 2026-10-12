/**
 * Scan every routed page in desktop/mobile Chrome, without rule exclusions or CDN access.
 * How this file was built: route-derived Playwright tests and axe's default enabled rules.
 * Why: smoke tests of the dashboard alone miss lazy demo and responsive control regressions.
 */
import { accessible, expect, login, test } from './helpers';
import routes from './route-inventory.json';

for (const route of routes) {
  test(`axe ${route}`, async ({ checkedPage: page }, info) => {
    if (route.startsWith('auth/')) await page.goto(route);
    else await login(page, route);
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/ng-scaffold/${route}$`));
    await accessible(page, info);
  });
}
