import { test, expect } from '@playwright/test';
import { login, TEST_ADMIN } from './helpers/auth';

test.describe('Module 1: Authentication', () => {
  test('Login, JWT persistence, and Logout', async ({ page }) => {
    // Login
    await login(page, TEST_ADMIN);
    await expect(page).toHaveURL(/\/profile/);
    
    // JWT persistence
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    
    // Refresh
    await page.reload();
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByRole('heading', { name: 'Profil Saya' })).toBeVisible();

    // Logout
    await page.getByRole('button', { name: /keluar sesi/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
    const postLogoutToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(postLogoutToken).toBeNull();
  });
});
