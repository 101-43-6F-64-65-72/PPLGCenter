import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 5: Proposals', () => {
  test('Proposal page loads and displays heading', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/proposal');
    await page.waitForLoadState('networkidle');

    // Admin sees 'Peninjauan Proposal', Student sees 'Pengajuan Proposal'
    await expect(page.getByRole('heading', { name: /proposal/i }).first()).toBeVisible();
  });
});
