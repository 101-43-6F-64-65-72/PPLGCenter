import { test, expect } from '@playwright/test';

test('failed login', async ({ page }) => {
  // Clear any stale session before test
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/login');

  await page.locator('select').selectOption('Admin');
  await page.locator('input[name="identifier"]').fill('wrong@studentcenter.id');
  await page.locator('input[name="password"]').fill('wrongpassword');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 });
});
