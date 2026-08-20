import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 7: User Management', () => {
  test('Super Admin panel loads with user access pill', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Panel title verification
    await expect(page.getByRole('heading', { name: /panel control center/i })).toBeVisible({ timeout: 15000 });

    // Access role pill
    await expect(page.locator('text=Admin System').first()).toBeVisible();
  });
});
