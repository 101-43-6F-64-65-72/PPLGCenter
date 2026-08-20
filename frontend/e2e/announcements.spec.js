import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 3: Announcements', () => {
  test('Announcements admin panel is accessible', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await expect(page.getByRole('heading', { name: /panel control center/i })).toBeVisible({ timeout: 15000 });

    // Switch to Announcements tab via sidebar or select dropdown
    const sidebarBtn = page.getByRole('button', { name: 'Mading Digital' });
    if (await sidebarBtn.count() > 0 && await sidebarBtn.isVisible()) {
      await sidebarBtn.click();
    } else {
      const selectLoc = page.locator('select').first();
      if (await selectLoc.count() > 0) {
        await selectLoc.selectOption('announcements');
      }
    }

    // Verify the announcements management UI loads
    await expect(page.getByRole('button', { name: /buat pengumuman mading/i })).toBeVisible({ timeout: 15000 });
  });
});
