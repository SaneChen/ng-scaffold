/**
 * Validate interactive grid controls and lazy overlays beyond each page's initial axe scan.
 * How this file was built: Playwright interactions using accessible names and public UI.
 * Why: anonymous selection, expansion and pinning controls previously escaped unit-only checks.
 */
import { accessible, expect, login, test } from './helpers';

test('grid selection, sorting, expansion and pinning remain accessible', async ({
  checkedPage: page,
}, info) => {
  await login(page, 'tables/kitchen-sink');
  const grid = page.locator('mtx-grid');
  await grid.getByRole('checkbox', { name: 'Select all elements', exact: true }).check();
  await expect(page.locator('.selection')).toContainText('Selected rows: 20.');
  await grid.getByRole('checkbox', { name: 'Select all elements', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'Expandable rows', exact: true }).check();
  const expand = grid.getByRole('button', { name: 'Toggle details for 1 Hydrogen', exact: true });
  await expand.click();
  await expect(expand).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#element-details-1')).toBeVisible();
  await accessible(page, info);
  await grid.getByRole('button', { name: 'Position Not sorted', exact: true }).click();
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  await grid.getByRole('button', { name: 'Position Ascending', exact: true }).click();
  await expect(grid.locator('tbody tr').first()).toContainText('Calcium');
  await page.getByRole('checkbox', { name: 'Resizable columns', exact: true }).check();
  await grid.getByRole('button', { name: 'Position Descending', exact: true }).click();
  await grid.getByRole('button', { name: 'Position Not sorted', exact: true }).click();
  await expect(grid.locator('tbody tr').first()).toContainText('Hydrogen');
  await grid.locator('summary').click();
  await grid.getByRole('combobox', { name: 'Symbol', exact: true }).selectOption('left');
  await accessible(page, info);
});

test('select in a dialog keeps a named control and restores trigger focus', async ({
  checkedPage: page,
}, info) => {
  await login(page, 'forms/select');
  const trigger = page.getByRole('button', { name: 'Open the dialog', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('combobox', { name: 'City', exact: true })).toBeVisible();
  await accessible(page, info);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('address dialog validates, submits and restores its own trigger focus', async ({
  checkedPage: page,
}, info) => {
  await login(page, 'material/dialog');
  const trigger = page.getByRole('button', { name: 'Open address form', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  const firstName = dialog.getByRole('textbox', { name: 'First name', exact: true });
  await expect(firstName).toBeFocused();
  await dialog.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(firstName).toBeFocused();
  await accessible(page, info);
  await firstName.fill('Pat');
  await dialog.getByRole('textbox', { name: 'Last name', exact: true }).fill('Doe');
  await dialog
    .getByRole('textbox', { name: 'Shipping address', exact: true })
    .fill('42 Demo Street');
  await dialog.getByRole('textbox', { name: 'City', exact: true }).fill('Demo City');
  await dialog.getByRole('textbox', { name: 'Postal code', exact: true }).fill('12345');
  await dialog.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByText('Address submitted for this demo.', { exact: true })).toBeVisible();
});

test('photo viewer has a named dialog and Escape restores photo focus', async ({
  checkedPage: page,
}, info) => {
  await login(page, 'media/gallery');
  const photo = page.locator('.photos button').first();
  await expect(page.locator('.photos button')).toHaveCount(30);
  await photo.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await accessible(page, info);
  await page.keyboard.press('Escape');
  await expect(photo).toBeFocused();
});
