import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 7: User Management', () => {
  test('Super Admin panel loads with user access pill', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/admin');

    // Panel title verification
    await expect(page.getByRole('heading', { name: /panel super admin/i })).toBeVisible();

    // Access role verification
    await expect(page.locator('text=Super Admin / Waka Kesiswaan')).toBeVisible();

    // Navigation tabs verification
    await expect(page.getByRole('button', { name: /overview admin/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /persetujuan proposal final/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /kelola sarpras & booking/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /publikasi mading/i })).toBeVisible();
  });
});
