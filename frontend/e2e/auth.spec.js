import { test, expect } from '@playwright/test';

test('auth flow capture', async ({ page }) => {
  const events = [];

  page.on('request', (request) => {
    if (request.url().includes('/api/auth/login')) {
      events.push({
        kind: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
      });
    }
  });

  page.on('response', async (response) => {
    if (response.url().includes('/api/auth/login')) {
      events.push({
        kind: 'response',
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        body: await response.text().catch(() => '<unreadable>'),
      });
    }
  });

  await page.goto('/login');
  await page.locator('input[name="email"]').fill('admin@studentcenter.id');
  await page.locator('input[name="password"]').fill('admin1234');
  await page.getByRole('button', { name: /masuk ke student center/i }).click();
  await expect(page).toHaveURL(/\/profile/);

  const storage = await page.evaluate(() => ({
    url: location.href,
    cookies: document.cookie,
    localStorage: { ...localStorage },
    sessionStorage: { ...sessionStorage },
  }));

  console.log('AUTH_EVENTS=' + JSON.stringify(events, null, 2));
  console.log('AUTH_STORAGE=' + JSON.stringify(storage, null, 2));

  expect(events.length).toBeGreaterThan(0);
});
