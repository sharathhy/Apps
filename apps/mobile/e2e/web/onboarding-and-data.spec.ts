import { expect, test } from '@playwright/test';

import { onboard, stored } from './helpers';

test('men never see Cycle or Pregnancy', async ({ page }) => {
  await onboard(page, "Men's health");
  await expect(page.getByRole('button', { name: 'Open Cycle' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open Pregnancy' })).toHaveCount(0);
  const consent = await stored(page, 'consent-v1');
  expect(Object.keys(consent.state.records)).not.toContain('cycle');
});

test('onboarding earns the welcome badge and it shows in achievements', async ({ page }) => {
  await onboard(page);
  await page.getByRole('button', { name: /Open notifications/ }).click();
  await expect(page.getByText('Welcome aboard')).toBeVisible();
  await page.goto('/achievements');
  await expect(page.getByText(/Earned/)).toBeVisible();
});

test('export downloads a JSON file and delete clears everything', async ({ page }) => {
  await onboard(page);
  await page.goto('/settings');
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Export my data' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^wellness-export-\d{4}-\d{2}-\d{2}\.json$/);

  await page.goto('/privacy/delete');
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await page.waitForURL('**/onboarding');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test('notification setup: opt in, add and delete a reminder', async ({ page }) => {
  await onboard(page);
  await page.goto('/notifications/settings');
  await page.getByRole('switch', { name: 'Allow notifications' }).click();
  await page.getByRole('switch', { name: 'Reminders', exact: true }).click();
  await page.getByRole('link', { name: 'Add reminder' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: /Edit reminder: Water/ })).toBeVisible();
  expect((await stored(page, 'reminders-v1')).state.reminders).toHaveLength(1);

  await page.getByRole('button', { name: /Edit reminder: Water/ }).click();
  await page.getByRole('button', { name: 'Delete reminder' }).click();
  expect((await stored(page, 'reminders-v1')).state.reminders).toHaveLength(0);
});
