import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Authentication, Session Refresh & Navigation Verification', () => {
  test('Login, Logout, Session Refresh, and Protected Route Navigation', async ({ page }) => {
    // 1. LOGIN VERIFICATION
    await login(page, TEST_ADMIN);
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('text=admin@studentcenter.id').first()).toBeVisible();

    // 2. REFRESH SESSION VERIFICATION
    const tokenBeforeReload = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenBeforeReload).toBeTruthy();

    await page.reload();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.locator('text=admin@studentcenter.id').first()).toBeVisible();

    // 3. NAVIGATION VERIFICATION
    await page.goto('/fasilitas');
    await expect(page).toHaveURL(/\/fasilitas/);
    await expect(page.getByRole('heading', { name: /katalog fasilitas & peralatan/i })).toBeVisible();

    await page.goto('/mading');
    await expect(page).toHaveURL(/\/mading/);
    await expect(page.getByRole('heading', { name: /berita & publikasi siswa/i })).toBeVisible();

    await page.goto('/proposal');
    await expect(page).toHaveURL(/\/proposal/);
    await expect(page.getByRole('heading', { name: 'Pengajuan Proposal' })).toBeVisible();

    await page.goto('/ekstrakurikuler');
    await expect(page).toHaveURL(/\/ekstrakurikuler/);
    await expect(page.getByRole('heading', { name: 'EKSTRAKURIKULER' })).toBeVisible();

    // 4. ROLE PROTECTION & ADMIN ACCESS VERIFICATION
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: /panel super admin/i })).toBeVisible();

    // 5. LOGOUT VERIFICATION
    await page.goto('/profile');
    await page.getByRole('button', { name: /keluar sesi/i }).first().click();
    await expect(page).toHaveURL(/\/login/);

    const postLogoutToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(postLogoutToken).toBeNull();
  });
});
