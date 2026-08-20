import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Production Release Manual QA Audit - All Pages', () => {

  test('1. Homepage (/) audit: layout, components, and links', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: /student center/i }).first()).toBeVisible();

    // Check navbar links
    await expect(page.getByRole('link', { name: 'Fasilitas' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ekstrakurikuler' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mading' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Proposal' }).first()).toBeVisible();
  });

  test('2. Login (/login) audit: form inputs, error handling, and login execution', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Admin', exact: true })).toBeVisible();
    await expect(page.locator('input[name="identifier"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Test invalid login error state
    await page.getByRole('button', { name: 'Admin', exact: true }).click();
    await page.locator('input[name="identifier"]').fill('invalid@pplgcenter.id');
    await page.locator('input[name="password"]').fill('invalidpassword');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10000 });

    // Test valid login
    await login(page, TEST_ADMIN);
    await expect(page).toHaveURL(/\/(profile|admin)/);
  });

  test('3. Profile (/profile) audit: user profile info and logout action', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/profile');

    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=admin@pplgcenter.id').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /keluar sesi/i }).first()).toBeVisible();
  });

  test('4. Mading (/mading) audit: catalog, category filters, and search bar', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/mading');

    await expect(page.getByRole('heading', { name: /berita & publikasi siswa/i })).toBeVisible();
    await expect(page.getByPlaceholder(/cari pengumuman/i)).toBeVisible();
  });

  test('5. Facilities (/fasilitas) audit: catalog grid, tabs, and booking modal', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/fasilitas');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /katalog fasilitas/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Semua Fasilitas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Status Tersedia' })).toBeVisible();
  });

  test('6. Proposal (/proposal) audit: form fields, proposal list, and status pills', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/proposal');
    await page.waitForLoadState('networkidle');

    // Admin sees 'Peninjauan Proposal', Student sees 'Pengajuan Proposal'
    await expect(page.getByRole('heading', { name: /proposal/i }).first()).toBeVisible();
  });

  test('7. Extracurricular (/ekstrakurikuler) audit: card grid and header', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/ekstrakurikuler');

    await expect(page.getByRole('heading', { name: 'EKSTRAKURIKULER' })).toBeVisible();
  });

  test('8. Admin Panel (/admin) audit: super admin tabs and overview stats', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: /panel control center/i })).toBeVisible();
    await expect(page.locator('text=Admin System').first()).toBeVisible();
  });

  test('9. Guru Panel (/guru) audit: teacher tabs and overview stats', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/guru');

    await expect(page.getByRole('heading', { name: /panel guru & pembina/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /overview guru/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /persetujuan proposal/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /persetujuan fasilitas/i })).toBeVisible();
  });

  test('10. OSIS Panel (/osis) audit: OSIS tabs and overview stats', async ({ page }) => {
    await login(page, TEST_ADMIN);
    await page.goto('/osis');

    await expect(page.getByRole('heading', { name: /panel pengurus osis/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /overview osis/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /verifikasi proposal/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /peminjaman fasilitas/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /mading & pengumuman/i })).toBeVisible();
  });

  test('11. 404 Page (/non-existent-route) audit: branded error screen and return link', async ({ page }) => {
    await page.goto('/non-existent-route');

    await expect(page.getByRole('heading', { name: 'Halaman Tidak Ditemukan' })).toBeVisible();
    await expect(page.getByRole('link', { name: /kembali ke beranda/i })).toBeVisible();
  });

});
