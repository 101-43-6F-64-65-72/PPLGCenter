import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 8: Profile', () => {
  test('User profile page loads with account info', async ({ page }) => {
    await login(page, TEST_ADMIN);

    // Section header verification
    await expect(page.locator('h1').first()).toBeVisible();

    // User details verification
    await expect(page.locator('text=admin@studentcenter.id').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /keluar sesi/i }).first()).toBeVisible();
  });
});
