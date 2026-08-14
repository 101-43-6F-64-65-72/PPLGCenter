import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 6: Extracurricular', () => {
  test('Extracurricular page loads and displays heading', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/ekstrakurikuler');

    // Heading verification
    await expect(page.getByRole('heading', { name: 'EKSTRAKURIKULER' })).toBeVisible();

    // Check description text
    await expect(page.locator('text=Wadah pengembangan minat, bakat, dan potensi diri siswa SMKN 2 Surakarta')).toBeVisible();
  });
});
