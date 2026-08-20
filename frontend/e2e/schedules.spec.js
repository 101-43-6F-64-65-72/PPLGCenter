import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 9: Schedule Feature', () => {
  test('Admin Schedule Management panel loads correctly', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    
    // Switch to schedules tab if select is present
    const selectTab = page.locator('select').first();
    if (await selectTab.isVisible()) {
      await selectTab.selectOption('schedules');
    }

    // Verify Schedule Management heading
    await expect(page.getByRole('heading', { name: /jadwal pelajaran/i })).toBeVisible({ timeout: 15000 });
  });
});
