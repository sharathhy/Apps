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
