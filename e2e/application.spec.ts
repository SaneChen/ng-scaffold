/**
 * Exercise auth, lazy navigation, persisted settings and keyboard focus on the actual build.
 * How this file was built: Playwright tests written against public accessible UI controls.
 * Why: integration across routing, overlay direction and translated forms needs a real browser.
 */
import { accessible, expect, login, test } from './helpers';

test('responsive side navigation and desktop top navigation follow menu links', async ({
  checkedPage: page,
}, info) => {
  await login(page);
  const mobile = info.project.name === 'mobile';
  const toggle = page
    .locator('app-header')
    .getByRole('button', { name: 'Navigation menu', exact: true });
  if (mobile) await toggle.click();
  const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await navigation.getByRole('button', { name: /^Design/ }).click();
  await accessible(page, info);
  await navigation.getByRole('link', { name: 'Color System', exact: true }).click();
  await expect(page).toHaveURL(/design\/colors$/);
  await expect(page.locator('app-design-colors')).toBeVisible();
  if (mobile) {
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
  } else {
    await page.getByRole('button', { name: 'Layout settings', exact: true }).click();
    await page.getByRole('dialog').getByRole('radio', { name: 'Top', exact: true }).check();
    await page.keyboard.press('Escape');
    const top = page.locator('app-topmenu');
    await expect(top).toBeVisible();
    await top.getByRole('button', { name: /^Design/ }).click();
    await accessible(page, info);
    await page.getByRole('menuitem', { name: 'Material Icons', exact: true }).click();
    await expect(page).toHaveURL(/design\/icons$/);
  }
});

test('login validation, rejected credentials, return URL and logout', async ({
  checkedPage: page,
}, info) => {
  await page.goto('profile/settings');
  await expect(page).toHaveURL(/auth\/login\?returnUrl=/);
  await accessible(page, info);
  const username = page.getByRole('textbox', { name: 'Username' });
  await username.fill('');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(username).toBeFocused();
  await username.fill('wrong');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('alert')).not.toBeEmpty();
  await username.fill('ng-scaffold');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/profile\/settings$/);
  await page.locator('app-user-button button').first().click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();
  await expect(page.locator('app-login')).toBeVisible();
});

test('theme, direction, language and keyboard overlay focus persist through reload', async ({
  checkedPage: page,
}, info) => {
  await login(page);
  const settings = page.locator('app-customizer > button');
  await settings.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('radio', { name: 'Dark', exact: true }).check();
  await expect(page.locator('html')).toHaveClass(/theme-dark/);
  await dialog.getByRole('radio', { name: 'Right to left', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await accessible(page, info);
  await page.keyboard.press('Escape');
  await expect(settings).toBeFocused();
  await expect(page.locator('app-root')).not.toHaveAttribute('aria-hidden', 'true');
  await page.locator('app-translate-button > button').click();
  await page.getByRole('menuitemradio', { name: '简体中文' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.reload();
  await expect(page.locator('app-admin-layout')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveClass(/theme-dark/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await accessible(page, info);
  await page.locator('app-translate-button > button').click();
  await page.getByRole('menuitemradio', { name: '繁體中文' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  await page.reload();
  await expect(page.locator('app-admin-layout')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  await accessible(page, info);
});

test('deep links, unknown routes and skip navigation work under the Pages base path', async ({
  checkedPage: page,
}, info) => {
  await login(page, 'material/input');
  await expect(page.locator('app-material-input')).toBeVisible();
  await page.reload();
  await expect(page.locator('app-material-input')).toBeVisible();
  await page.goto('does-not-exist');
  await expect(page.locator('app-error-code')).toContainText('404');
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'Skip to main content' }).click();
  await expect(page.getByRole('main')).toBeFocused();
  await accessible(page, info);
});
