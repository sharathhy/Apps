import { expect, type Page } from '@playwright/test';

/** Finishes onboarding for the given audience, allowing every listed data category. */
export async function onboard(
  page: Page,
  audience: "Women's health" | "Men's health" = "Women's health",
) {
  await page.goto('/');
  await page.waitForURL('**/onboarding');
  await page.getByRole('radio', { name: audience, exact: true }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: /Allow all/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByText('Your trackers')).toBeVisible();
}

export const stored = (page: Page, key: string) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), key);
