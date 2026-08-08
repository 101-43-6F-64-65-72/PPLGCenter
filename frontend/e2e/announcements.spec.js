import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 3: Announcements', () => {
  test('Announcements admin panel is accessible', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Switch to Announcements tab via sidebar or select dropdown
    const sidebarBtn = page.getByRole('button', { name: 'Mading Digital' });
    if (await sidebarBtn.isVisible()) {
      await sidebarBtn.click();
    } else {
      await page.locator('select').first().selectOption('announcements');
    }

    // Verify the announcements management UI loads
    await expect(page.getByRole('button', { name: /buat pengumuman mading/i })).toBeVisible({ timeout: 10000 });
  });
});
