import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 4: Facility Booking', () => {
  test('Facility catalog loads and allows searching', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/fasilitas');

    // Heading verification
    await expect(page.getByRole('heading', { name: /katalog fasilitas/i }).first()).toBeVisible();

    // Search input verification
    const searchInput = page.getByPlaceholder(/cari fasilitas/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Aula');

    // Filter tabs verification
    await expect(page.getByRole('button', { name: 'Semua Fasilitas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Status Tersedia' })).toBeVisible();
  });
});
