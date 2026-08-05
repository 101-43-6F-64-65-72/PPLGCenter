import { expect } from '@playwright/test';

export const TEST_ADMIN = {
  email: 'admin@studentcenter.id',
  password: 'admin1234',
};

export async function login(page, credentials = TEST_ADMIN) {
  await page.goto('/login');
  await page.locator('input[name="email"]').fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole('button', { name: /masuk ke student center/i }).click();
  await expect(page).toHaveURL(/\/profile/, { timeout: 15000 });
}

export async function expectLoggedOut(page) {
  await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
}
