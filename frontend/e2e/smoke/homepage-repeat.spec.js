import { test, expect } from '@playwright/test';

for (let i = 1; i <= 5; i += 1) {
  test(`homepage navigation run ${i}`, async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).toBeVisible();
  });
}
