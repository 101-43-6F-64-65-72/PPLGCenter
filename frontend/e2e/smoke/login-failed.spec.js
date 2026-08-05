import { test, expect } from '@playwright/test';

test('failed login', async ({ page }) => {
  // Clear any stale session before test
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/login');

  await page.locator('input[name="email"]').fill('wrong@studentcenter.id');
  await page.locator('input[name="password"]').fill('wrongpassword');
  await page.getByRole('button', { name: /masuk ke student center/i }).click();
  await expect(page.getByText(/login gagal|invalid email or password|gagal masuk/i).first()).toBeVisible();
});
