import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test('logout', async ({ page }) => {
  await login(page);
  // Use JS click to bypass Playwright's viewport check for the fixed navbar button
  await page.locator('[title="Keluar Sesi"]').evaluate((el) => el.click());
  await expect(page).toHaveURL(/\/login/);
});
