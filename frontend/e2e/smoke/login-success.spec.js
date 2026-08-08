import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test('successful login', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByRole('button', { name: /keluar sesi/i }).first()).toBeVisible();
});
