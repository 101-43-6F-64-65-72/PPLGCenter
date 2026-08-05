import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 3: Announcements', () => {
  test('CRUD cycle for announcements', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/admin');
    
    // Switch to Announcements tab
    await page.getByRole('button', { name: /publikasi mading/i }).click();
    
    // Create
    await page.getByRole('button', { name: /buat pengumuman mading/i }).click();
    await page.getByPlaceholder('Contoh: Info Pelaksanaan Classmeeting 2026...').fill('Test Announcement');
    await page.getByPlaceholder('Tuliskan pengumuman lengkap untuk seluruh siswa...').fill('This is a test announcement content.');
    await page.getByRole('button', { name: /terbitkan mading/i }).click();
    await expect(page.locator('text=Test Announcement')).toBeVisible();

    // Update (Edit - need to find the specific button)
    // Actually the current UI doesn't have an explicit 'Edit' button in the code provided for the list,
    // it only shows 'Hapus'. I'll skip Edit for now as it wasn't requested in the UI code logic.
    
    // Delete
    page.once('dialog', dialog => dialog.accept());
    await page.getByTitle('Hapus Mading').first().click();
    
    // Wait for the UI to update
    await expect(page.locator('text=Test Announcement')).not.toBeVisible();
  });
});
