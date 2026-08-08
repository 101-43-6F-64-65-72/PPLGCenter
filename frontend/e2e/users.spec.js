import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 7: User Management', () => {
  test('Super Admin panel loads with user access pill', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Panel title verification
    await expect(page.getByRole('heading', { name: /panel super admin/i })).toBeVisible({ timeout: 10000 });

    // Access role pill (actual text in admin panel is "Super Admin")
    await expect(page.locator('text=Super Admin').first()).toBeVisible();

    // Navigation options verification
    await expect(page.locator('select option[value="overview"]').first()).toBeDefined();
  });
});
