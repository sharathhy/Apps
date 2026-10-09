import { expect, test } from '@playwright/test';

import { onboard, stored } from './helpers';

test('water: set a goal, log drinks and see progress', async ({ page }) => {
  await onboard(page);
  await page.goto('/water');
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  await expect(page).toHaveURL(/setup\/waterGoal/);
  await page.getByRole('textbox').fill('1000');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/water\/?$/);
  await page.getByRole('button', { name: /Add 500 ml of Water/ }).click();
  await page.getByRole('button', { name: /Add 500 ml of Water/ }).click();
  await expect(page.getByText('You reached your goal today')).toBeVisible();
  expect((await stored(page, 'water-v1')).state.entries).toHaveLength(2);
});

test('mood: check in, and see support lines for a self-harm mention', async ({ page }) => {
  await onboard(page);
  await page.goto('/mood');
  await page.getByRole('radio', { name: 'Okay' }).click();
  await page.getByRole('checkbox', { name: 'Rest' }).click();
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByText('Check-in saved.')).toBeVisible();

  await page.getByRole('radio', { name: 'Very low' }).click();
  await page.getByLabel('Note (optional)').fill('I want to die');
  await page.getByRole('button', { name: 'Save check-in' }).click();
  await expect(page.getByRole('button', { name: 'Call 14416' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Call 988' })).toBeVisible();
});

test('mood: write a journal entry', async ({ page }) => {
  await onboard(page);
  await page.goto('/journal');
  await page.getByRole('button', { name: 'Write' }).click();
  await page.getByRole('textbox').fill('A quiet evening with a book.');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/journal\/?$/);
  await expect(page.getByText('A quiet evening with a book.')).toBeVisible();
});

test('sleep: log last night', async ({ page }) => {
  await onboard(page, "Men's health");
  await page.goto('/sleep');
  await page.getByRole('radio', { name: 'Rested', exact: true }).click();
  await page.getByRole('button', { name: 'Save night' }).click();
  await expect(page.getByText('Night saved.')).toBeVisible();
  await expect(page.getByText(/1 night logged/)).toBeVisible();
});

test.describe('in the USA', () => {
  test.use({ locale: 'en-US' });

  test('water uses fluid ounces', async ({ page }) => {
    await onboard(page, "Men's health");
    await page.goto('/water');
    await page.getByRole('button', { name: /Add 8 fl oz of Water/ }).click();
    await expect(page.getByText('8 fl oz').first()).toBeVisible();
  });
});

test('cycle: add the last period, see estimates, log a day and export', async ({ page }) => {
  await onboard(page);
  await page.goto('/cycle');
  await page.getByRole('button', { name: 'Add', exact: true }).first().click();
  await expect(page).toHaveURL(/setup\/lastPeriod/);
  const start = new Date(Date.now() - 9 * 86_400_000);
  const dd = String(start.getDate()).padStart(2, '0');
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  await page.getByRole('textbox').fill(`${dd}/${mm}/${start.getFullYear()}`);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/cycle\/?$/);
  await expect(page.getByText('Day 10 of your cycle')).toBeVisible();
  await expect(page.getByText(/Not a form of contraception/)).toBeVisible();
  await expect(page.getByText(/does not provide medical advice/)).toBeVisible();

  await page.getByRole('radio', { name: 'Light' }).click();
  await page.getByRole('checkbox', { name: 'Headache' }).click();
  await page.getByRole('button', { name: 'Save day' }).click();
  await expect(page.getByText('Day saved.')).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download as CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/^cycle-.*\.csv$/);
  const cycle = (await stored(page, 'cycle-v1')).state;
  expect(Object.values(cycle.logs)).toHaveLength(1);
});

test('cycle is never offered to men', async ({ page }) => {
  await onboard(page, "Men's health");
  await expect(page.getByRole('tab', { name: 'Cycle' })).toHaveCount(0);
  await page.goto('/cycle');
  await expect(page.getByText('Day 1 of your cycle')).toHaveCount(0);
});

test('pregnancy: work out the due date, read the week and use the tools', async ({ page }) => {
  await onboard(page);
  await page.goto('/pregnancy');
  const lmp = new Date(Date.now() - 70 * 86_400_000);
  const dd = String(lmp.getDate()).padStart(2, '0');
  const mm = String(lmp.getMonth() + 1).padStart(2, '0');
  await page.getByLabel(/First day of your last period/).fill(`${dd}/${mm}/${lmp.getFullYear()}`);
  await expect(page.getByText(/Estimated due date:/)).toBeVisible();
  await page.getByRole('button', { name: 'Use this due date' }).click();
  await expect(page.getByText('10 weeks, 0 days')).toBeVisible();
  await expect(page.getByText(/Sources: ACOG, NHS/)).toBeVisible();
  await expect(page.getByText(/does not provide medical advice/)).toBeVisible();

  await page.getByRole('link', { name: 'Appointments' }).click();
  await expect(page).toHaveURL(/\/pregnancy-tools\/appointments\/?$/);
  const next = new Date(Date.now() + 5 * 86_400_000);
  await page.getByLabel("What it's for").fill('Dating scan');
  await page
    .getByLabel(/^Date/)
    .fill(
      `${String(next.getDate()).padStart(2, '0')}/${String(next.getMonth() + 1).padStart(2, '0')}/${next.getFullYear()}`,
    );
  await page.getByRole('button', { name: 'Save appointment' }).click();
  await expect(page.getByText('Dating scan')).toBeVisible();
  // The overview stays mounted under the tool page, so there are two disclaimers.
  await expect(page.getByText(/does not provide medical advice/).last()).toBeVisible();

  await page.goto('/pregnancy-tools/kicks');
  await page.getByRole('button', { name: 'Start counting' }).click();
  await page.getByRole('button', { name: /Add a movement/ }).click();
  await page.getByRole('button', { name: /Add a movement/ }).click();
  await page.getByRole('button', { name: 'Finish session' }).click();
  await expect(page.getByText('2 movements in 0 min')).toBeVisible();
  const stored2 = (await stored(page, 'pregnancy-v1')).state;
  expect(stored2.appointments).toHaveLength(1);
  expect(stored2.kicks).toHaveLength(1);
});

test('partner sharing explains itself and needs an account', async ({ page }) => {
  await onboard(page, "Men's health");
  await page.goto('/partner');
  await expect(page.getByText(/enter their code here/)).toBeVisible();
  await expect(page.getByText(/does not provide medical advice/)).toBeVisible();
});
