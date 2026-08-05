import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 5: Proposals', () => {
  test('Proposal page loads and displays heading', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/proposal');

    // Heading verification
    await expect(page.getByRole('heading', { name: 'Pengajuan Proposal' })).toBeVisible();

    // Check Proposal section headers
    await expect(page.getByRole('heading', { name: /form pengajuan|perbarui proposal/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Proposal Saya' })).toBeVisible();
  });
});
