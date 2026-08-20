import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 2: Dashboard', () => {
  test('Dashboard loads', async ({ page }) => {
    await login(page, TEST_ADMIN);
    // Navigate to admin dashboard if not already there, assuming /admin is the dashboard
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    // Find a unique heading or element that confirms the dashboard load
    await expect(page.getByRole('heading', { name: /panel control center/i })).toBeVisible({ timeout: 15000 });
  });
});
