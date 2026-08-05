import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test('logout', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: /keluar sesi/i }).first().click();
  await expect(page).toHaveURL(/\/login/);
});
